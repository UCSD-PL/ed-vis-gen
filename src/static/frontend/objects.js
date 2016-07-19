//Add line
function addLine(){
 var name = allocSName();
 var line0 = new fabric.Line([50,100,50,300], {name: name, stroke:'cornflowerblue', strokeWidth: 2, top:100, left:100, lockRotation: true});
 canvas.add(line0);
 updateLog();
}

//Add triangle
function addTriangle(){
  var name = allocSName();
  var triangle0 = new fabric.Triangle({ name: name, width: 30, height: 30, fill:'cornflowerblue', top:100, left:100, lockRotation: true});
  canvas.add(triangle0);
  updateLog();
}

//Add circle
function addCircle(){
  var name = allocSName();
  var circle0 = new fabric.Circle({ name: name, radius: 30, fill: 'dodgerblue', top: 100, left: 100, lockRotation: true});
  canvas.add(circle0);
  updateLog();
}

//Add rectangle
function addRectangle(){
  var name = allocSName();
  var rectangle0 = new fabric.Rect({ name: name, width: 30, height:30, fill:'royalblue', top: 100, left:100, lockRotation: true});
  canvas.add(rectangle0);
  updateLog();
}

//Add pendulum
function addPendulum(){
  snapping = 'off';
  var rod = new fabric.Line([50, 50, 50, 250], {
    stroke:'cornflowerblue',
    strokeWidth: 2,
    selectable: true,
    hasControls: false,
    hasBorders: false,
    centeredRotation: false,
    centeredScaling: false,
    selection:true,
    name:'rod',
    'physics':'pendulum',
    'item':'rod',
    //originX: 'center',
    //originY: 'center'
  });


  var pivot = new fabric.Circle({
    radius: 4,
    fill: 'dogerblue',
    left: 47,
    top: 42,
    hasControls: false,
    hasBorders: false,
    name: 'pivot',
    'physics':'pendulum',
    'item':'pivot',
  });

  var bob = new fabric.Circle({
    radius: 30,
    fill: 'dogerblue',
    left: 21,
    top: 250,
    hasControls: false,
    hasBorders: false,
    name: 'bob',
    'physics':'pendulum',
    'item':'bob',

  });



  canvas.on('object:moving', function (options) {

    var objType = options.target.get('type');
    var p = options.target;

    if (objType == 'rod') {
        pivot.set({ x1: rod.x1, y1: rod.y1 });
        bob.set({ left: rod.x2, top: rod.y2 });
    }
    if (objType == 'circle') {
        if (p.name == 'pivot') {
            rod.set({
                x1: pivot.getCenterPoint().x, y1: pivot.getCenterPoint().y, selectable: true
            });
        } else {
            if (p.name == 'bob') {
                rod.set({
                    x2: bob.getCenterPoint().x, y2: bob.getCenterPoint().y, selectable: true
                });
            }
        }
    }
    rod.setCoords();
    pivot.setCoords();
    bob.setCoords();
    canvas.renderAll();

});

  canvas.add(rod);
  canvas.add(pivot);
  canvas.add(bob);
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
      physicsGroup.push(pendulumObj);
      pendulumObj = {'type':'pendulum'};

      }
    });
    exported['physicsGroups']=physicsGroup;
    exported['shapes']=shapes;
    console.log(exported);
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
      canvas.add(img);
  });}}

// allocator for names
var allocSName = (function() {
  var suffix = 0;
  return function() {
    return "S" + (suffix++).toString()
  };
})()
