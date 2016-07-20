import {Shape, DragPoint, Line, Arrow, Spring, Circle, Rectangle, Image} from './Shapes'
// import U = require('../util/Util')
import {assert, copy, add, filter, DEBUG, exists, Point, extend, union} from '../util/Util'
import {Variable, CassVar, Primitive, VType} from './Variable'
import {Equation, Constraint, SimplexSolver, Expression, Strength} from 'cassowary'
import {Timer} from '../util/Timer'
import {Integrator, PhysicsGroup} from './Physics'
import {Poset} from '../util/Poset'

// immutable program
// we expect to rarely add/remove shapes and other program elements
export class Program {
  constructor(public shapes: Set<Shape>, public names: Map<string, Shape>, public allFrees: Map<DragPoint, Set<Variable>>) {}
  public static empty(): Program {
    return new Program( new Set<Shape>(), new Map<string, Shape>(), new Map<DragPoint, Set<Variable>>())
  }

  // (mostly) immutable extension functions
  public addShape(name: string, s: Shape) {
    let newFrees: Map<DragPoint, Set<Variable>>
    if (s instanceof DragPoint) {
      newFrees = copy(this.allFrees)
      newFrees.set(s, new Set<Variable>())
    } else {
      newFrees = this.allFrees
    }

    return new Program(add(this.shapes, s), extend(this.names, [name, s]), newFrees)
  }

  public addFrees(p: DragPoint, frees: Set<Variable>) {
    let newFrees = copy(this.allFrees)
    newFrees.set(p, frees)
    return new Program(this.shapes, this.names, newFrees)
  }
}

// mutable state store
// we expect to frequently update internal elements of the store
export class Store {
  private csolver: SimplexSolver
  private equations: Set<Equation>
  private cvars: Set<CassVar>
  private cstays: Map<CassVar, Equation> // I might not need the variable part...
  private prims: Map<Primitive, number>

  constructor() {
    this.csolver = new SimplexSolver()
    this.csolver.autoSolve = false
    this.cvars = new Set<CassVar>()
    this.prims = new Map<Primitive, number>()
    this.cstays = new Map<CassVar, Equation>()
    this.equations = new Set<Equation>()
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
  private static makeStay(v: CassVar): Equation {
    let l = Expression.fromVariable(v._value)
    let r = Expression.fromConstant(v._value.value)
    let stay = new Equation(l, r, Strength.strong)
    // console.log('stay for :')
    // console.log(v)
    // console.log(stay.toString())
    return stay
  }

  private clearStays(): void {
    // console.log('stays:')
    // console.log(this.cstays)
    for (let [vr, stay] of this.cstays) {
      this.csolver.removeConstraint(stay)
    }
    this.cstays.clear()
  }

  private addStays(frees: Set<Variable>): void {
    let pinned = filter(this.cvars, i => !frees.has(i))
    for (let varble of pinned) {
      let newStay = Store.makeStay(varble)
      this.cstays.set(varble, newStay)
      this.csolver.addConstraint(newStay)
    }
  }



  // refresh stay equations in cassowary system
  private refreshStays(frees: Set<Variable>): void {
    this.clearStays()
    this.addStays(frees)
  }

  public addEq(e: Equation): void {
    // console.log('adding constraint:')
    // console.log(e.toString())
    this.equations.add(e)
    this.csolver.addConstraint(e)

  }

  public suggestEdits(edits: Map<Variable, number>, frees: Set<Variable>): void {

    // foreach free variable: remove the corresponding stay from cass's system
    // foreach edit:
    //  for cass vars, suggest the edit to the solver.
    //  for prims, directly set the value if free.
    if (DEBUG) {
      console.log('edits, frees:')
      console.log(edits)
      console.log(frees)
      console.log('before edit:')
      this.debug()
    }
    this.clearStays()

    // only start an edit if an edit will be suggested
    let nonempty = exists(edits, ([v, _]) => v instanceof CassVar)

    for (let [eVar, eValue] of edits) {
      if (eVar instanceof CassVar) {
        this.csolver.addEditVar(eVar._value, Strength.medium, 1)
      }
    }

    if (nonempty)
      this.csolver.beginEdit()

    for (let [eVar, eValue] of edits) {
      if (eVar instanceof CassVar) {
        this.csolver.suggestValue(eVar._value, eValue)
      } else if (eVar instanceof Primitive) {
        this.prims.set(eVar, eValue)
      } else {
        assert(false, "unhandled edit: " + [eVar, eValue])
      }
    }


    // finally, close the edit and resolve the solver.
    this.addStays(frees)
    this.csolver.solve()

    if (nonempty)
      this.csolver.endEdit()

    // stays are now stale: refresh them
    this.refreshStays(new Set<Variable>())

    if (DEBUG) {
      console.log('after edit:')
      this.debug()

    }
  }

  public collectVars() : Set<Variable> {
    let ret = new Set<Variable>()
    this.cvars.forEach(v => ret.add(v))
    this.prims.forEach((_, k) => ret.add(k))
    return ret
  }

  public addCVar(v: CassVar) {
    this.cvars.add(v)
    this.refreshStays(new Set<Variable>())
  }


  // return constructed variables for use in maps/folds
  public addVar(typ: VType, name: string, val: number): Variable {
    let ret: Variable
    switch (typ) {
      case VType.Prim:
        ret = new Primitive(name)
        this.prims.set(ret as Primitive, val)
        break
      case VType.Cass:
        ret = new CassVar(name, val)
        this.addCVar(ret as CassVar)
        break
      default:
        console.log('adding unhandled variable type: ' + VType[typ])
        assert(false, 'bad variable type for addvar')
        break
    }
    return ret
  }

  public eval() : Map<Variable, number> {
    let ret = new Map<Variable, number>()
    for (let cv of this.cvars) {
      ret.set(cv, cv._value.value)
    }
    for (let [pvar, pval] of this.prims){
      ret.set(pvar, pval)
    }
    return ret
  }


  public getValues(vars: Variable[]): number[] {
    return vars.map(v => {
      if (v instanceof Primitive)
        return this.prims.get(v)
      else if (v instanceof CassVar)
        return v._value.value
      else
        assert(false) // dead code
    })
  }
}

// physics engine. can be started, stopped, and reset.
export class PhysicsEngine {
  private runner: Timer
  private initValues: Map<Variable, number>
  constructor(public decls: Integrator, public freeVars: Set<Variable>,
    public values: Store, public renderer: () => void) {
    // public freq:number,
    // public work: (n: number) => void,
    this.initValues = copy(values.eval())

    let freq = 20

    let work = (n: number) => {
      let newVals = this.decls.eval(this.values.eval())
      this.values.suggestEdits(newVals, this.freeVars)
      renderer()
    }

    let done = () => {
      this.values.suggestEdits(this.initValues, new Set<Variable>(this.initValues.keys()))
      renderer()
    }

    this.runner = new Timer(freq, work, done)
  }

  public start() {
    this.runner.start()
  }
  public stop() {
    this.runner.stop()
  }
  public reset() {
    this.runner.reset()
  }

  // extends a physics engine with a new engine, preferring the fields of the RHS
  // this is pretty key -- PhysicsEngine.empty's values and renderer don't extend
  // properly.
  public extend(rhs: PhysicsEngine) {
    let newDecls = this.decls.union(rhs.decls)
    let newFrees = union(this.freeVars, rhs.freeVars)
    let [newStore, newRenderer] = [rhs.values, rhs.renderer]
    return new PhysicsEngine(newDecls, newFrees, newStore, newRenderer)
  }

  public static empty() {
    return new PhysicsEngine(Integrator.empty(), new Set<Variable>(), new Store(), () => {})
  }
}

// package up a program and store
export class State {

  // TODO: convert dragged to option
  constructor(public prog: Program, public store: Store,
              public dragging: boolean, public draggedPoint: DragPoint,
              public physicsEngine: PhysicsEngine
  ){}

  public static empty(): State {
    return new State( Program.empty(), new Store(), false, null, PhysicsEngine.empty())
  }

  // delegate to member instances
  public addVar(typ: VType, name: string, val: number): Variable {
    return this.store.addVar(typ, name, val)
  }


  // given a store and x,y coordinates, make new cassowary variables corresponding
  // to the x, y values and wrap in a point.
  // mutates this to add the new variable
  public allocVar(v: number, prefix?: string): CassVar {
    prefix = prefix || "V"
    let suffix = 0
    let sVals = this.eval()
    while (exists(sVals, ([k, v]) => k.name == (prefix + suffix.toString())))
      ++suffix

    return this.addVar(VType.Cass, prefix + suffix.toString(), v) as CassVar
  }
  // mutates this to add x, y, and r
  allocPoint(p: Point): DragPoint {
    let [x, y, r] = [this.allocVar(p.x), this.allocVar(p.y), this.allocVar(5)]
    return new DragPoint(x, y, r, "blue")
  }

  // given an expression, allocate a new variable, add to the store, and
  // return an equation for var = expr.
  public makeEquation(e: Expression, v: number): [CassVar, Equation] {
    let varValue = -e.constant
  //  console.log(e)
    let retVar = this.allocVar(v)
    let eq = new Equation(retVar.toCExpr(), e, Strength.strong)
    return [retVar, eq]
  }


  public addShape(name: string, s: Shape, withEditPoints?: boolean): State {
    // add the shape, as well as edit-points, edit-equations, and free variables
    let newProg = this.prog
    withEditPoints = withEditPoints !== false // default to true unless explicitly false

    if (withEditPoints) {
      let editPoints = new Map<DragPoint, Set<Variable>>()
      let editEqs = new Set<Equation>()
      let vals = this.eval()

      // assumes each shape has CassVar variables, which is not realistic... TODO
      if (s instanceof Line) {
        // foreach point on the line, add a drag point with the underlying variables
        s.points.forEach(([x, y]) => {
          let r = this.allocVar(3.5)
          let np = new DragPoint(x, y, r, "blue")
          let newFrees = (new Set<Variable>()).add(x).add(y)
          editPoints.set(np, newFrees)
        })

      } else if (s instanceof Arrow || s instanceof Spring) {
        // put a drag point on the base, and a drag point at the end. fix
        // the end with equations.
        let [r1, r2] = [this.allocVar(3.5), this.allocVar(3.5)]
        let bp = new DragPoint(s.x, s.y, r1, "blue")

        let endXExpr = (s.x as CassVar).toCExpr().plus(
          (s.dx as CassVar).toCExpr()
        ) // TODO
        let endYExpr = (s.y as CassVar).toCExpr().plus(
          (s.dy as CassVar).toCExpr()
        ) // TODO

        let [endX, endXEq] = this.makeEquation(endXExpr, vals.get(s.x) + vals.get(s.dx))
        let [endY, endYEq] = this.makeEquation(endYExpr, vals.get(s.y) + vals.get(s.dy))
        let baseFrees = (new Set<Variable>()).add(s.x).add(s.y).add(endX).add(endY) // gross
        let endFrees = (new Set<Variable>()).add(s.dx).add(s.dy).add(endX).add(endY)
        let ep = new DragPoint(endX, endY, r2, "blue")

        editEqs.add(endXEq).add(endYEq)
        editPoints.set(bp, baseFrees).set(ep, endFrees)

      } else if (s instanceof Circle) {
        // point in the middle, point on the right edge
        let [r1, r2] = [this.allocVar(3.5), this.allocVar(3.5)]
        let bp = new DragPoint(s.x, s.y, r1, "blue")

        let endXExpr = (s.x as CassVar).toCExpr().plus(
          (s.r as CassVar).toCExpr()
        ) // TODO

        let [endX, endXEq] = this.makeEquation(endXExpr, vals.get(s.x) + vals.get(s.r))
        let baseFrees = (new Set<Variable>()).add(s.x).add(s.y).add(endX)
        let endFrees = (new Set<Variable>()).add(s.r).add(endX)
        let ep = new DragPoint(endX, s.y, r2, "blue")

        editEqs.add(endXEq)
        editPoints.set(bp, baseFrees).set(ep, endFrees)
      } else if (s instanceof Rectangle || s instanceof Image) {
        let [r1, r2] = [this.allocVar(3.5), this.allocVar(3.5)]
        let bp = new DragPoint(s.x, s.y, r1, "blue")

        let endXExpr = (s.x as CassVar).toCExpr().plus(
          (s.dx as CassVar).toCExpr()
        ) // TODO
        let endYExpr = (s.y as CassVar).toCExpr().minus(
          (s.dy as CassVar).toCExpr()
        ) // TODO

        let [endX, endXEq] = this.makeEquation(endXExpr, vals.get(s.x) + vals.get(s.dx))
        let [endY, endYEq] = this.makeEquation(endYExpr, vals.get(s.y) - vals.get(s.dy))
        let baseFrees = (new Set<Variable>()).add(s.x).add(s.y).add(endX).add(endY) // gross
        let endFrees = (new Set<Variable>()).add(s.dx).add(s.dy).add(endX).add(endY)
        let ep = new DragPoint(endX, endY, r2, "blue")

        editEqs.add(endXEq).add(endYEq)
        editPoints.set(bp, baseFrees).set(ep, endFrees)
      } else {
        console.log('unhandled shape for adding edit points: ' + s.toString())
        assert(false)
      }
      for (let [dp, frees] of editPoints) {
        newProg = newProg.addShape(name, dp)
        newProg = newProg.addFrees(dp, frees)
      }
      for (let editEq of editEqs)
      this.store.addEq(editEq)
    }
    newProg = newProg.addShape(name, s)



    return new State(newProg, this.store, this.dragging, this.draggedPoint, this.physicsEngine)
  }
  public addFrees(p: DragPoint, fvs: Set<Variable>): State {
    return new State(this.prog.addFrees(p, fvs), this.store, this.dragging, this.draggedPoint, this.physicsEngine)
  }

  public addPhysDecls(decls: Integrator, freeVals: Set<Variable>, renderer: () => void) {
    let newEngine = new PhysicsEngine(decls, freeVals, this.store, renderer)
    this.physicsEngine = this.physicsEngine.extend(newEngine)
    return this
  }

  public addPhysGroup(group: PhysicsGroup, renderer: () => void) {
    return this.addPhysDecls(group.instantiate(), group.frees(), renderer)
  }

  public start() {
    this.physicsEngine.start()
  }
  public stop() {
    this.physicsEngine.stop()
  }
  public reset() {
    this.physicsEngine.reset()
  }

  public eval() : Map<Variable, number> {
    return this.store.eval()
  }
}

// for now, just one main program and one main mode
// export enum MainState {Display}
export class Model {

  constructor( public main: State, public candidateFrees: Map<DragPoint, Set<Variable>[]>)
  {}

  public static empty(): Model {
    return new Model( State.empty(), new Map<DragPoint, Set<Variable>[]>())
  }

}
