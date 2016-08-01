import {PhysExpr, evalPhysicsExpr, VarExpr, ConstExpr} from './PhysicsExpr'
import {Variable} from './Variable'
import {DragPoint} from './Shapes'
import {Tup, mapValues, extendMap, union} from '../util/Util'

export class Integrator {
  private vals: Map<Variable, PhysExpr>
  public constructor(seeds: Iterable<Tup<Variable, PhysExpr>>){
    this.vals = new Map<Variable, PhysExpr>()
    for (let entry of seeds)
      this.add(entry)
  }

  public add([val, e]: Tup<Variable, PhysExpr>) {
    this.vals.set(val, e)
  }
  public delete(val: Variable) {
    return this.vals.delete(val)
  }
  public union(rhs: Integrator): Integrator {
    let newVals = extendMap(this.vals, rhs.vals)
    return new Integrator(newVals)
  }

  public eval(store: Map<Variable, number>): Map<Variable, number> {
    return mapValues(this.vals, e => evalPhysicsExpr(store, e))
  }

  public vars() {
    return new Set<Variable>(this.vals.keys())
  }

  public static empty() {
    return new Integrator([])
  }
}

export interface PhysicsGroup {
  generateIntegrator(): Integrator
  generateInitials(): Integrator
  frees(): Set<Variable>
  addDrag(dp: DragPoint): void
}


export class Pendulum implements PhysicsGroup {


  private dragVars: Set<Variable>
  public constructor(
    public Omega: Variable, // angular acceleration
    public Theta: Variable,  // angular displacement
    public L: Variable,  // lever arm length
    public C: Variable,  // coefficient of friction
    public X_BOB: Variable, // x coordinate of moving bob
    public Y_BOB: Variable, // y coordinate of moving bob
    public X_PIVOT: Variable, // x coordinate of pendulum base
    public Y_PIVOT: Variable, // y coordinate of pendulum base
    public G: Variable, // force of gravity)
    public rodVars: Set<Variable> // additional variables used by the rod -- assumed to connect the bob and pivot by something else
  ) {
    this.dragVars = new Set<Variable>()
  }

  public validate() {
    let setVar =
      this.Omega && this.Theta  && this.L && this.C && this.G &&
      this.X_BOB && this.Y_BOB && this.X_PIVOT && this.Y_PIVOT

    if (!setVar) {
      console.log('unset variable in pendulum:')
      console.log(this)
      assert(false)
    }

  }
  // L <- sqrt(pow((X_BOB-X_PIVOT), 2) + pow((Y_PIVOT-Y_BOB), 2)),
  // Omega <- 0,
  // Theta <- arctan(DX, DY)
  public generateInitials() {
    let ret = Integrator.empty()
    let fv = (v: Variable) => new VarExpr(v)

    let diffSqr = (l: Variable, r: Variable) => fv(l).minus(fv(r)).square() // (L - R)^2
    let inside = diffSqr(this.X_BOB, this.X_PIVOT).plus(diffSqr(this.Y_BOB, this.Y_PIVOT))
    let LE = PhysExpr.InvokeMath(Math.sqrt, [inside])

    ret.add([this.L, LE])

    ret.add([this.Omega, new ConstExpr(0)])
    let DX = fv(this.X_BOB).minus(fv(this.X_PIVOT))
    let DY = fv(this.Y_BOB).minus(fv(this.Y_PIVOT))

    let fcall = PhysExpr.InvokeMath(Math.atan2, [DX, DY])
    ret.add([this.Theta, fcall])


    return ret
  }


  // Omega <- Omega - (G * sin(Theta) / L + C * Omega),
  // Theta <- Theta + Omega,
  // X_BOB <- X_PIVOT + L * sin(Theta),
  // Y_BOB <- Y_PIVOT + L * cos(Theta)
  // all of the integrator variables need to be set before this function is called
  public generateIntegrator() {

    this.validate()

    let ret = Integrator.empty()

    let fv = (v: Variable) => new VarExpr(v)

    let sinTheta = PhysExpr.InvokeMath(Math.sin, [fv(this.Theta)])
    let cosTheta = PhysExpr.InvokeMath(Math.cos, [fv(this.Theta)])

    let inner = sinTheta.times(fv(this.G)).div(fv(this.L)) // G * sin(theta) / L
    let rhs = inner.plus((fv(this.C)).times(fv(this.Omega))) // inner + C * Omega
    let omegaE = fv(this.Omega).minus(rhs) // Omega - rhs

    ret.add([this.Omega, omegaE])

    let thetaE = fv(this.Theta).plus(fv(this.Omega))
    ret.add([this.Theta, thetaE])



    let XE = sinTheta.times(fv(this.L)).plus(fv(this.X_PIVOT)) // X_PIVOT + L * sin(Theta)
    let YE = cosTheta.times(fv(this.L)).plus(fv(this.Y_PIVOT)) // Y_PIVOT + L * cos(Theta)

    ret.add([this.X_BOB, XE])
    ret.add([this.Y_BOB, YE])

    return ret
  }

  // only add the dragpoint if necessary...
  public addDrag(dp: DragPoint) {
    this.dragVars.add(dp.x).add(dp.y)
  }
  // free variables for updates
  public frees(): Set<Variable> {
    return union((new Set<Variable>())
            .add(this.Omega).add(this.Theta).add(this.L)
            .add(this.X_BOB).add(this.Y_BOB), union(this.rodVars, this.dragVars))
  }
}
