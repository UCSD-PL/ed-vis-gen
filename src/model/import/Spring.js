"use strict";
const Physics_1 = require('../Physics');
const Util_1 = require('../../util/Util');
function buildSpringGroup(s, state) {
    let store = state.store.eval();
    // assumes spring is expanded by 50% i.e. initial rest length is 2/3 delta
    let [ix, iy] = Util_1.map2Tup([s.dx, s.dy], v => store.get(v) * 2 / 3);
    let initTheta = Math.atan2(store.get(s.dy), store.get(s.dx)); // uh.... atan dy dx???
    let [fx, fy] = Util_1.map2Tup([['FX', 0], ['FY', 0]], ([name, val]) => state.allocVar(val, name));
    let [vx, vy] = Util_1.map2Tup([['VX', 0], ['VY', 0]], ([name, val]) => state.allocVar(val, name));
    let [rlx, rly] = Util_1.map2Tup([['RLX', ix], ['RLY', iy]], ([name, val]) => state.allocVar(val, name));
    let connectedX = [];
    let connectedY = [];
    // public coeffFriction: Variable, // coefficient of moving friction
    // public mass: Variable,          // mass
    // public springConstant: Variable, // spring constant k
    // public gravConstant: Variable
    let [c, g] = Util_1.map2Tup([['C', 10], ['G', 9.8]], ([name, val]) => state.allocVar(val, name));
    let [mass, k] = Util_1.map2Tup([['M', 100], ['K', 4]], ([name, val]) => state.allocVar(val, name));
    return new Physics_1.SpringGroup(s.dx, s.dy, { x: ix, y: iy }, initTheta, fx, vx, rlx, connectedX, fy, vy, rly, connectedY, c, mass, k, g);
}
exports.buildSpringGroup = buildSpringGroup;
