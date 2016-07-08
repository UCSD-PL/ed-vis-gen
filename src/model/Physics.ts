import {PhysExpr, evalPhysicsExpr, VarExpr} from './PhysicsExpr'
import {Variable} from './Variable'
import {Tup, mapValues, extendMap} from '../util/Util'

export class Integrator {
  private vals: Map<Variable, PhysExpr>
  public constructor(seeds: Iterable<Tup<Variable, PhysExpr>>){
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

  public static empty() {
    return new Integrator([])
  }
}

export interface PhysicsGroup {
  instantiate(): Integrator
  frees(): Set<Variable>
}


export class Pendulum implements PhysicsGroup {


  public constructor(
    public Omega: Variable, // angular acceleration
    public Theta: Variable,  // angular displacement
    public L: Variable,  // lever arm length
    public C: Variable,  // coefficient of friction
    public X_BOB: Variable, // x coordinate of moving bob
    public Y_BOB: Variable, // y coordinate of moving bob
    public X_PIVOT: Variable, // x coordinate of pendulum base
    public Y_PIVOT: Variable, // y coordinate of pendulum base
    public G: Variable // force of gravity)
  ) {}

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
  // Omega <- Omega - (G * sin(Theta) / L + C * Omega),
  // Theta <- Theta + Omega,
  // L <- sqrt(pow((X_BOB-X_PIVOT), 2) + pow((Y_PIVOT-Y_BOB), 2)),
  // X_BOB <- X_PIVOT + L * sin(Theta),
  // Y_BOB <- Y_PIVOT + L * cos(Theta)

  // all of the integrator variables need to be set before this function is called
  public instantiate() {

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

    let diffSqr = (l: Variable, r: Variable) => fv(l).minus(fv(r)).square() // (L - R)^2
    let inside = diffSqr(this.X_BOB, this.X_PIVOT).plus(diffSqr(this.Y_BOB, this.Y_PIVOT))
    let LE = PhysExpr.InvokeMath(Math.sqrt, [inside])

    ret.add([this.L, LE])

    let XE = sinTheta.times(fv(this.L)).plus(fv(this.X_PIVOT)) // X_PIVOT + L * sin(Theta)
    let YE = cosTheta.times(fv(this.L)).plus(fv(this.Y_PIVOT)) // Y_PIVOT + L * cos(Theta)

    ret.add([this.X_BOB, XE])
    ret.add([this.Y_BOB, YE])

    return ret
  }
  // free variables for updates
  public frees(): Set<Variable> {
    return (new Set<Variable>())
            .add(this.Omega).add(this.Theta).add(this.L)
            .add(this.X_BOB).add(this.Y_BOB)

  }
}
