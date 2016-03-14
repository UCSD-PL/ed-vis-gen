
import _ = require('underscore');
import Util = require('./util');
import DFE = require('./dfexpr');

class DFNetwork {
  // internal map from variable names to expressions
  private network: Util.Map<DFE.expr[]>;
  // cache of variable values, mapping from name to value.
  private cachedVals: Util.Map<number>;
  // bookkeeping for unevaluated/evaluated variables. we ensure variables
  // are only ever evaluated *once* per evaluation cycle. if a variable
  // maps to true in here, it is safe to pull its value from cachedVals.
  private forcedVals: Util.Map<boolean>;

  // map from variables to things that depend on them (i.e., forward dependencies).
  // so, if i have x <- y + 1 in the network, this map should encode
  // y -> x.
  private affectedBy: Util.Map<string[]>;

  // parser, currently generated by jison p passed into the constructor;
  private parser: any;

  private static shouldDebug: boolean = true;

  constructor(parserObj: any){
    this.network = {};
    this.cachedVals = {};
    this.forcedVals = {};
    this.affectedBy = {};
    this.parser = parserObj;
  }

  public dumpGraph() {
    console.log("DEFINITIONS:")
    for (var variable in this.network) {
      let outstr = variable.concat(
        " <- ",
        this.network[variable].map(DFE.mkString).join(','));
      console.log(outstr);
    }
    console.log("DEPENDENCIES:");

    for (var variable in this.network) {
      let deps = this.network[variable].map(
        _.partial(DFNetwork.collectVars, {}));
      let vdeps = Util.flatMap(deps, (res) => res[0]);
      console.log(variable.concat(" DEPENDS ON {", vdeps.map((v) => v.ref).join(), "}"));
    }

    for (var variable in this.affectedBy) {
      console.log(variable.concat(" AFFECTS {", this.affectedBy[variable].join(), "}"));
    }
  }
  public dumpSolverState() {
    console.log("VALUES/STATE:");
    for (var variable in this.cachedVals) {
      let outstr = variable.concat(" -> ", this.cachedVals[variable].toString());
      outstr += " : ";
      if (this.forcedVals[variable]) {
        outstr += "CLEAN";
      } else {
        outstr += "DIRTY";
      }
      console.log(outstr);
    }
  }

  // convert json-y objects to DF expressions
  // assumes structure is:
  // {tag: "binop" | "unop" | "app" | "number" | "var",
  //  body: <depends on tag>
  // }


  // public parse api: if given a string, invoke the parser and convert it.
  // otherwise, directly parse an ast.
  public makeExpr(input: any|string): DFE.expr {
    let inter:any;
    if (typeof input == 'string') {
      inter = this.parseStr(input);
    } else {
      inter = input;
    }

    return DFNetwork.parseExpr(inter);
  }

  // helpers for op parsing
  private static parseBinop(op: string): DFE.bop {
    return Util.match(op,
      (l, r) => l == r,
      [['+', DFE.bop.Pls], ['-', DFE.bop.Min], ['*', DFE.bop.Tim], ['/', DFE.bop.Div]],
      new Util.BadExprFormat("expected a binop and found: " + op)
    );
  }
  private static parseUop(op: string): DFE.uop {
    return Util.match(op,
      (l, r) => l == r,
      [['-', DFE.uop.Neg]],
      new Util.BadExprFormat("expected a uop and found: " + op)
    );
  }

  // helper to parse strings into structured JSON objects
  private parseStr(s: String): any {
    return this.parser.parse(s);
  }

  // helper to parse exprs from (structured) JSON objects
  private static parseExpr(ast: any): DFE.expr {
    if (!_.has(ast, 'tag') || !_.has(ast, 'body')) {
      throw new Util.BadExprFormat("input object does not have a tag/body: " + ast.toString());
    } else {
      let body = ast.body;
      let ret: DFE.expr;
      // TODO: convert to use match
      switch(ast.tag) {
        case 'binop':
          //console.log("parsing as bop: ");
          //console.log(ast);
          // body looks like: {op: string, lhs: expr, rhs: expr}
          if (!_.has(body, 'lhs') || !_.has(body, 'rhs') || !_.has(body, 'op'))
            throw new Util.BadExprFormat("malformed body tag: " + ast.toString())
          let binop = this.parseBinop(body.op)
          let lhs = this.parseExpr(body.lhs);
          let rhs = this.parseExpr(body.rhs);
          ret = new DFE.BinOp(binop, lhs, rhs);
          break;
        case 'unop':
          // body looks like: {op: string, inner: expr}
          if (!_.has(body, 'inner') || !_.has(body, 'op'))
            throw new Util.BadExprFormat("malformed body tag: " + ast.toString())
          let unop = this.parseUop(body.op);
          let inner = this.parseExpr(body.inner);
          ret = new DFE.UnOp(unop, inner);
          break;
        case 'app':
          ret = new DFE.FunApp(); // TODO
          break;
        case 'number':
          // body is a number
          let result = parseFloat(ast.body);
          // isNan checks if the conversion succeeded, while the funky regex
          // makes sure body isn't all whitespace
          if (/^\s*$/.test(ast.body) || isNaN(result))
            throw new Util.BadExprFormat("expected a numeric body: " + ast.toString());

          ret = result;
          break;
        case 'var':
          // body is a string (variable reference)
          if (typeof(body) != 'string')
            throw new Util.BadExprFormat("expected a string body: " + ast.toString());
          ret = new DFE.Var(body);
          break;
        default:
          throw new Util.BadExprFormat("input object tag is malformed: " + ast.toString());
      }

      return ret;

    }

  }

  // Public API: intended usage is
  // <initialize>
  // ... a bunch of addDecl calls ...
  // run:
  // ... getValue calls ...
  // ... a bunch of suggestValue calls, no getValue calls...
  // resolve() -> goto run


  // getter for a value.
  public getValue(name: string): number { return this.cachedVals[name]; }


  // add a dataflow declaration to the network
  public addDecl(name: string, expression:string, initVal: number = 0): void {
    let body = this.makeExpr(expression);
    if (name in this.network)
      this.network[name].push(body);
    else
      this.network[name] = [body];
    this.cachedVals[name] = initVal; // don't actually evaluate the expr yet
    this.forcedVals[name] = false; // mark the new variable as dirty

    if (DFNetwork.shouldDebug) {
      console.log("added: ".concat(name, " -> ", expression));
      this.dumpGraph();
    }
  }

  // compute forward variable dependencies and transition to suggest/query mode.
  public finalizeDecls(): void {
    if (DFNetwork.shouldDebug) {
      console.log("finalizing with state: ");
      this.dumpGraph();
      this.dumpSolverState();
    }
    // initialize affected lists
    for (var decl in this.network) {
      this.affectedBy[decl] = [];
    }
    // for each variable v1, if another variable v2 mentions v1, v2 is a forward dependency of v1
    for (var v1 in this.network) {
      for (var v2 in this.network) {
        let fdeps:DFE.Var[] = Util.flatMap(
          this.network[v2].map(_.partial(DFNetwork.collectVars, {})),
          (vs) => vs[0]
          );
        if ( fdeps.some((v) => v.ref == v1)
          ) {
            this.affectedBy[v1].push(v2);
          }
        }
    }

    if (DFNetwork.shouldDebug) {
      console.log("finalized to state:");
      this.dumpGraph();
      this.dumpSolverState();
    }
  }

  // tell the system a variable needs a specific value.
  // mark all the variables forward dependencies as stale.
  public suggestValue(name: string, v: number): void {
    let oldVal = this.cachedVals[name];
    this.forcedVals[name] = true;
    if (oldVal != v) {
      this.cachedVals[name] = v;
      _.each(this.affectedBy[name],
        (stale: string) => {this.forcedVals[stale] = false;}
      );
    }

    if (DFNetwork.shouldDebug) {
      console.log("suggested value for ".concat(name, " => ", v.toString(), " with result:"));
      this.dumpSolverState();
    }

  }

  // process all suggested value updates and resolve the network
  public resolve(): void {
    if (DFNetwork.shouldDebug) {
      console.log("solving");
      this.dumpSolverState();
    }

    // get the next stale value
    let self = this;
    let find = function() {
      for (var variable in self.forcedVals) {
        if (!self.forcedVals[variable])
          return variable;
      }
      return undefined;
    }

    // so long as there's a stale value, evaluate its expression
    let next: string = find();
    while (next != undefined) {
      if (DFNetwork.shouldDebug)
        console.log("evaling: " + next);
      this.evalVariable(next);
      next = find();
    }

    if (DFNetwork.shouldDebug) {
      console.log("solved to");
      this.dumpSolverState();
    }
  }

  private evalVariable(varName: string): number {

    // if we've already evaluated a variable, return its cached value
    if (this.forcedVals[varName])
      return this.cachedVals[varName];

    // otherwise, evaluate all the dependencies for a variable...
    let varExprs = this.network[varName];
    let deps = _.map(varExprs, _.partial(DFNetwork.collectVars, {}));
    let vdeps = Util.flatMap(deps, (vs) => vs[0]);
    _.each(vdeps, (varble: DFE.Var) => this.evalVariable(varble.ref));

    // ...evaluate the variable and record the result...
    let rets = varExprs.map((ve) => this.eval(ve));
    let res: number = rets[0];
    if (!_.every(rets, _.identity.apply(res))) {
      console.log("ERROR: exprs did not evaluate to the same result:");
      console.log("for ".concat(varName, " : "));
      console.log(varExprs.toString());
      this.dumpSolverState();
    }
    this.cachedVals[varName] = res;
    this.forcedVals[varName] = true;

    // ...and evaluate everything that depends on the variable.
    let forwardDeps = this.affectedBy[varName];
    _.each(forwardDeps, (vname:string) => {
      if (!this.forcedVals[vname]) {
        this.evalVariable(vname);
      }}
    );

    return res;
  }
  // helper function for calculating dependencies: return all the free variables
  // in an expression (i.e., what the expression depends on)
  private static collectVars(seen: Util.Map<boolean>, e: DFE.expr) : [DFE.Var[], Util.Map<boolean>] {
    if (e instanceof DFE.BinOp) {
      let [lvs, lseen] = DFNetwork.collectVars(seen, e.lhs);
      let [rvs, rseen] = DFNetwork.collectVars(lseen, e.rhs);
      return [lvs.concat(rvs), rseen];
    } else if (e instanceof DFE.UnOp) {
      return DFNetwork.collectVars(seen, e.inner);
    } else if (e instanceof DFE.FunApp) {
      throw new Util.Unimplemented("FunApp freevars");
    } else if (e instanceof DFE.Var) {
      let res = {};
      res[e.ref] = true;
      return [[e], _.extend(seen, res)];
    } else if (typeof e === 'number') {
      return [[], seen];
    } else {
      throw new Util.Unimplemented("Unimplemented expr: " + e.toString());
    }
  }
  // TODO: convert this into an interative function
  // TODO: lift dependencies into a global
  public eval(e: DFE.expr): number {
    if (DFNetwork.shouldDebug)
      console.log('debugging: ' + DFE.mkString(e));
    let ret: number;
    if (e instanceof DFE.BinOp) {
      let lv = this.eval(e.lhs);
      let rv = this.eval(e.rhs);
      ret = Util.match(e.op, (l, r) => l == r,
        [[DFE.bop.Pls, lv + rv], [DFE.bop.Min, lv - rv],
         [DFE.bop.Tim, lv * rv], [DFE.bop.Div, lv / rv]]
      );
    } else if (e instanceof DFE.UnOp) {
      let inner = this.eval(e.inner);
      ret = Util.match(e.op, (l, r) => l == r,
        [[DFE.uop.Neg, -1 * inner]]
      );
    } else if (e instanceof DFE.FunApp) {
      // TODO
      throw new Util.Unimplemented("evaluating funapp");
    } else if (typeof e === 'number') {
      ret = e;
    } else if (e instanceof DFE.Var) {
      ret = this.evalVariable(e.ref);
    } else {
      throw new Util.Unimplemented("unimplemented expr: " + e.toString())
    }
    return ret;
  }
}

export = DFNetwork;
