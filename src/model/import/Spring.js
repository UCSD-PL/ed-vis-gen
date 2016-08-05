"use strict";
const Physics_1 = require('../Physics');
const Variable_1 = require('../Variable');
const Util_1 = require('../../util/Util');
const Synthesis_1 = require('../Synthesis');
const Poset_1 = require('../../util/Poset');
const Ranking_1 = require('../Ranking');
function buildSpringGroup(s, state) {
    let store = state.store.eval();
    // assumes spring is expanded by 50% i.e. initial rest length is 2/3 delta
    let [ix, iy] = Util_1.map2Tup([s.dx, s.dy], v => store.get(v) * 2 / 3);
    let initTheta = Math.atan2(store.get(s.dy), store.get(s.dx)); // uh.... atan dy dx???
    let [fx, fy] = Util_1.map2Tup([['FX', 0], ['FY', 0]], ([name, val]) => state.allocVar(val, name));
    let [vx, vy] = Util_1.map2Tup([['VX', 0], ['VY', 0]], ([name, val]) => state.allocVar(val, name));
    let [rlx, rly] = Util_1.map2Tup([['RLX', ix], ['RLY', iy]], ([name, val]) => state.allocVar(val, name));
    // public coeffFriction: Variable, // coefficient of moving friction
    // public mass: Variable,          // mass
    // public springConstant: Variable, // spring constant k
    // public gravConstant: Variable
    let [c, g] = Util_1.map2Tup([['C', 10], ['G', 9.8]], ([name, val]) => state.allocVar(val, name));
    let [mass, k] = Util_1.map2Tup([['M', 100], ['K', 4]], ([name, val]) => state.allocVar(val, name));
    let eqs = Util_1.uniqify(new Set(Util_1.map(state.store.equations, e => e.vars())));
    Util_1.assert(s.dx instanceof Variable_1.CassVar && s.dy instanceof Variable_1.CassVar, 'expected cassowary variables for spring dimensions');
    Util_1.assert(s.x instanceof Variable_1.CassVar && s.y instanceof Variable_1.CassVar, 'expected cassowary variables for spring dimensions');
    let xSeed = new Set().add(s.dx); //.add(s.dy as CassVar)
    let ySeed = new Set().add(s.dy);
    let candXFrees = Util_1.filter(Synthesis_1.InteractionSynthesis.validFreeVariables(xSeed, eqs), vs => !vs.has(s.x));
    let candYFrees = Util_1.filter(Synthesis_1.InteractionSynthesis.validFreeVariables(ySeed, eqs), vs => !vs.has(s.y));
    // console.log('candidates for spring:')
    // console.log(candXFrees)
    // console.log(candYFrees)
    // rank the results
    let rankedX = new Poset_1.Poset(Util_1.map(candXFrees, frees => [frees, state.prog, state.store]), Ranking_1.TranslationFavored, [new Set(), state.prog, state.store]);
    let rankedY = new Poset_1.Poset(Util_1.map(candYFrees, frees => [frees, state.prog, state.store]), Ranking_1.TranslationFavored, [new Set(), state.prog, state.store]);
    let [xs] = rankedX.toArr()[0];
    let [ys] = rankedY.toArr()[0];
    let connectedX = [...xs];
    let connectedY = [...ys];
    return new Physics_1.SpringGroup(s.dx, s.dy, { x: ix, y: iy }, initTheta, fx, vx, rlx, connectedX, fy, vy, rly, connectedY, c, mass, k, g);
}
exports.buildSpringGroup = buildSpringGroup;
