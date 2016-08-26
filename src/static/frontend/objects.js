function addShape(shape) {
  var name = allocSName();
  shape.set('name', name);
  canvas.add(shape);
  // object:added isn't firing, so we manually fire an object:modified event
  canvas.fire('object:modified', {target: shape});
  updateModifications(true);
}



//Add line
function addLine(){
 var line0 = new fabric.Line([50,100,50,300], {stroke:'cornflowerblue', strokeWidth: 3, top:100, left:100});
 addShape(line0);
}

//Add triangle
function addTriangle(){
  var triangle0 = new fabric.Triangle({width: 30, height: 30, fill:'cornflowerblue', top:100, left:100, lockRotation: true, strokeWidth:0});
  addShape(triangle0);
}

//Add circle
function addCircle(){
  var circle0 = new fabric.Circle({radius: 30, fill: 'dodgerblue', top: 100, left: 100, lockRotation: true, strokeWidth:0});
  circle0.lockUniScaling = true;
  addShape(circle0);
}

//Add rectangle
function addRectangle(){
  var rectangle0 = new fabric.Rect({width: 30, height:30, fill:'royalblue', top: 100, left:100, lockRotation: true, strokeWidth:0});
  addShape(rectangle0);
}

//Add arrow
function addArrow(){
  var lineArrow = new fabric.Line([50,160,50,320], {stroke:'black', strokeWidth: 10, top: 160, left: 115, originX: 'center', originY: 'center'});
  var triangleArrow = new fabric.Triangle({width: 30, height:30, fill: 'black', top: 60, left: 100});
  var arrowGroup = new fabric.Group([lineArrow, triangleArrow], {type: 'arrow'});
  addShape(arrowGroup);
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

//Add spring
function addSpring(){
  var spring = new fabric.Spring({ dx:0, width: 30, height: 200, stroke:'black', top:100, left:100, angle:180, 'physics':'spring'});
  spring.set('physicsGroup', [spring]);
  addShape(spring);
}

//Add pendulum
function addPendulum(){
  //add rod
  var rodname = allocSName();
  var rod = new fabric.Line([50, 50, 50, 250], {
    name: rodname,
    stroke:'cornflowerblue',
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
    fill: 'dogerblue',
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
    fill: 'dogerblue',
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
    canvas.fire('object:modified', {target: bob});
    updateModifications(true);
    canvas.renderAll();

}



//Return two arrays, one for physics objects, one for other shapes
transfer = function transfer() {

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
      }
      else {
        if (obj.get('type') === 'snap') {
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


//Deletion
function deleteObjects(){
	var activeObject = canvas.getActiveObject(), activeGroup = canvas.getActiveGroup();
  // console.log(activeGroup);
  //Delete active object. if the object is in a physics group, delete the other objects.
	if (activeObject) {
    // canvas.remove(activeObject);
    if (activeObject.get('physics') == 'none' ) {
      // no dependencies
      canvas.remove(activeObject)
    } else {
      activeObject.get('physicsGroup').forEach(o => canvas.remove(o));
    }
  } else if (activeGroup) {
		var objectsInGroup = activeGroup.getObjects();
		canvas.discardActiveGroup();
		objectsInGroup.forEach(function(object) {
		    canvas.remove(object);
		});
  }
}

//Upload image
function EnterURL(){
  var URL = prompt("Please enter the URL of image");
  if (URL != null){
    fabric.Image.fromURL(URL, function(img){
      canvas.add(img);
      // TODO
  });}}

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
