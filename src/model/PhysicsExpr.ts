// AST and big-step evaluator for physics terms
import {Variable} from './Variable'


export class PhysExpr {
  // helpers for construction
  public add(r: PhysExpr) {
    return new BinOpExpr(this, r, BOP.Plus)
  }
  public minus(r: PhysExpr) {
    return new BinOpExpr(this, r, BOP.Minus)
  }
  public div(r: PhysExpr) {
    return new BinOpExpr(this, r, BOP.Div)
  }
  public mod(r: PhysExpr) {
    return new BinOpExpr(this, r, BOP.Mod)
  }
  public times(r: PhysExpr) {
    return new BinOpExpr(this, r, BOP.Times)
  }
  public neg() {
    return new UnOpExpr(this, UOP.Neg)
  }
  public static InvokeMath(f:Function, args: PhysExpr[]) {
    let name = f.name
    return new FunAppExpr(name, args) // defer math check to runtime
  }
}
// constants
export class ConstExpr extends PhysExpr {
  constructor(public val: number) {super()}
}

// variables
export class VarExpr extends PhysExpr {
  constructor(public val: Variable) {super()}
}
enum BOP {Plus, Minus, Times, Div, Mod}
enum UOP {Neg, Paren}

export class BinOpExpr extends PhysExpr {
  constructor(public lhs: PhysExpr, public rhs: PhysExpr, public op: BOP){super()}
}

export class UnOpExpr extends PhysExpr {
  constructor(public inner: PhysExpr, public op: UOP) {super()}
}

export class FunAppExpr extends PhysExpr {
  constructor(public funcName: string, public args: PhysExpr[]){super()}
}


export function evalPhysicsExpr(store: Map<Variable, number>, e: PhysExpr): number {
  let ret: number
  if (e instanceof ConstExpr) {
    ret = e.val
  } else if (e instanceof VarExpr) {
    ret = store.get(e.val)
  } else if (e instanceof BinOpExpr) {
    let [l, r] = [evalPhysicsExpr(store, e.lhs), evalPhysicsExpr(store, e.rhs)]

    if (e.op == BOP.Plus) {
      ret = l + r
    } else if (e.op == BOP.Minus) {
      ret = l - r
    } else if (e.op == BOP.Times) {
      ret = l * r
    } else if (e.op == BOP.Div) {
      ret = l / r
    } else if (e.op == BOP.Mod) {
      ret = l % r
    } else {
      console.log('unhandled bop:')
      console.log(e)
      assert(false)
    }
  } else if (e instanceof UnOpExpr) {
    let inner = evalPhysicsExpr(store, e.inner)

    if (e.op == UOP.Neg) {
      ret = -1 * inner
    } else if (e.op == UOP.Paren) {
      ret = inner
    } else {
      console.log('unhandled uop:')
      console.log(e)
      assert(false)
    }
  } else if (e instanceof FunAppExpr) {

    if (!(e.funcName in Math)) {
      console.log('unrecognized function name:')
      console.log(e)
      assert(false)
    }
    let func = (Math as any)[e.funcName] as Function
    ret = func.apply(null, e.args.map(expr => evalPhysicsExpr(store, expr)))
  } else {
    console.log('unhandled physics expr:')
    console.log(e)
    assert(false)
  }

  return ret
}
