//Add line
function addLine(){
 var line0 = new fabric.Line([50,100,50,300], {stroke:'cornflowerblue', strokeWidth: 2, top:100, left:100, lockRotation: true});
 canvas.add(line0);
 updateLog();
}

//Add triangle
function addTriangle(){
  var triangle0 = new fabric.Triangle({ width: 30, height: 30, fill:'cornflowerblue', top:100, left:100, lockRotation: true});
  canvas.add(triangle0);
  updateLog();
}

//Add circle
function addCircle(){
  var circle0 = new fabric.Circle({ radius: 30, fill: 'dodgerblue', top: 100, left: 100, lockRotation: true});
  canvas.add(circle0);
  updateLog();
}

//Add rectangle
function addRectangle(){
  var rectangle0 = new fabric.Rect({ width: 30, height:30, fill:'royalblue', top: 100, left:100, lockRotation: true});
  canvas.add(rectangle0);
  updateLog();
}

//Add pendulum
function addPendulum(){
  snapping = 'off';
  var pivot = new fabric.Circle({radius:4, fill:'dogerblue', top:42, left:47, lockRotation:true, 'physics':'pendulum', 'item':'pivot'});

  //console.log(pivot.get('physics'));
  //console.log(pivot.get('item'));
  var rod = new fabric.Line([50,50,50,250], {stroke:'cornflowerblue', strokeWidth: 2,lockRotation: true, 'physics':'pendulum', 'item':'rod'});
  var bob = new fabric.Circle({radius:30,fill:'dogerblue', top:250, left:21, lockRotation:true, 'physics':'pendulum', 'item':'bob'})
  canvas.add(pivot);
  canvas.add(rod);
  //console.log(rod.get('item'));
  canvas.add(bob);
  //console.log(bob.get('item'));
  updateLog();

};

//Add test
function addTest(){
  var testangle = new fabric.Rect({ width: 30, height:30, fill:'royalblue', top: 100, left:100, lockRotation: true, 'physics':'pendulum'});
  canvas.add(testangle);
  console.log(testangle.get('physics'));
}
transfer = function transfer() {
    physics.clear().renderAll();
    current = state.length - mods - 1;
    physics.loadFromJSON(state[current]);
    physics.renderAll();

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
    //var objsInCanvas = canvas.getObjects();
    canvas.forEachObject(function(obj){
      if (obj.get('physics') === 'pendulum'){

        if (obj.get('item') === 'pivot'){
          pendulumObj['pivot'] = obj;

        console.log(pendulumObj);}

        else if (obj.get('item') === 'rod'){
          pendulumObj['rod'] = obj;

        console.log(pendulumObj);

        }

        else{
          pendulumObj['bob'] = obj;

        console.log(pendulumObj);
        }
        //var groupObjects=obj.getObjects();
        //pendulumobj = {type:'pendulum', pivot: groupObjects[0], rod: groupObjects[1], bob:groupObjects[2]};
        //physicsGroup.push(pendulumobj);
      }
      else{
        shapes.push(obj);
      };
    });
    physicsGroup.push(pendulumObj);
    exported['physicsGroup']=physicsGroup;
    exported['shapes']=shapes;
    console.log(exported);
    return exported;
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
