import {PhysExpr, evalPhysicsExpr} from './PhysicsExpr'
import {Variable} from './Variable'
import {Tup, mapValues} from '../util/Util'

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

  public eval(store: Map<Variable, number>): Map<Variable, number> {
    return mapValues(this.vals, e => evalPhysicsExpr(store, e))
  }
}
