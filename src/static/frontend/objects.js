function addShape(shape) {
  var name = allocSName();
  shape.set('name', name);
  canvas.add(shape);
  // object:added isn't firing, so we manually fire an object:modified event
  canvas.fire('object:modified', {target: shape});
  updateLog();
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
  var spring = new fabric.Spring([50,50,0,250],{stroke:'black',top: 100, left:100, lockSkewingX:true,'physics':'spring'});
  addShape(spring);
}

//Add pendulum
function addPendulum(){

  var rodname = allocSName();
  // snapping = 'off';
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



  // TODO: refactor
  canvas.on('object:moving', function (options) {

    var p = options.target;

    // if (p === rod ) {
    //     pivot.set({ x1: rod.x1, y1: rod.y1 });
    //     bob.set({ left: rod.x2, top: rod.y2 });
    // }
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
  updateLog();
  canvas.renderAll();

}


transfer = function transfer() {
    // physics.clear().renderAll();
    current = state.length - mods - 1;
    // physics.loadFromJSON(state[current]);
    // physics.renderAll();

    //save the JSON of canvas
    var canvasJSON = canvas.toJSON();


    //var grouped = canvas.getActiveGroup().toJSON()['objects'];
    //var activeGroup = canvas.getActiveGroup();
    //var objectsInGroup = activeGroup.getObjects();
    //canvas.discardActiveGroup();

    //objectsInGroup.forEach(function(object) {
		//    canvas.remove(object);
    //});
    //var objects = canvas.toObject()['objects'];
  //******  console.log(activeGroup.toJSON()['objects'])
    //var exported = {'groups': grouped, 'shapes' : objects}

    //objectsInGroup.forEach(function(object) {
		//    canvas.add(object);
    //});

    //Array of grouped and ungrouped objects

    var exported = {};
    var physicsGroup = [];
    var shapes =[];
    var pendulumObj = {'type':'pendulum'};

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
        //var groupObjects=obj.getObjects();
        //pendulumobj = {type:'pendulum', pivot: groupObjects[0], rod: groupObjects[1], bob:groupObjects[2]};
        //physicsGroup.push(pendulumobj);
      }
      else{
        shapes.push(obj);
      };

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
    return JSON.parse(JSON.stringify(exported)); // flattens objects
  }
//    for (obj in objsInCanvas) {
//        // this gives you a group
//        if(objsInCanvas[obj].get('physics')==='pendulum') {
            // get all the objects in a group
//            var groupObjects = objsInCanvas[obj].getObjects();
            // iterate through the group
//            pendulumobj = {type:'pendulum', pivot: groupObjects[0], rod: groupObjects[1], bob:groupObjects[2]};
//            physicsGroup.push(pendulumobj);
//            exported['physicsGroup'] = physicsGroup;
//            console.log(exported);


  //        }
  //      else{
  //        console.log(obj);
  //        shapes.push(obj);
  //      }

//};
//     console.log(shapes);

//};


//Deletion
function deleteObjects(){
	var activeObject = canvas.getActiveObject(),activeGroup = canvas.getActiveGroup();
	if (activeObject) {canvas.remove(activeObject);}
	else if (activeGroup) {
		var objectsInGroup = activeGroup.getObjects();
		canvas.discardActiveGroup();
		objectsInGroup.forEach(function(object) {
		canvas.remove(object);
		});}}

//Select mode
function selectmode(){
	canvas.isDrawingMode=false;
}
//Drawing mode
function Drawingmode(){
	canvas.isDrawingMode=true;
}

//Upload image
function EnterURL(){
  var URL = prompt("Please enter the URL of image");
  if (URL != null){
    fabric.Image.fromURL(URL, function(img){
      addShape(img);
  });}}

// allocator for names
var allocSName = (function() {
  var suffix = 0;
  return function() {
    return "S" + (suffix++).toString()
  };
})();
