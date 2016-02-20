/// <reference path="../../../typings/browser/ambient/underscore/underscore.d.ts" />
/// <reference path="util.ts"/>
/// <reference path="DFExpr.ts"/>

module Eddiflow {
  class DFNetwork {
    // internal map from variable names to expressions
    private network: Object;
    constructor(){
      this.network = {}
    }
    // convert json-y objects to DF expressions
    // assumes structure is:
    // {tag: "binop" | "unop" | "app" | "number" | "var",
    //  body: <depends on tag>
    // }



    private parseExpr(ast: any): Eddiflow.expr {
      if (!_.has(ast, 'tag') || !_.has(ast, 'body')) {
        throw new BadExprFormat("input object does not have a tag/body: " + ast.toString());
      } else {
        let body = ast.body;
        let ret: expr;
        // TODO: convert to use match
        switch(ast.tag) {
          case 'binop':
            // body looks like: {op: string, lhs: expr, rhs: expr}
            if (!_.has(body, 'lhs') || !_.has(body, 'rhs') || !_.has(body, 'op'))
              throw new BadExprFormat("malformed body tag: " + ast.toString())
            let binop = match(
              ast.op, (l, r) => l == r,
              [['+', bop.Pls], ['-', bop.Min], ['*', bop.Tim], ['/', bop.Div]],
              new BadExprFormat("expected a binop and found: " + ast.op)
            );
            let lhs = this.parseExpr(body.lhs);
            let rhs = this.parseExpr(body.rhs);
            ret = new BinOp(binop, lhs, rhs);
            break;
          case 'unop':
            // body looks like: {op: string, inner: expr}
            if (!_.has(body, 'inner') || !_.has(body, 'op'))
              throw new BadExprFormat("malformed body tag: " + ast.toString())
            let op = this.parseUop(body.op); //TODO
            let inner = this.parseExpr(body.inner);
            break;
          case 'app':
            break;
          case 'number':
            break;
          case 'var':
            break;
          default:
            throw new BadExprFormat("input object tag is malformed: " + ast.toString());
        }

      }
      return new Var("foo");
    }
  }
}
