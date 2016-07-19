import {Expression} from 'cassowary'
import {CassVar, Variable} from './Variable'
import {partMap, copy, extendMap, mapValues} from '../util/Util'

// linear expression class with a conversion function to cassowary expressions

export class Expr {
  // constant + sum (termVar_i * termCoeff_i)
  private constant: number
  private terms: Map<CassVar, number>
  public constructor() {
    this.constant = 0
    this.terms = new Map<CassVar, number>()
  }

  public static fromConst(n: number) {
    let ret = new Expr()
    ret.constant = n
    return ret
  }

  public static fromVar(v: CassVar, store: Map<Variable, number>) {
    let ret = new Expr()
    ret.terms.set(v, store.get(v))
  }

  public times(val: number) {
    let ret = new Expr()
    ret.constant = this.constant * val
    ret.terms = mapValues(this.terms, v => v * val)

    return ret
  }

  public neg() {
    return this.times(-1)
  }

  public div(val: number) {
    return this.times(1/val)
  }

  public plus(rhs: number | Expr) {
    let ret = new Expr()
    if (rhs instanceof Expr) {
      ret.constant = this.constant + rhs.constant
      let [shared, separate] = partMap(extendMap(this.terms, rhs.terms), ([k]) => rhs.terms.has(k) && this.terms.has(k))
      ret.terms = copy(separate)
      for (let [variable] of shared) {
        ret.terms.set(variable, rhs.terms.get(variable) + this.terms.get(variable))
      }
    } else {
      ret.constant = this.constant + rhs
    }

    return ret
  }


  public minus(rhs: number | Expr) {
    let ret = new Expr()

    if (rhs instanceof Expr) {
      ret = this.plus(rhs.neg())
    } else {
      ret.constant = this.constant - rhs
      ret.terms = copy(this.terms)
    }

    return ret
  }

  

}
