"use strict";
const PhysicsExpr_1 = require('./PhysicsExpr');
const Util_1 = require('../util/Util');
class Integrator {
    constructor(seeds) {
        this.vals = new Map();
        for (let entry of seeds)
            this.add(entry);
    }
    add([val, e]) {
        this.vals.set(val, e);
    }
    delete(val) {
        return this.vals.delete(val);
    }
    union(rhs) {
        let newVals = Util_1.extendMap(this.vals, rhs.vals);
        return new Integrator(newVals);
    }
    eval(store) {
        return Util_1.mapValues(this.vals, e => PhysicsExpr_1.evalPhysicsExpr(store, e));
    }
    static empty() {
        return new Integrator([]);
    }
}
exports.Integrator = Integrator;
class Pendulum {
    constructor(Omega, // angular acceleration
        Theta, // angular displacement
        L, // lever arm length
        C, // coefficient of friction
        X_BOB, // x coordinate of moving bob
        Y_BOB, // y coordinate of moving bob
        X_PIVOT, // x coordinate of pendulum base
        Y_PIVOT, // y coordinate of pendulum base
        G // force of gravity)
        ) {
        this.Omega = Omega;
        this.Theta = Theta;
        this.L = L;
        this.C = C;
        this.X_BOB = X_BOB;
        this.Y_BOB = Y_BOB;
        this.X_PIVOT = X_PIVOT;
        this.Y_PIVOT = Y_PIVOT;
        this.G = G;
    }
    validate() {
        let setVar = this.Omega && this.Theta && this.L && this.C && this.G &&
            this.X_BOB && this.Y_BOB && this.X_PIVOT && this.Y_PIVOT;
        if (!setVar) {
            console.log('unset variable in pendulum:');
            console.log(this);
            assert(false);
        }
    }
    // Omega <- Omega - (G * sin(Theta) / L + C * Omega),
    // Theta <- Theta + Omega,
    // L <- sqrt(pow((X_BOB-X_PIVOT), 2) + pow((Y_PIVOT-Y_BOB), 2)),
    // X_BOB <- X_PIVOT + L * sin(Theta),
    // Y_BOB <- Y_PIVOT + L * cos(Theta)
    // all of the integrator variables need to be set before this function is called
    instantiate() {
        this.validate();
        let ret = Integrator.empty();
        let fv = (v) => new PhysicsExpr_1.VarExpr(v);
        let sinTheta = PhysicsExpr_1.PhysExpr.InvokeMath(Math.sin, [fv(this.Theta)]);
        let cosTheta = PhysicsExpr_1.PhysExpr.InvokeMath(Math.cos, [fv(this.Theta)]);
        let inner = sinTheta.times(fv(this.G)).div(fv(this.L)); // G * sin(theta) / L
        let rhs = inner.plus((fv(this.C)).times(fv(this.Omega))); // inner + C * Omega
        let omegaE = fv(this.Omega).minus(rhs); // Omega - rhs
        ret.add([this.Omega, omegaE]);
        let thetaE = fv(this.Theta).plus(fv(this.Omega));
        ret.add([this.Theta, thetaE]);
        let diffSqr = (l, r) => fv(l).minus(fv(r)).square(); // (L - R)^2
        let inside = diffSqr(this.X_BOB, this.X_PIVOT).plus(diffSqr(this.Y_BOB, this.Y_PIVOT));
        let LE = PhysicsExpr_1.PhysExpr.InvokeMath(Math.sqrt, [inside]);
        ret.add([this.L, LE]);
        let XE = sinTheta.times(fv(this.L)).plus(fv(this.X_PIVOT)); // X_PIVOT + L * sin(Theta)
        let YE = cosTheta.times(fv(this.L)).plus(fv(this.Y_PIVOT)); // Y_PIVOT + L * cos(Theta)
        ret.add([this.X_BOB, XE]);
        ret.add([this.Y_BOB, YE]);
        return ret;
    }
    // free variables for updates
    frees() {
        return (new Set())
            .add(this.Omega).add(this.Theta).add(this.L)
            .add(this.X_BOB).add(this.Y_BOB);
    }
}
exports.Pendulum = Pendulum;
