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

function externalAdd(type, shapeArgs) {
  let added;
  switch (type) {
    case 'circle':
      added = addCircle(shapeArgs);
      break;
    default:
      console.log('unhandled type:');
      console.log(type);
  }
  saveToHistory(added, Actions.CreateObject);
}

//Add line
function addLine(shapeArgs){
 var line0 = new fabric.Line([50,100,50,300], {stroke:'royalblue', strokeWidth: 3, top:100, left:100});
 return addShape(line0);
}

//Add triangle
function addTriangle(shapeArgs){
  var triangle0 = new fabric.Triangle({width: 30, height: 30, fill:'cornflowerblue', top:100, left:100, lockRotation: true, strokeWidth:0});
  return addShape(triangle0);
}

//Add circle
function addCircle(shapeArgs){
  console.log(shapeArgs);
  shapeArgs = shapeArgs || {radius: 30, fill: 'royalblue', top: 100, left: 100, lockRotation: true, strokeWidth:0};
  var circle0 = new fabric.Circle(shapeArgs);
  circle0.lockUniScaling = true;
  return addShape(circle0);
}

//Add rectangle
function addRectangle(shapeArgs){
  var rectangle0 = new fabric.Rect({width: 30, height:30, fill:'royalblue', top: 100, left:100, lockRotation: true, strokeWidth:0});
  return addShape(rectangle0);
}

//Add arrow
function addArrow(shapeArgs){
  var lineArrow = new fabric.Line([50,160,50,320], {stroke:'black', strokeWidth: 10, top: 160, left: 115, originX: 'center', originY: 'center'});
  var triangleArrow = new fabric.Triangle({width: 30, height:30, fill: 'black', top: 60, left: 100});
  var arrowGroup = new fabric.Group([lineArrow, triangleArrow], {type: 'arrow'});
  return addShape(arrowGroup);
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
  var lineArrow = new fabric.Line([100,120,100,80], {stroke:'black', strokeWidth: 10, top: 120, left: 140, originX: 'center', originY: 'center'});
  var triangleArrow = new fabric.Triangle({width: 30, height:30, fill: 'black', top: 70, left: 125});
  var arrowGroup = new fabric.Group([triangleArrow, lineArrow], {type: 'arrow', selectable: false, physics: 'gravity'});
  const velocity = arrowGroup;
  // console.log(velocity.getLeft())
  // console.log(velocity.getTop())

  const mass = new fabric.Circle(
    { radius: 40,
      fill: 'orange',
      top: 100, left: 100,
      lockRotation: true,
      strokeWidth:0,
      lockUniScaling: true,
      physics: 'gravity',
      velocity: velocity
    }
  );

  // mass.set('velocity', velocity)
  // console.log(mass.velocity);

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

  mass.on('moving', updater)
  mass.on('modified', updater);
}

//Add spring
function addSpring(shapeArgs){
  var spring = new fabric.Spring({ dx:0, width: 30, height: 200, stroke:'black', top:250, left:100, angle:180, 'physics':'spring'});
  spring.set('physicsGroup', [spring]);
  return addShape(spring);
}

//Add pendulum
function addPendulum(shapeArgs){
  //add rod
  var rodname = allocSName();
  var rod = new fabric.Line([50, 50, 50, 250], {
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
    left: 47,
    top: 42,
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
    left: 21,
    top: 250,
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

function getCurrentArgs(wrappedObject) {
  let obj = wrappedObject.obj;
  let type = wrappedObject.type;
  let ret = {obj: obj, type: type};
  switch (type) {
    case 'circle':
      ret.radius = obj.get('radius');
      ret.scaleX = obj.getScaleX();
      ret.scaleY = obj.getScaleY();
      ret.fill = obj.get('fill');
      ret.top = obj.get('top');
      ret.left = obj.get('left');
      ret.lockRotation = obj.get('lockRotation');
      ret.strokeWidth = obj.get('strokeWidth');
      break;
    default:
      console.log('unhandled case:')
      console.log(type);
  }

  return ret;
}

function saveToHistory(obj, action){
  switch (obj.get('type')) {
    case 'circle':

        let args = getCurrentArgs({obj: obj, type: obj.get('type')});

        undoList.push({act: action, args: args});
      break;
    default:
      console.log('unhandled object:');
      console.log(obj);
  }
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
      } else if (obj.get('physics') === 'gravity') {
        if (obj.get('type') === 'circle') {
          let physGroup = {
            type: 'gravity',
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
    // console.log(exported);
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
    saveToHistory(activeObject, Actions.DeleteObject);
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
