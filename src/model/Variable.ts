
import c = require('cassowary')

export interface Variable {
  name: String
}


export class CassVar implements Variable {
  public _value: c.Variable
  constructor(public name: string, value: number) {
    this._value = new c.Variable( {name: name, value: value})
  }
}


export class Primitive implements Variable {
  constructor(public name: string) {}
}

export enum VType {Cass, Prim}
