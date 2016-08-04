"use strict";
class PhysExpr {
    // helpers for construction
    plus(r) {
        return new BinOpExpr(this, r, BOP.Plus);
    }
    minus(r) {
        return new BinOpExpr(this, r, BOP.Minus);
    }
    div(r) {
        return new BinOpExpr(this, r, BOP.Div);
    }
    mod(r) {
        return new BinOpExpr(this, r, BOP.Mod);
    }
    times(r) {
        return new BinOpExpr(this, r, BOP.Times);
    }
    neg() {
        return new UnOpExpr(this, UOP.Neg);
    }
    static InvokeMath(f, args) {
        let name = f.name;
        return new FunAppExpr(name, args); // defer math check to runtime
    }
    square() {
        return PhysExpr.InvokeMath(Math.pow, [this, new ConstExpr(2)]);
    }
}
exports.PhysExpr = PhysExpr;
// constants
class ConstExpr extends PhysExpr {
    constructor(val) {
        super();
        this.val = val;
    }
}
exports.ConstExpr = ConstExpr;
// variables
class VarExpr extends PhysExpr {
    constructor(val) {
        super();
        this.val = val;
    }
}
exports.VarExpr = VarExpr;
var BOP;
(function (BOP) {
    BOP[BOP["Plus"] = 0] = "Plus";
    BOP[BOP["Minus"] = 1] = "Minus";
    BOP[BOP["Times"] = 2] = "Times";
    BOP[BOP["Div"] = 3] = "Div";
    BOP[BOP["Mod"] = 4] = "Mod";
})(BOP || (BOP = {}));
var UOP;
(function (UOP) {
    UOP[UOP["Neg"] = 0] = "Neg";
    UOP[UOP["Paren"] = 1] = "Paren";
})(UOP || (UOP = {}));
class BinOpExpr extends PhysExpr {
    constructor(lhs, rhs, op) {
        super();
        this.lhs = lhs;
        this.rhs = rhs;
        this.op = op;
    }
}
exports.BinOpExpr = BinOpExpr;
class UnOpExpr extends PhysExpr {
    constructor(inner, op) {
        super();
        this.inner = inner;
        this.op = op;
    }
}
exports.UnOpExpr = UnOpExpr;
class FunAppExpr extends PhysExpr {
    constructor(funcName, args) {
        super();
        this.funcName = funcName;
        this.args = args;
    }
}
exports.FunAppExpr = FunAppExpr;
function evalPhysicsExpr(store, e) {
    let ret;
    if (e instanceof ConstExpr) {
        ret = e.val;
    }
    else if (e instanceof VarExpr) {
        ret = store.get(e.val);
    }
    else if (e instanceof BinOpExpr) {
        let [l, r] = [evalPhysicsExpr(store, e.lhs), evalPhysicsExpr(store, e.rhs)];
        if (e.op == BOP.Plus) {
            ret = l + r;
        }
        else if (e.op == BOP.Minus) {
            ret = l - r;
        }
        else if (e.op == BOP.Times) {
            ret = l * r;
        }
        else if (e.op == BOP.Div) {
            ret = l / r;
        }
        else if (e.op == BOP.Mod) {
            ret = l % r;
        }
        else {
            console.log('unhandled bop:');
            console.log(e);
            assert(false);
        }
    }
    else if (e instanceof UnOpExpr) {
        let inner = evalPhysicsExpr(store, e.inner);
        if (e.op == UOP.Neg) {
            ret = -1 * inner;
        }
        else if (e.op == UOP.Paren) {
            ret = inner;
        }
        else {
            console.log('unhandled uop:');
            console.log(e);
            assert(false);
        }
    }
    else if (e instanceof FunAppExpr) {
        if (!(e.funcName in Math)) {
            console.log('unrecognized function name:');
            console.log(e);
            assert(false);
        }
        let func = Math[e.funcName];
        ret = func.apply(null, e.args.map(expr => evalPhysicsExpr(store, expr)));
    }
    else {
        console.log('unhandled physics expr:');
        console.log(e);
        assert(false);
    }
    return ret;
}
exports.evalPhysicsExpr = evalPhysicsExpr;
function pp(e) {
    let ret;
    if (e instanceof ConstExpr) {
        ret = e.val.toString();
    }
    else if (e instanceof VarExpr) {
        ret = e.val.name;
    }
    else if (e instanceof BinOpExpr) {
        let [l, r] = [pp(e.lhs), pp(e.rhs)];
        let op;
        if (e.op == BOP.Plus) {
            op = '+';
        }
        else if (e.op == BOP.Minus) {
            op = '-';
        }
        else if (e.op == BOP.Times) {
            op = '*';
        }
        else if (e.op == BOP.Div) {
            op = '/';
        }
        else if (e.op == BOP.Mod) {
            op = '%';
        }
        else {
            console.log('unhandled bop:');
            console.log(e);
            assert(false);
        }
        ret = l + ' ' + op + ' ' + r;
    }
    else if (e instanceof UnOpExpr) {
        let inner = pp(e.inner);
        if (e.op == UOP.Neg) {
            ret = '-1 * ' + inner;
        }
        else if (e.op == UOP.Paren) {
            ret = '(' + inner + ')';
        }
        else {
            console.log('unhandled uop:');
            console.log(e);
            assert(false);
        }
    }
    else if (e instanceof FunAppExpr) {
        ret = e.funcName + '(' + e.args.map(e => pp(e)).join(',') + ')';
    }
    else {
        console.log('unhandled physics expr:');
        console.log(e);
        assert(false);
    }
    return ret;
}
exports.pp = pp;
