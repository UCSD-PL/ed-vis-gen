import {PhysExpr, evalPhysicsExpr, VarExpr, ConstExpr, pp} from './PhysicsExpr'
import {Variable} from './Variable'
import {DragPoint, Circle, Arrow} from './Shapes'
import {Tup, mapValues, extendMap, union, Point, fold, map2Tup} from '../util/Util'

export class Integrator {
  private vals: Map<Variable, PhysExpr>
  public constructor(seeds: Iterable<Tup<Variable, PhysExpr>>){
    this.vals = new Map<Variable, PhysExpr>()
    for (let entry of seeds)
      this.add(entry)
  }

  public add([val, e]: Tup<Variable, PhysExpr>) {
    this.vals.set(val, e)
    return this
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

  public pp(): string {
    let ret = 'Integrator: {\n'
    for (let [k, v] of this.vals) {
      ret += k.name + ' <- ' + pp(v) + '\n'
    }
    ret += '}'
    return ret
  }
}

// given l and r, return l + r
function addVars(l: Variable, r: Variable) {
  return new VarExpr(l).plus(new VarExpr(r))
}

// given variables for acceleration, velocity, and position, return:
// V <- V + F
// P <- P + V
function eulerIntegrator(acc: Variable, vel: Variable, pos: Variable) {
  let ret = Integrator.empty()
  ret.add([vel, addVars(vel, acc)]).add([pos, addVars(vel, pos)])
  return ret
}

function fv(v: Variable) {
  return new VarExpr(v)
}

export interface PhysicsGroup {
  generateIntegrator(): Integrator // small-step physics engine decls
  generateInitials(): Integrator // initialization of physics constants e.g. spring rest length
  frees(): Set<Variable> // free variables for small-step physics engine
  addDrag(dp: DragPoint): void // add a drag-point's variables to the free-var set
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

    let thetaE = addVars(this.Theta, this.Omega)
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

export class SpringGroup implements PhysicsGroup {

  public constructor (
    public DX: Variable, // X, Y stretch
    public DY: Variable,
    public initRL: Point,  // initial rest length in (X, Y)
    public initTheta: number, // initial amount of rotation
    public F_X: Variable, // F, V, and rest length in x dimension
    public V_X: Variable,
    public RL_X: Variable,
    public X_Objs: Variable[], // attached objects in x dimension
    public F_Y: Variable,
    public V_Y: Variable,   // ditto for Y dimension
    public RL_Y: Variable,
    public Y_Objs: Variable[],
    public coeffFriction: Variable, // coefficient of moving friction
    public mass: Variable,          // mass
    public springConstant: Variable, // spring constant k
    public gravConstant: Variable   // gravitational constant g
  ) {
  }


  // for each dimension:
  // F <- (-K * (Delta + RL) - (C * Va)) / M,
  // V <- V + F,
  // Delta <- Delta + V
  public generateIntegrator(): Integrator {
    let ret = Integrator.empty()


    // F <- (-K * (Delta + RL) - (C * Va)) / M... ugh
    let fxExpr = fv(this.springConstant).neg().times(fv(this.DX).minus(fv(this.RL_X))) // -k * (delta + rl)
                 .minus(fv(this.coeffFriction).times(fv(this.V_X))) // ( C * V)
                 .div(fv(this.mass))

    ret.add([this.F_X, fxExpr])

    // V <- V + F,
    // Delta <- Delta + V
    ret = ret.union(eulerIntegrator(this.F_X, this.V_X, this.DX))

    // copy-pasta for y dimension. maybe refactor?
    let fyExpr = fv(this.springConstant).neg().times(fv(this.DY).minus(fv(this.RL_Y))) // -k * (delta - rl)
                 .minus(fv(this.coeffFriction).times(fv(this.V_Y))) // ( C * V)
                 .div(fv(this.mass))

    ret.add([this.F_Y, fyExpr])

    // V <- V + F,
    // Delta <- Delta + V
    ret = ret.union(eulerIntegrator(this.F_Y, this.V_Y, this.DY))

    // finally, for each x and y attached object, translate by delta
    for (let dxv of this.X_Objs) {
      ret.add([dxv, addVars(dxv, this.V_X)])
    }
    for (let dyv of this.Y_Objs) {
      ret.add([dyv, addVars(dyv, this.V_Y)])
    }

    return ret
  }

  // RL <- InitRL - M * G / K,
  public generateInitials(): Integrator {
    let ret = Integrator.empty()
    let {x, y} = this.initRL
    let rlxExpr = new ConstExpr(x).minus(
      fv(this.mass).times(fv(this.gravConstant)).div(fv(this.springConstant))
      .times(PhysExpr.InvokeMath(Math.cos, [new ConstExpr(this.initTheta)])) // project force vector to x-dimension
    )
    let rlyExpr = new ConstExpr(y).minus(
      fv(this.mass).times(fv(this.gravConstant)).div(fv(this.springConstant))
      .times(PhysExpr.InvokeMath(Math.sin, [new ConstExpr(this.initTheta)])) // project force vector to y-dimension
    )

    // ret.add([this.RL_X, rlxExpr]).add([this.RL_Y, rlyExpr])

    return ret
  }

  public frees(): Set<Variable> {
    let xFrees = new Set<Variable>(this.X_Objs).add(this.F_X).add(this.V_X).add(this.DX)
    let yFrees = new Set<Variable>(this.Y_Objs).add(this.F_Y).add(this.V_Y).add(this.DY)
    return union(xFrees, yFrees)
  }


  public addDrag(dp: DragPoint) {
    // AHA! by a clever trick, we instead just calculate the delta directly -- see generateIntegrator
    this.X_Objs.push(dp.x)
    this.Y_Objs.push(dp.y)
  }
}

// a circle carrying mass and a velocity vector. the mass is proportional to
// the circle's area and the velocity is proportional to the vector's length.
class MassBody {
  static density = 1
  public constructor(
    public body: Circle,
    public mass: Variable,
    public velVec: Arrow,
    public velX: Variable,
    public velY: Variable,
    public forces: Map<Circle, Variable>,
    public thetas: Map<Circle, Variable> // map each other mass to a variable for the angle between this and it
  ) {

  }

}
export class MassSystem implements PhysicsGroup {

  private bodies: Set<MassBody>
  private dragVars: Set<Variable>

  public constructor(
    public gravConst: Variable,
    public dampening: Variable,
    public density: number,
    public velocityScale: number,
    bodies: Iterable<[Circle, Arrow, Variable, Variable, Variable, Map<Circle, Variable>, Map<Circle, Variable>]>
  ) {
    this.bodies = new Set()
    this.dragVars = new Set()

    for (const [body, velVec, mass, velX, velY, forces, thetas] of bodies) {
      const newBod = new MassBody(body, mass, velVec, velX, velY, forces, thetas)
      this.bodies.add(newBod)
    }
  }
  public generateIntegrator(): Integrator {
    // generate pairwise forces and project velocities to each dimension. fun times fam.
    // plumb the data to the left...
    const ret = Integrator.empty()
    for (const lBody of this.bodies) {
      // and to the right...
      const forcesAndThetas: Set<Tup<PhysExpr, PhysExpr>> = new Set()
      for (const rBody of this.bodies) {
        // foreach pair l -> r s.t. l != r,
        // add the term  FLR <- M_R/((l_x - r_x)^2 + (l_y - r_y)^2)
        if (lBody === rBody) continue

        const newForce = fv(rBody.mass).times(fv(this.gravConst))

        const denom = fv(lBody.body.x).minus(fv(rBody.body.x)).square().plus(
                      fv(lBody.body.y).minus(fv(rBody.body.y)).square()
        )
        ret.add([lBody.forces.get(rBody.body), newForce.div(denom)])

        // add the term thetalr <- atan2(dy, dx)
        const dy = fv(lBody.body.y).minus(fv(rBody.body.y))
        const dx = fv(lBody.body.x).minus(fv(rBody.body.x))

        ret.add([lBody.thetas.get(rBody.body), PhysExpr.InvokeMath(Math.atan2, [dy, dx])])

        forcesAndThetas.add(
          map2Tup([lBody.forces.get(rBody.body), lBody.thetas.get(rBody.body)], v => fv(v))
        )
      }

      // for (const [force, theta] of forcesAndThetas) {
      //
      // }
      const velXTerm = fold(forcesAndThetas,
        (old, [force, theta]) => old.plus(force.times(theta.cos())),
        ConstExpr.zero as PhysExpr
      ).neg().plus(fv(lBody.velX))

      const velYTerm = fold(forcesAndThetas,
        (old, [force, theta]) => old.plus(force.times(theta.sin())),
        ConstExpr.zero as PhysExpr
      ).neg().plus(fv(lBody.velY))

      ret.add([lBody.velX, velXTerm]).add([lBody.velY, velYTerm])

      ret.add([lBody.body.x, fv(lBody.body.x).plus(fv(lBody.velX))])
         .add([lBody.body.y, fv(lBody.body.y).plus(fv(lBody.velY))])

       ret.add([lBody.velVec.x, fv(lBody.velVec.x).plus(fv(lBody.velX))])
          .add([lBody.velVec.y, fv(lBody.velVec.y).plus(fv(lBody.velY))])

    }
    // console.log(ret.pp())

    return ret
  } // small-step physics engine decls
  public generateInitials(): Integrator {
    const ret = Integrator.empty()
    for (const body of this.bodies) {
      // foreach body, M <- density * r^2
      const mExpr = fv(body.body.r).times(fv(body.body.r)).times(new ConstExpr(this.density))
      ret.add([body.mass, mExpr])
      // foreach body, vx <- vec.dx/scale, vy <- vec.dy/scale
      ret.add([body.velX, fv(body.velVec.dx).div(new ConstExpr(this.velocityScale))])
      ret.add([body.velY, fv(body.velVec.dy).div(new ConstExpr(this.velocityScale))])
    }

    for (const lBody of this.bodies) {
      for (const rBody of this.bodies) {
        // foreach pair l -> r s.t. l != r,
        // add the term  FLR <- M_R/((l_x - r_x)^2 + (l_y - r_y)^2)
        if (lBody === rBody) continue

        const newForce = fv(rBody.mass).times(fv(this.gravConst))

        const denom = fv(lBody.body.x).minus(fv(rBody.body.x)).square().plus(
                      fv(lBody.body.y).minus(fv(rBody.body.y)).square()
        )
        ret.add([lBody.forces.get(rBody.body), newForce.div(denom)])

        // add the term thetalr <- atan2(dy, dx)
        const dy = fv(lBody.body.y).minus(fv(rBody.body.y))
        const dx = fv(lBody.body.x).minus(fv(rBody.body.x))

        ret.add([lBody.thetas.get(rBody.body), PhysExpr.InvokeMath(Math.atan2, [dy, dx])])
      }
    }
    return ret
  } // initialization of physics constants e.g. spring rest length
  public frees(): Set<Variable> {
    const ret = new Set<Variable>()
    for (const body of this.bodies) {
      ret.add(body.body.x).add(body.body.y)
         .add(body.velVec.x).add(body.velVec.y)
         .add(body.velX).add(body.velY)
        //  .add(body.velVec.dx).add(body.velVec.dy) TODO

      for (const [_, force] of body.forces)
        ret.add(force)
      for (const [_, angle] of body.thetas)
        ret.add(angle)



    }
    for (let dragVar of this.dragVars)
      ret.add(dragVar)
    return ret
  }
  public addDrag(dp: DragPoint): void  {
    this.dragVars.add(dp.x).add(dp.y)
  }
}
