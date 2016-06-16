
import c = require('cassowary')

export interface Variable {
  name: string
}


export class CassVar implements Variable {
  public _value: c.Variable
  constructor(public name: string, value: number) {
    this._value = new c.Variable( {name: name, value: value})
  }
  public toCExpr() { return c.Expression.fromVariable(this._value) }
}


export class Primitive implements Variable {
  constructor(public name: string) {}
}

export enum VType {Cass, Prim}
