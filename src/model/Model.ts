import S = require('./Shapes')
import U = require('../util/Util')
import V = require('./Variable')
import Cass = require('cassowary')
// import assert from 'assert'


// immutable program
// we expect to rarely add/remove shapes and other program elements
export class Program {
  public static empty(): Program {
    return new Program( new Set<S.Shape>() )
  }
  constructor(public shapes: Set<S.Shape>) {}
  public addShape(s: S.Shape) {
    return new Program(U.add(this.shapes, s))
  }
}

// mutable state store
// we expect to frequently update internal elements of the store
export class Store {
  private csolver: Cass.SimplexSolver
  private cvars: Set<V.CassVar>
  private prims: Map<V.Primitive, number>

  public collectVars() : Set<V.Variable> {
    let ret = new Set<V.Variable>()
    this.cvars.forEach(v => ret.add(v))
    this.prims.forEach((_, k) => ret.add(k))
    return ret
  }


  constructor() {
    this.csolver = new Cass.SimplexSolver()
    this.cvars = new Set<V.CassVar>()
    this.prims = new Map<V.Primitive, number>()
  }

  // return constructed variables for use in maps/folds
  public addVar(typ: V.VType, name: string, val: number): V.Variable {
    let ret: V.Variable
    switch (typ) {
      case V.VType.Prim:
        ret = new V.Primitive(name)
        this.prims.set(ret as V.Primitive, val)
        break
      case V.VType.Cass:
        ret = new V.CassVar(name, val)
        this.cvars.add(ret as V.CassVar)
        break
      default:
        console.log('adding unhandled variable type: ' + V.VType[typ])
        assert(false, 'bad variable type for addvar')
        break
    }
    return ret
  }

  public eval() : Map<V.Variable, number> {
    let ret = new Map<V.Variable, number>()
    for (let cv of this.cvars) {
      ret.set(cv, cv._value.value)
    }
    for (let [pvar, pval] of this.prims){
      ret.set(pvar, pval)
    }
    return ret
  }
}


export class Model {

  constructor(public prog: Program, public store: Store){}

  public static empty(): Model {
    return new Model( Program.empty(), new Store())
  }

  // delegate to member instances
  public addVar(typ: V.VType, name: string, val: number): V.Variable {
    return this.store.addVar(typ, name, val)
  }
  public addShape(s: S.Shape): Model {
    return new Model(this.prog.addShape(s), this.store)
  }

  public eval() : Map<V.Variable, number> {
    return this.store.eval()
  }
}
