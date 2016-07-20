import {Expression} from 'cassowary'
import {CassVar, Variable} from './Variable'
import {partMap, copy, extendMap, mapValues, fold} from '../util/Util'

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

  public static fromVar(v: CassVar) {
    let ret = new Expr()
    ret.terms.set(v, 1)
    return ret
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

  public eval(store: Map<Variable, number>) {
    return fold(this.terms, (acc, [val, coeff]) => acc + store.get(val) * coeff, this.constant)
  }

  public toCass(): Expression {
    let ret = Expression.fromConstant(this.constant)
    return fold(this.terms, (acc, [val, c]) => acc.plus(Expression.fromVariable(val._value).times(c)), ret)
  }

  public vars(): Set<CassVar> {
    return new Set(this.terms.keys())
  }

  public toString() {
    return fold(this.terms, (accStr, [val, c]) => accStr + " + " + c.toString() + "*" + val.name, this.constant.toString())
  }

  public isEqual(rhs: Expr | number | CassVar): boolean {
    if (rhs instanceof Expr) {
      return fold(
        this.terms,
        (bool, [val, c]) => bool && rhs.terms.has(val) && rhs.terms.get(val) == c,
        this.constant == rhs.constant
      )
    } else if (rhs instanceof CassVar) {
      return this.isEqual(Expr.fromVar(rhs))
    } else {
      return this.isEqual(Expr.fromConst(rhs))
    }

  }

}
