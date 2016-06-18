import S = require('./Shapes')
import U = require('../util/Util')
import V = require('./Variable')
import Cass = require('cassowary')
// import assert from 'assert'


// immutable program
// we expect to rarely add/remove shapes and other program elements
export class Program {
  constructor(public shapes: Set<S.Shape>, public allFrees: Map<S.DragPoint, Set<V.Variable>>) {}
  public static empty(): Program {
    return new Program( new Set<S.Shape>(), new Map<S.DragPoint, Set<V.Variable>>())
  }

  // (mostly) immutable extension functions
  public addShape(s: S.Shape) {
    let newFrees: Map<S.DragPoint, Set<V.Variable>>
    if (s instanceof S.DragPoint) {
      newFrees = U.copy(this.allFrees)
      newFrees.set(s, new Set<V.Variable>())
    } else {
      newFrees = this.allFrees
    }

    return new Program(U.add(this.shapes, s), newFrees)
  }

  public addFrees(p: S.DragPoint, frees: Set<V.Variable>) {
    let newFrees = U.copy(this.allFrees)
    newFrees.set(p, frees)
    return new Program(this.shapes, newFrees)
  }
}

// mutable state store
// we expect to frequently update internal elements of the store
export class Store {
  private csolver: Cass.SimplexSolver
  private cvars: Set<V.CassVar>
  private cstays: Map<V.CassVar, Cass.Equation> // I might not need the variable part...
  private prims: Map<V.Primitive, number>

  constructor() {
    this.csolver = new Cass.SimplexSolver()
    this.csolver.autoSolve = false
    this.cvars = new Set<V.CassVar>()
    this.prims = new Map<V.Primitive, number>()
    this.cstays = new Map<V.CassVar, Cass.Equation>()
  }

  public debug() {
    console.log('pvars:')
    console.log(this.prims)
    console.log('cvars:')
    console.log(this.cvars)
    console.log('stays:')
    console.log(this.cstays)
  }

  // helper: create a stay equation for a cassowary variable
  // i.e. v = v.value
  private static makeStay(v: V.CassVar): Cass.Equation {
    let l = Cass.Expression.fromVariable(v._value)
    let r = Cass.Expression.fromConstant(v._value.value)
    return new Cass.Equation(l, r)
  }

  private clearStays(): void {
    // console.log('stays:')
    // console.log(this.cstays)
    for (let [vr, stay] of this.cstays) {
      this.csolver.removeConstraint(stay)
    }
    this.cstays.clear()
  }

  private addStays(frees: Set<V.Variable>): void {
    let pinned = U.filter(this.cvars, i => !frees.has(i))
    for (let varble of pinned) {
      let newStay = Store.makeStay(varble)
      this.cstays.set(varble, newStay)
      this.csolver.addConstraint(newStay)
    }
  }



  // refresh stay equations in cassowary system
  private refreshStays(frees: Set<V.Variable>): void {
    this.clearStays()
    this.addStays(frees)
  }

  public addEq(e: Cass.Equation): void {
    this.csolver.addConstraint(e)
  }

  public suggestEdits(edits: Map<V.Variable, number>, frees: Set<V.Variable>): void {

    // foreach free variable: remove the corresponding stay from cass's system
    // foreach edit:
    //  for cass vars, suggest the edit to the solver.
    //  for prims, directly set the value if free.
    if (U.DEBUG) {
      console.log('edits, frees:')
      console.log(edits)
      console.log(frees)
      console.log('before edit:')
      this.debug()
    }
    this.clearStays()

    // only start an edit if an edit will be suggested
    let nonempty = U.exists(edits, ([v, _]) => v instanceof V.CassVar)

    for (let [eVar, eValue] of edits) {
      if (eVar instanceof V.CassVar) {
        this.csolver.addEditVar(eVar._value, Cass.Strength.medium, 1)
      }
    }

    if (nonempty)
      this.csolver.beginEdit()

    for (let [eVar, eValue] of edits) {
      if (eVar instanceof V.CassVar) {
        this.csolver.suggestValue(eVar._value, eValue)
      } else if (eVar instanceof V.Primitive) {
        this.prims.set(eVar, eValue)
      } else {
        console.log("unhandled edit: " + [eVar, eValue])
        assert(false)
      }
    }


    // finally, close the edit and resolve the solver.
    this.addStays(frees)
    this.csolver.solve()

    if (nonempty)
      this.csolver.endEdit()

    // stays are now stale: refresh them
    this.refreshStays(new Set<V.Variable>())

    if (U.DEBUG) {
      console.log('after edit:')
      this.debug()

    }
  }

  public collectVars() : Set<V.Variable> {
    let ret = new Set<V.Variable>()
    this.cvars.forEach(v => ret.add(v))
    this.prims.forEach((_, k) => ret.add(k))
    return ret
  }




  // return constructed variables for use in maps/folds
  public addVar(typ: V.VType, name: string, val: number): V.Variable {
    let ret: V.Variable
    switch (typ) {
      case V.VType.Prim:
        ret = new V.Primitive(name)
        this.prims.set(ret as V.Primitive, val)
        break
      case V.VType.Cass:
        ret = new V.CassVar(name, val)
        this.cvars.add(ret as V.CassVar)
        this.refreshStays(new Set<V.Variable>())
        break
      default:
        console.log('adding unhandled variable type: ' + V.VType[typ])
        assert(false, 'bad variable type for addvar')
        break
    }
    return ret
  }

  public eval() : Map<V.Variable, number> {
    let ret = new Map<V.Variable, number>()
    for (let cv of this.cvars) {
      ret.set(cv, cv._value.value)
    }
    for (let [pvar, pval] of this.prims){
      ret.set(pvar, pval)
    }
    return ret
  }


  public getValues(vars: V.Variable[]): number[] {
    return vars.map(v => {
      if (v instanceof V.Primitive)
        return this.prims.get(v)
      else if (v instanceof V.CassVar)
        return v._value.value
      else
        assert(false) // dead code
    })
  }
}

// package up a program and store
export class State {

  // TODO: convert dragged to option
  constructor(public prog: Program, public store: Store,
              public dragging: boolean, public draggedPoint: S.DragPoint){}

  public static empty(): State {
    return new State( Program.empty(), new Store(), false, null)
  }

  // delegate to member instances
  public addVar(typ: V.VType, name: string, val: number): V.Variable {
    return this.store.addVar(typ, name, val)
  }


  // given a store and x,y coordinates, make new cassowary variables corresponding
  // to the x, y values and wrap in a point.
  // mutates this to add the new variable
  public allocVar(v: number, prefix?: string): V.CassVar {
    prefix = prefix || "V"
    let suffix = 0
    let sVals = this.eval()
    while (U.exists(sVals, ([k, v]) => k.name == (prefix + suffix.toString())))
      ++suffix

    return this.addVar(V.VType.Cass, prefix + suffix.toString(), v) as V.CassVar
  }
  // mutates this to add x, y, and r
  allocPoint(p: U.Point): S.DragPoint {
    let [x, y, r] = [this.allocVar(p.x), this.allocVar(p.y), this.allocVar(5)]
    return new S.DragPoint(x, y, r, "blue")
  }

  // given an expression, allocate a new variable, add to the store, and
  // return an equation for var = expr.
  public makeEquation(e: Cass.Expression, v: number): [V.CassVar, Cass.Equation] {
    let varValue = -e.constant
  //  console.log(e)
    let retVar = this.allocVar(v)
    let eq = new Cass.Equation(retVar.toCExpr(), e)
    return [retVar, eq]
  }


  public addShape(s: S.Shape): State {
    // add the shape, as well as edit-points, edit-equations, and free variables
    let editPoints = new Map<S.DragPoint, Set<V.Variable>>()
    let editEqs = new Set<Cass.Equation>()
    let vals = this.eval()

    let newProg = this.prog
    // assumes each shape has CassVar variables, which is not realistic... TODO
    if (s instanceof S.Line) {
      // foreach point on the line, add a drag point with the underlying variables
      s.points.forEach(([x, y]) => {
        let r = this.allocVar(3.5)
        let np = new S.DragPoint(x, y, r, "blue")
        let newFrees = (new Set<V.Variable>()).add(x).add(y)
        editPoints.set(np, newFrees)
      })

    } else if (s instanceof S.Arrow || s instanceof S.Spring) {
      // put a drag point on the base, and a drag point at the end. fix
      // the end with equations.
      let [r1, r2] = [this.allocVar(3.5), this.allocVar(3.5)]
      let bp = new S.DragPoint(s.x, s.y, r1, "blue")

      let endXExpr = (s.x as V.CassVar).toCExpr().plus(
        (s.dx as V.CassVar).toCExpr()
      ) // TODO
      let endYExpr = (s.y as V.CassVar).toCExpr().plus(
        (s.dy as V.CassVar).toCExpr()
      ) // TODO

      let [endX, endXEq] = this.makeEquation(endXExpr, vals.get(s.x) + vals.get(s.dx))
      let [endY, endYEq] = this.makeEquation(endYExpr, vals.get(s.y) + vals.get(s.dy))
      let baseFrees = (new Set<V.Variable>()).add(s.x).add(s.y).add(endX).add(endY) // gross
      let endFrees = (new Set<V.Variable>()).add(s.dx).add(s.dy).add(endX).add(endY)
      let ep = new S.DragPoint(endX, endY, r2, "blue")

      editEqs.add(endXEq).add(endYEq)
      editPoints.set(bp, baseFrees).set(ep, endFrees)

    } else if (s instanceof S.Circle) {
      // point in the middle, point on the right edge
      let [r1, r2] = [this.allocVar(3.5), this.allocVar(3.5)]
      let bp = new S.DragPoint(s.x, s.y, r1, "blue")

      let endXExpr = (s.x as V.CassVar).toCExpr().plus(
        (s.r as V.CassVar).toCExpr()
      ) // TODO

      let [endX, endXEq] = this.makeEquation(endXExpr, vals.get(s.x) + vals.get(s.r))
      let baseFrees = (new Set<V.Variable>()).add(s.x).add(s.y).add(endX)
      let endFrees = (new Set<V.Variable>()).add(s.r).add(endX)
      let ep = new S.DragPoint(endX, s.y, r2, "blue")

      editEqs.add(endXEq)
      editPoints.set(bp, baseFrees).set(ep, endFrees)
    } else if (s instanceof S.Rectangle || s instanceof S.Image) {
      let [r1, r2] = [this.allocVar(3.5), this.allocVar(3.5)]
      let bp = new S.DragPoint(s.x, s.y, r1, "blue")

      let endXExpr = (s.x as V.CassVar).toCExpr().plus(
        (s.dx as V.CassVar).toCExpr()
      ) // TODO
      let endYExpr = (s.y as V.CassVar).toCExpr().minus(
        (s.dy as V.CassVar).toCExpr()
      ) // TODO

      let [endX, endXEq] = this.makeEquation(endXExpr, vals.get(s.x) + vals.get(s.dx))
      let [endY, endYEq] = this.makeEquation(endYExpr, vals.get(s.y) - vals.get(s.dy))
      let baseFrees = (new Set<V.Variable>()).add(s.x).add(s.y).add(endX).add(endY) // gross
      let endFrees = (new Set<V.Variable>()).add(s.dx).add(s.dy).add(endX).add(endY)
      let ep = new S.DragPoint(endX, endY, r2, "blue")

      editEqs.add(endXEq).add(endYEq)
      editPoints.set(bp, baseFrees).set(ep, endFrees)
    } else {
      console.log('unhandled shape for adding edit points: ' + s.toString())
      assert(false)
    }

    newProg = newProg.addShape(s)

    for (let [dp, frees] of editPoints) {
      newProg = newProg.addShape(dp)
      newProg = newProg.addFrees(dp, frees)
    }

    for (let editEq of editEqs)
      this.store.addEq(editEq)

    return new State(newProg, this.store, this.dragging, this.draggedPoint)
  }
  public addFrees(p: S.DragPoint, fvs: Set<V.Variable>): State {
    return new State(this.prog.addFrees(p, fvs), this.store, this.dragging, this.draggedPoint)
  }

  public eval() : Map<V.Variable, number> {
    return this.store.eval()
  }
}

// for now, just one main program and one main mode
// export enum MainState {Display}
export class Model {

  constructor( public main: State //, public mainState: MainState
  ){}

  public static empty(): Model {
    return new Model( State.empty())
  }

}