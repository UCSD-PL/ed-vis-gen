import {Shape, DragPoint, Line, Arrow, Spring, Circle, Rectangle, Image, pp} from './Shapes'
// import U = require('../util/Util')
import {assert, copy, add, filter, DEBUG, exists, Point, extend, union, flip} from '../util/Util'
import {Variable, CassVar, Primitive, VType} from './Variable'
import {Equation, Constraint, SimplexSolver, Expression, Strength} from 'cassowary'
import {Timer} from '../util/Timer'
import {Integrator, PhysicsGroup} from './Physics'
import {Poset} from '../util/Poset'

import {Eq, Expr} from './Expr'

// immutable program
// we expect to rarely add/remove shapes and other program elements
export class Program {
  constructor(public shapes: Set<Shape>, public names: Map<string, Shape>, public allFrees: Map<DragPoint, Set<Variable>>) {}
  public static empty(): Program {
    return new Program( new Set<Shape>(), new Map<string, Shape>(), new Map<DragPoint, Set<Variable>>())
  }

  public printShapes() {
    console.log([...this.shapes].map(s => flip(this.names).get(s) + " => " + pp(s)).join('\n'))
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
  public equations: Set<Eq>
  private cvars: Set<CassVar>
  private cstays: Map<CassVar, Equation> // I might not need the variable part...
  private prims: Map<Primitive, number>

  constructor() {
    this.csolver = new SimplexSolver()
    this.csolver.autoSolve = false
    this.cvars = new Set<CassVar>()
    this.prims = new Map<Primitive, number>()
    this.cstays = new Map<CassVar, Equation>()
    this.equations = new Set<Eq>()
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
  private static makeStay(v: CassVar): Eq {
    let l = Expr.fromVar(v)
    let r = Expr.fromConst(v._value.value)
    let stay = new Eq(l, r)
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
      let newStay = Store.makeStay(varble).toCass(Strength.strong)
      this.cstays.set(varble, newStay)
      this.csolver.addConstraint(newStay)
    }
  }



  // refresh stay equations in cassowary system
  private refreshStays(frees: Set<Variable>): void {
    this.clearStays()
    this.addStays(frees)
  }

  public addEq(e: Eq, s: Strength): void {
    // console.log('adding constraint:')
    // console.log(e.toString())
    this.equations.add(e)
    this.csolver.addConstraint(e.toCass(s))

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
  constructor(public timestepDecls: Integrator, public freeVars: Set<Variable>,
    public initialDecls: Integrator,
    public values: Store, public renderer: () => void) {
    // public freq:number,
    // public work: (n: number) => void,
    this.initValues = copy(values.eval())

    let freq = 20

    let work = (n: number) => {
      let newVals = this.timestepDecls.eval(this.values.eval())
      this.values.suggestEdits(newVals, this.freeVars)
      renderer()
    }

    let done = () => {
      this.values.suggestEdits(this.initValues, new Set<Variable>(this.initValues.keys()))
      renderer()
    }

    this.runner = new Timer(freq, work, done)
  }

  // run initialDecls to regenerate physical values
  public reconfigure() {
    let newVals = this.initialDecls.eval(this.values.eval())
    this.values.suggestEdits(newVals, this.initialDecls.vars())
    // this.renderer()
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
    let newTSDecls = this.timestepDecls.union(rhs.timestepDecls)
    let newFrees = union(this.freeVars, rhs.freeVars)
    let newInitDecls = this.initialDecls.union(rhs.initialDecls)
    let [newStore, newRenderer] = [rhs.values, rhs.renderer]
    return new PhysicsEngine(newTSDecls, newFrees, newInitDecls, newStore, newRenderer)
  }

  public static empty() {
    return new PhysicsEngine(Integrator.empty(), new Set<Variable>(), Integrator.empty(), new Store(), () => {})
  }
}

// package up a program and store
export class State {

  // TODO: convert dragged to option
  constructor(public prog: Program, public store: Store,
              public dragging: boolean, public draggedPoint: DragPoint,
              public physicsEngine: PhysicsEngine, public physicsRunning: boolean
  ){}

  public static empty(): State {
    return new State( Program.empty(), new Store(), false, null, PhysicsEngine.empty(), false)
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
  public makeEquation(e: Expr, v: number): [CassVar, Eq] {
    let str = this.eval()
    let varValue = -e.eval(str)
  //  console.log(e)
    let retVar = this.allocVar(v)
    let eq = new Eq(Expr.fromVar(retVar), e)
    return [retVar, eq]
  }


  public addShape(name: string, s: Shape, withEditPoints?: boolean): State {
    // add the shape, as well as edit-points, edit-equations, and free variables
    let newProg = this.prog
    withEditPoints = withEditPoints !== false // default to true unless explicitly false

    if (withEditPoints) {
      let editPoints = new Map<DragPoint, Set<Variable>>()
      let editEqs = new Set<Eq>()
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

        let endXExpr = Expr.fromVar(s.x as CassVar).plus(s.dx as CassVar)
        let endYExpr = Expr.fromVar(s.y as CassVar).plus(s.dy as CassVar)

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

        let endXExpr = Expr.fromVar(s.x as CassVar).plus(s.r as CassVar)

        let [endX, endXEq] = this.makeEquation(endXExpr, vals.get(s.x) + vals.get(s.r))
        let baseFrees = (new Set<Variable>()).add(s.x).add(s.y).add(endX)
        let endFrees = (new Set<Variable>()).add(s.r).add(endX)
        let ep = new DragPoint(endX, s.y, r2, "blue")

        editEqs.add(endXEq)
        editPoints.set(bp, baseFrees).set(ep, endFrees)
      } else if (s instanceof Rectangle || s instanceof Image) {
        let [r1, r2] = [this.allocVar(3.5), this.allocVar(3.5)]
        let bp = new DragPoint(s.x, s.y, r1, "blue")

        let endXExpr = Expr.fromVar(s.x as CassVar).plus(s.dx as CassVar)
        let endYExpr = Expr.fromVar(s.y as CassVar).minus(s.dx as CassVar)

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
        this.store.addEq(editEq, Strength.strong)
    }
    newProg = newProg.addShape(name, s)



    return new State(newProg, this.store, this.dragging, this.draggedPoint, this.physicsEngine, this.physicsRunning)
  }
  public addFrees(p: DragPoint, fvs: Set<Variable>): State {
    return new State(this.prog.addFrees(p, fvs), this.store, this.dragging, this.draggedPoint, this.physicsEngine, this.physicsRunning)
  }

  public addPhysDecls(integrationDecls: Integrator, freeVals: Set<Variable>, initialDecls: Integrator, renderer: () => void) {
    let newEngine = new PhysicsEngine(integrationDecls, freeVals, initialDecls, this.store, renderer)
    this.physicsEngine = this.physicsEngine.extend(newEngine)
    return this
  }

  public addPhysGroup(group: PhysicsGroup, renderer: () => void) {
    return this.addPhysDecls(group.generateIntegrator(), group.frees(), group.generateInitials(), renderer)
  }

  public start() {
    this.physicsRunning = true
    this.physicsEngine.start()
  }
  public stop() {
    this.physicsRunning = false
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
