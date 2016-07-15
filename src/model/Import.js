"use strict";
const Model_1 = require('./Model');
const Util_1 = require('../util/Util');
const Shapes_1 = require('./Shapes');
const Physics_1 = require('./Physics');
const Variable_1 = require('./Variable');
// given a fabric object, convert the coordinates to backend conventions
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
        newS.width *= newS.scaleX / 2; // fabric stores widths in the scale matrix, eddie dx = width/2
        newS.left += newS.width;
        newS.height *= newS.scaleY / 2;
        newS.top += newS.height;
        ret = newS;
    }
    else {
        console.log('unrecognized shape in normalize:');
        console.log(s);
        Util_1.assert(false);
    }
    return ret;
}
// given a store and (normalized) fabric shape, make variables in the store and return a backend shape over the variables
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
    return [s.name, shape];
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
    // L = sqrt(dx^2 + dy^2)
    // theta = atan2(dy, dx)
    let [omega, theta, l] = Util_1.map3Tup([['omega', 0], ['theta', Math.atan2(dy, dx)], ['L', Math.sqrt(dx * dx + dy * dy)]], pBuilder);
    let [g, c] = Util_1.map2Tup([['G', 0.98], ['C', 0.01]], pBuilder);
    // let points: Tup<Variable, Variable>[] = [[pivX, pivY], [bobX, bobY]]
    // let lever = new Line(points, 'black', false)
    // let dragPoint = new DragPoint(bobX, bobY, pivR, 'green')
    // let frees = (new Set<Variable>()).add(bobX).add(bobY)
    // pendulum group
    let pend = new Physics_1.Pendulum(omega, theta, l, c, bobS.x, bobS.y, pivotS.x, pivotS.y, g);
    return pend;
}
// given a json of shapes, build a model for the shapes
function buildModel(canvas, renderer) {
    // console.log()
    let retStore = Model_1.State.empty();
    let objs = canvas.shapes;
    // two passes: first, normalize to eddie's position conventions
    let normObjs = objs.map(normalizeFabricShape);
    // next, allocate variables and shapes for each input object
    normObjs.map(fs => buildBackendShapes(retStore, fs)).forEach(([name, shape]) => {
        retStore = retStore.addShape(name, shape, false);
    });
    canvas.physicsGroups.forEach(grp => {
        let newShapes;
        let newGroup;
        if (grp.type == 'pendulum') {
            let physObj = Object.assign({}, grp);
            let [pivot, bob, rod] = Util_1.map3Tup([physObj.pivot, physObj.bob, physObj.rod], (s) => buildBackendShapes(retStore, s));
            newShapes = [pivot, bob, rod];
            newGroup = buildPendulum(retStore, pivot, bob, rod);
        }
        else {
            console.log('unrecognized group tag:');
            console.log(grp);
        }
        newShapes.forEach(([name, s]) => retStore = retStore.addShape(name, s, false));
        retStore.addPhysGroup(newGroup, renderer);
    });
    let ret = new Model_1.Model(retStore);
    console.log('model:');
    console.log(ret);
    return ret;
}
exports.buildModel = buildModel;
