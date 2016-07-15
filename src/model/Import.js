"use strict";
const Model_1 = require('./Model');
const Util_1 = require('../util/Util');
const Shapes_1 = require('./Shapes');
const Physics_1 = require('./Physics');
const Variable_1 = require('./Variable');
function normalizeFabricShape(s) {
    let ret;
    if (s.type == 'circle') {
        let newS = Object.assign({}, s);
        newS.radius *= Math.sqrt(newS.scaleX * newS.scaleY);
        newS.left += newS.radius;
        newS.top += newS.radius;
        ret = newS;
    }
    else if (s.type == 'rect') {
        let newS = Object.assign({}, s);
        newS.width *= newS.scaleX / 2;
        newS.left += newS.width;
        newS.height *= newS.scaleY / 2;
        newS.top += newS.height;
        ret = newS;
    }
    else if (s.type == 'line') {
        ret = Object.assign({}, s);
    }
    else {
        console.log('unrecognized shape in normalize:');
        console.log(s);
        Util_1.assert(false);
    }
    return ret;
}
function buildBackendShapes(store, s) {
    let shape;
    if (s.type == 'circle') {
        let newS = s;
        let [x, y, r] = Util_1.map3Tup([newS.left, newS.top, newS.radius], v => store.allocVar(v));
        shape = new Shapes_1.Circle(x, y, r, "black", newS.fill);
    }
    else if (s.type == 'rect') {
        let newS = s;
        let [x, y, dx, dy] = Util_1.map4Tup([newS.left, newS.top, newS.width, newS.height], v => store.allocVar(v));
        shape = new Shapes_1.Rectangle(x, y, dx, dy, 'black');
    }
    else if (s.type == 'line') {
        let newS = s;
        let [x1, y1] = Util_1.map2Tup([newS.left, newS.top], v => store.allocVar(v));
        let [x2, y2] = Util_1.map2Tup([newS.left + newS.width, newS.top + newS.height], v => store.allocVar(v));
        shape = new Shapes_1.Line([[x1, y1], [x2, y2]], newS.fill, false);
    }
    else {
        console.log('unrecognized fabric tag:');
        console.log(s);
        Util_1.assert(false);
    }
    return shape;
}
function buildPendulum(state, pivot, bob, rod) {
    let pBuilder = ([nme, v]) => state.addVar(Variable_1.VType.Prim, nme, v);
    let cBuilder = ([nme, v]) => state.addVar(Variable_1.VType.Cass, nme, v);
    let store = state.eval();
    Util_1.assert(pivot instanceof Shapes_1.Circle, 'pendulum builder expected circle for pivot');
    Util_1.assert(bob instanceof Shapes_1.Circle, 'pendulum builder expected circle for bob');
    Util_1.assert(rod instanceof Shapes_1.Line, 'pendulum builder expected line for rod');
    let [pivotS, bobS, rodS] = [pivot, bob, rod];
    let [pivX, pivY] = Util_1.map2Tup([pivotS.x, pivotS.y], v => store.get(v));
    let [bobX, bobY] = Util_1.map2Tup([bobS.x, bobS.y], v => store.get(v));
    let [dy, dx] = [pivY - bobY, pivX - bobX];
    let [omega, theta, l] = Util_1.map3Tup([['omega', 0], ['theta', Math.atan2(dy, dx)], ['L', Math.sqrt(dx * dx + dy * dy)]], pBuilder);
    let [g, c] = Util_1.map2Tup([['G', 0.98], ['C', 0.01]], pBuilder);
    let pend = new Physics_1.Pendulum(omega, theta, l, c, bobS.x, bobS.y, pivotS.x, pivotS.y, g);
    return pend;
}
function buildModel(canvas, renderer) {
    let retStore = Model_1.State.empty();
    let objs = canvas.shapes;
    let normObjs = objs.map(normalizeFabricShape);
    normObjs.map(fs => buildBackendShapes(retStore, fs)).forEach(shape => {
        retStore = retStore.addShape(shape, false);
    });
    canvas.physicsGroups.forEach(grp => {
        let newShapes;
        let newGroup;
        if (grp.type == 'pendulum') {
            let physObj = Object.assign({}, grp);
            let [pivot, bob, rod] = Util_1.map3Tup([physObj.pivot, physObj.bob, physObj.rod], (s) => buildBackendShapes(retStore, normalizeFabricShape(s)));
            newShapes = [pivot, bob, rod];
            newGroup = buildPendulum(retStore, pivot, bob, rod);
        }
        else {
            console.log('unrecognized group tag:');
            console.log(grp);
        }
        newShapes.forEach(s => retStore = retStore.addShape(s, false));
        retStore.addPhysGroup(newGroup, renderer);
    });
    let ret = new Model_1.Model(retStore);
    return ret;
}
exports.buildModel = buildModel;
