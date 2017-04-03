// utilities

// given a list of fields and two objects, copy the fields in the list from the
// RHS object to the LHS object
// e.g. l = {foo: 1, bar: 3}, r = {foo: 2, baz: 4}
// pluckFields(l, r, ['foo', 'baz'])
// l = {foo: 2, bar: 3, baz: 4}
function pluckFields(l, r, fields) {
  for (let field of fields) {
    l[field] = r[field];
  }
}

// given a list of fields and an obj, copy the fields specified by the list
function cloneFields(obj, fields){
  let ret = {}
  pluckFields(ret, obj, fields);
  return ret;
}

// super simple diff -- compare two objects and when their fields differ, return a diff entry.
// equality is shallow -- different objects that have the same structure, will be reported in diff.
function diff(l, r) {
  let ret = {};
  for (let k in l){
    if (l[k] != r[k]) {
      ret[k] = {l: l[k], r: r[k]};
    }
  }

  for (let k in r){
    if (l[k] != r[k]) {
      ret[k] = {l: l[k], r: r[k]};
    }
  }

  return ret;
}

function addShape(shape) {
  var name = allocSName();
  shape.set('name', name);
  canvas.add(shape);
  // object:added isn't firing, so we manually fire an object:modified event
  // canvas.fire('object:modified', {target: shape});
  // shape.trigger('modified');
  canvas.trigger('object:modified', {target: shape});
  updateModifications(true);
  return shape;
}

function internalAdd(type, shapeArgs) {
  let adder;
  switch (type) {
    case 'circle':
      adder = addCircle;
      break;
    case 'rect':
      adder = addRectangle;
      break;
    case 'triangle':
      adder = addTriangle;
      break;
    case 'line':
      adder = addLine;
      break;
    case 'arrow':
      adder = addArrow;
      break;
    case 'spring':
      adder = addSpring;
      break;
    case 'pendulum':
      adder = addPendulum;
      break;
    case 'mass':
      adder = addMass;
      break;
    default:
      console.log('unhandled type:');
      console.log(type);
  }

  let ret = adder(shapeArgs);

  return ret;
}

function externalAdd(type, shapeArgs) {
  saveToHistory(internalAdd(type, shapeArgs), Actions.CreateObject, shapeArgs);
}

//Add line
function addLine(opts){
  opts = opts || {x1: 50, y1: 100, x2: 50, y2: 300, angle:0, stroke: 'royalblue', strokeWidth: 3, top:100, left: 100, centeredRotation: false};
  // console.log(opts);
  let points = [opts.x1, opts.y1, opts.x2, opts.y2];
  let line0 = new fabric.Line(points, opts);
  //console.log(line0);
  // console.log(line0);
  return addShape(line0);
}

//Add triangle
function addTriangle(shapeArgs){
  shapeArgs = shapeArgs || {height: 30, width:30, fill: 'royalblue', top: 100, left: 100, lockRotation: true, strokeWidth:0};
  let triangle0 = new fabric.Triangle(shapeArgs);
  return addShape(triangle0);
}

//Add circle
function addCircle(shapeArgs){
  shapeArgs = shapeArgs || {radius: 30, fill: 'royalblue', top: 100, left: 100, lockRotation: true, strokeWidth:0, lockUniScaling: true};
  var circle0 = new fabric.Circle(shapeArgs);
  return addShape(circle0);
}

//Add rectangle
function addRectangle(shapeArgs){
  shapeArgs = shapeArgs || {width: 30, height: 30, fill: 'royalblue', top: 100, left: 100, lockRotation: true, strokeWidth:0};
  var rectangle0 = new fabric.Rect(shapeArgs);
  return addShape(rectangle0);
}

// assumes args are instantiated
function makeArrow(shapeArgs) {
  let {lneArgs, triArgs, arrArgs} = shapeArgs;
  let {points, args} = lneArgs;
  let lineArrow = new fabric.Line(points, args);
  let triangleArrow = new fabric.Triangle(triArgs);
  let arrowGroup = new fabric.Group([lineArrow, triangleArrow], arrArgs);
  return arrowGroup;
}

//Add arrow
function addArrow(shapeArgs){
  shapeArgs = shapeArgs || {
    lneArgs: {
      points: [50,160,50,320],
      args: {stroke:'black', strokeWidth: 10, top: 160, left: 115, originX: 'center', originY: 'center'}
    },
    triArgs: {width: 30, height:30, fill: 'black', top: 60, left: 100, strokeWidth: 1},
    arrArgs: {type: 'arrow', centeredRotation: false}
  }
  let arrow = makeArrow(shapeArgs);
  return addShape(arrow);
}

// toggle snapping on and off
function toggleSnap() {
  if (snapping == 'on') {
    snapping = 'off'
  }
  else {
    snapping = 'on'
  }
}

//Add mass
function addMass(shapeArgs){
  // console.log('addMass not implemented!');
  let defaultArgs = {
    lneArgs: {
      points: [100,120,100,80],
      args: {
        stroke:'black', strokeWidth: 10, top: 120, left: 140, originX: 'center',
        originY: 'center'
      }
    },
    triArgs: {
      width: 30, height:30, fill: 'black', top: 70, left: 125, strokeWidth: 1
    },
    arrArgs: {
      type: 'arrow', selectable: false, physics: 'mass', centeredRotation: false
    },
    massArgs: {
      radius: 40, fill: 'orange', top: 100, left: 100, lockRotation: true,
      strokeWidth:0, lockUniScaling: true, physics: 'mass'
    }
  };
  shapeArgs = shapeArgs || defaultArgs;
  // let diffed = diff(shapeArgs, defaultArgs);
  // console.log(shapeArgs);
  let velocity = makeArrow(shapeArgs);
  // console.log(velocity.getLeft())
  // console.log(velocity.getTop())

  let {massArgs} = shapeArgs;
  const mass = new fabric.Circle( massArgs );
  mass.set('velocity', velocity);

  let physGroup = [mass, velocity];
  velocity.set('physicsGroup', physGroup);
  mass.set('physicsGroup', physGroup);

  addShape(mass);
  addShape(velocity);

  const updater = () => {
    // console.log(mass.getLeft())
    // console.log(mass.getTop())
    // console.log(mass.get('radius'))
    const {x, y} = mass.getCenterPoint()
    // const scaleY = velocity.get('scaleY')
    velocity.setLeft(x - 15);
    velocity.setTop(y - 70);
    velocity.setCoords();
    velocity.trigger('modified');
    // canvas.fire('object:moving', {target: velocity});
    // console.log(velocity.get('type'))
    canvas.renderAll();
    updateModifications(true);
  }

  mass.on('moving', updater);
  mass.on('modified', updater);

  return mass;
}

//Add spring
function addSpring(shapeArgs){
  shapeArgs = shapeArgs || { dx:0, width: 30, height: 200, stroke:'black', top:250, left:100, angle:180, physics:'spring', centeredRotation: false};
  let spring = new fabric.Spring(shapeArgs);
  spring.set('physicsGroup', [spring]);
  return addShape(spring);
}

//Add pendulum
function addPendulum(shapeArgs){
  //add rod
  shapeArgs = shapeArgs || {x1: 50, y1: 50, x2: 50, y2: 250};
  let {x1, y1, x2, y2} = shapeArgs;
  var rodname = allocSName();
  var rod = new fabric.Line([x1, y1, x2, y2], {
    name: rodname,
    stroke:'black',
    strokeWidth: 2,
    selectable: false,
    hasControls: false,
    hasBorders: false,
    centeredRotation: false,
    centeredScaling: false,
    selection:true,
    snap: false,
    physics:'pendulum',
    item:'rod',
    //originX: 'center',
    //originY: 'center'
  });
  //add pivot
  var pivotname = allocSName();
  var pivot = new fabric.Circle({
    name: pivotname,
    radius: 4,
    fill: 'dodgerblue',
    left: x1-2,
    top: y1-8,
    hasControls: false,
    hasBorders: false,
    physics:'pendulum',
    item:'pivot',
  });
  //add bob
  var bobname = allocSName();
  var bob = new fabric.Circle({
    name: bobname,
    radius: 30,
    fill: 'dodgerblue',
    left: x2 - 29,
    top: y2,
    hasControls: false,
    hasBorders: false,
    physics:'pendulum',
    item:'bob',

  });

  let physicsGroup = [rod, pivot, bob];
  pivot.set('physicsGroup', physicsGroup);
  rod.set('physicsGroup', physicsGroup);
  bob.set('physicsGroup', physicsGroup);



  //Attach pendulum pivot and bob
  // TODO: delete needs to clear these event listeners, which requires factoring
  // function out into static func. not sure how to do that.
  canvas.on('object:moving', function (options) {

    var p = options.target;
    if (p === pivot) {
      rod.set({
              x1: pivot.getCenterPoint().x, y1: pivot.getCenterPoint().y
        });
    } else if (p === bob) {
      rod.set({
          x2: bob.getCenterPoint().x, y2: bob.getCenterPoint().y
      });
    }

    rod.setCoords();
    pivot.setCoords();
    bob.setCoords();
    canvas.renderAll();

  });

    canvas.add(rod);
    canvas.add(pivot);
    canvas.add(bob);
    // canvas.tr('object:modified', {target: bob});
    bob.trigger('modified');
    updateModifications(true);
    canvas.renderAll();

    return bob;

}


function makeArrowArgs(arr) {
  let json = arr.toJSON();
  let [triSON, liSON] = json.objects;
  if (triSON.type == 'line') {
    let tmp = triSON;
    triSON = liSON;
    liSON = tmp;
  }

  let lneArgs = {
    points: [liSON.x1, liSON.y1, liSON.x2, liSON.y2],
    args: cloneFields(liSON, ['stroke', 'strokeWidth', 'top', 'left', 'originX', 'originY'])
  }
  let triArgs = cloneFields(triSON, ['width', 'height', 'fill', 'top', 'left', 'stroke', 'strokeWidth']);
  let arrArgs = cloneFields(json, ['type', 'centeredRotation', 'angle', 'scaleX', 'scaleY', 'top', 'left', 'physics']);

  return { lneArgs: lneArgs, triArgs: triArgs, arrArgs: arrArgs };
}

function makeSpringArgs(spring){
  let sprJSON = spring.toJSON();
  let args = cloneFields(sprJSON, ['stroke', 'dx', 'width', 'height', 'left', 'top', 'angle', 'physics', 'scaleX', 'scaleY']);
  // { dx:0, width: 30, height: 200, stroke:'black', top:250, left:100, angle:180, physics:'spring'}
  return args;
}

function makePendulumArgs(pend) {
  let [rod, pivot, bob] = pend.physicsGroup;
  return {x1: pivot.getCenterPoint().x, x2: bob.getCenterPoint().x, y1: pivot.getCenterPoint().y, y2: bob.getCenterPoint().y};
}

function makeMassArgs(mass) {
  let velocityArgs = makeArrowArgs(mass.velocity);

  let massJSON = mass.toJSON();

  // console.log(velocityArgs);
  // console.log(massJSON);



  let massArgs = cloneFields( massJSON, ['radius', 'fill', 'top', 'left', 'lockRotation', 'scaleX', 'scaleY', 'strokeWidth', 'lockUniScaling', 'physics']);
  velocityArgs.massArgs = massArgs;

  return velocityArgs;
}


function makeShapeArgs(shape) {
  let ret;
  if (shape.physics == 'none' || shape.physics == 'spring') {
    switch(shape.type) {
      case 'arrow':
        ret = makeArrowArgs(shape);
      break;
      case 'circle':
      case 'line':
      case 'rect':
      case 'triangle':
        ret = getCurrentState({obj: shape, type: shape.get('type')});
      break;
      case 'spring':
        ret = makeSpringArgs(shape);
        break;
      default:
        console.log('unimplemented:');
        console.log(shape.type);
        ret = {}
    }
  } else if (shape.physics == 'pendulum') {
    ret = makePendulumArgs(shape);
  } else if (shape.physics == 'mass') {
    ret = makeMassArgs(shape);
  } else {
    console.log('unhandled phyiscs:');
    console.log(shape);
  }
  ret.type = shape.type;
  ret.physics = shape.physics;
  return ret;
}

function getCommonState(lhs, rhs) {
  let properties = ['scaleX','scaleY','fill','stroke','top','left','lockRotation','strokeWidth','angle']
  for (let prop of properties){
    lhs[prop] = rhs.get(prop);
  }
}

function getCurrentState(wrappedObject) {
  let obj = wrappedObject.obj;
  let type = wrappedObject.type;
  let ret = {obj: obj, type: type};
  getCommonState(ret, obj);
  switch (type) {
    case 'circle':
      ret.radius = obj.get('radius');
      break;
    case 'rect':
    case 'triangle':
      ret.height = obj.get('height');
      ret.width = obj.get('height');
      break;
    case 'line':
      // assumes lines are 4 points
      ret.x1 = obj.get('x1');
      ret.x2 = obj.get('x2');
      ret.y1 = obj.get('y1');
      ret.y2 = obj.get('y2');
      break;
    case 'arrow':
      // setting the strokeWidth of the group also modifies the strokewidth
      // of the triangle arrowhead, which is not desired.
      delete ret.strokeWidth; /// ZZZZ
      break;
    default:
      console.log('unhandled case:')
      console.log(type);
  }

  return ret;
}

function checkUndoRedo() {
  let undoBtn = document.getElementById('undoButton');
  let redoBtn = document.getElementById('redoButton');
  undoBtn.disabled = undoList.length == 0;
  redoBtn.disabled = redoList.length == 0;
}

function saveToHistory(obj, action, args){

  undoList.push({act: action, args: args});
  redoList = [];

  checkUndoRedo();
}

//Return two arrays, one for physics objects, one for other shapes
function transfer() {

    //initialize physicsGroup and shapes
    var canvasJSON = canvas.toJSON();
    var exported = {};
    var physicsGroup = [];
    var shapes =[];
    var pendulumObj = {'type':'pendulum'};

    //iterate through all objects on canvas
    canvas.forEachObject(function(obj){
      if (obj.get('physics') === 'pendulum'){

        if (obj.get('item') === 'pivot'){
          pendulumObj['pivot'] = obj;
        }

        else if (obj.get('item') === 'rod'){
          pendulumObj['rod'] = obj;
        }

        else{
          pendulumObj['bob'] = obj;
        }
      } else if (obj.get('physics') === 'mass') {
        if (obj.get('type') === 'circle') {
          let physGroup = {
            type: 'mass',
            mass: obj,
            velocity: obj.velocity
          }

          physicsGroup.push(physGroup)

          // console.log(JSON.parse(JSON.stringify(obj)))
        }
      }
      else {
        if (obj.get('type') === 'snap') {
          return;
        } else if (obj.get('type') === 'dragPoint' && !obj.get('eddie:active')) { // don't take inactive dragpoints
          // console.log('filtering out:');
          // console.log(obj);
          return;
        }
        shapes.push(obj);
      };
    //return pendulum as a physics group
    if ('pivot' in pendulumObj && 'rod' in pendulumObj && 'bob' in pendulumObj) {
      var pendulumname = allocSName();
      pendulumObj[name] = pendulumname;
      physicsGroup.push(pendulumObj);
      pendulumObj = {'type':'pendulum'};

      }
    });
    exported['physicsGroups']=physicsGroup;
    exported['shapes']=shapes;
    console.log(exported);
    return JSON.parse(JSON.stringify(exported));
  }

function deleteObject(obj) {
  // canvas.remove(activeObject);

  if (obj.get('physics') == 'none' ) {
    // no dependencies
    canvas.remove(obj)
    candidateDragPoints.delete(obj);
    SnapGlobals.POINTS.delete(obj);
  } else {
    // console.log(obj);
    obj.get('physicsGroup').forEach(o => {
      canvas.remove(o);
      candidateDragPoints.delete(o);
      SnapGlobals.POINTS.delete(o);
    });
  }

  updateModifications(true);
  window.BACKEND.drawToPhysics(fabricJSON, physics);
}

//Deletion
function deleteObjects(){
	var activeObject = canvas.getActiveObject(), activeGroup = canvas.getActiveGroup();
  // console.log(activeGroup);
  //Delete active object. if the object is in a physics group, delete the other objects.
  // save current object state onto undo list
	if (activeObject) {
    saveToHistory(activeObject, Actions.DeleteObject, makeShapeArgs(activeObject));
    // console.log('pushed to history:');
    // console.log(makeShapeArgs(activeObject));
    deleteObject(activeObject);

  } else if (activeGroup) {
		var objectsInGroup = activeGroup.getObjects();
		canvas.discardActiveGroup();
		objectsInGroup.forEach(function(object) {
		    canvas.remove(object);
        candidateDragPoints.delete(object);
        SnapGlobals.POINTS.delete(object);
		});

    updateModifications(true);
    window.BACKEND.drawToPhysics(fabricJSON, physics);
  }
}

//Upload image
function addImageFromURL(){
  const url = prompt("Please enter the URL of image");
  if (url){ // TODO: validate
    fabric.Image.fromURL(url, function(img){
      addShape(img);
    });
  }
}

// allocator for names
var allocSName = (function() {
  var suffix = 0;
  return function() {
    return "S" + (suffix++).toString()
  };
})();

// helper function: for each dragpoint in canvas, invoke the callback with dp as argument
function forEachDP(callback) {
  canvas.forEachObject(o => {
    // if (o.get('type') == 'dragPoint') {
    //   callback(o);
    // }
    if (o instanceof fabric.DragPoint) {
      callback(o);
    }
  });
}
