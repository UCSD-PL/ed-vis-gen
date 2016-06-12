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
// logically, this is a good place to handle interactions...


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
  public addShape(s: S.Shape): State {
    return new State(this.prog.addShape(s), this.store, this.dragging, this.draggedPoint)
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
