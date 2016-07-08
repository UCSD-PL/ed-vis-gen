"use strict";
const Model_1 = require('./Model');
const Util_1 = require('../util/Util');
const Shapes_1 = require('./Shapes');
// given a json of shapes, build a model for the shapes
function buildModel(shapes) {
    // console.log()
    let retStore = Model_1.State.empty();
    let objs = shapes.objects;
    // two passes: first, normalize to eddie's position conventions
    objs.forEach(s => {
        if (s.type == 'circle') {
            let newS = s;
            newS.left = newS.left + newS.radius;
            newS.top = newS.top + newS.radius;
        }
    });
    // next, allocate variables and shapes for each input object
    objs.forEach(s => {
        let shape;
        if (s.type == 'circle') {
            let newS = s;
            let [x, y, r] = Util_1.map3Tup([newS.left, newS.top, newS.radius], v => retStore.allocVar(v)); // implicitly
            shape = new Shapes_1.Circle(x, y, r, "black", newS.fill);
        }
        else if (s.type == 'rect') {
            let newS = s;
            let [x, y, dx, dy] = Util_1.map4Tup([newS.left, newS.top, newS.width, newS.height], v => retStore.allocVar(v));
            shape = new Shapes_1.Rectangle(x, y, dx, dy, 'black');
        }
        else if (s.type == 'line') {
            let newS = s;
            let [x1, y1] = Util_1.map2Tup([newS.left, newS.top], v => retStore.allocVar(v));
            shape = new Shapes_1.Line([[x1, y1]], newS.fill, false);
        }
        else {
            console.log('unrecognized fabric tag:');
            console.log(s);
            assert(false);
        }
        retStore = retStore.addShape(shape);
    });
    return new Model_1.Model(retStore);
}
exports.buildModel = buildModel;
