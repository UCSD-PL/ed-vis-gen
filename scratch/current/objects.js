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

//Add Circle
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

transfer = function transfer() {
    physics.clear().renderAll();
    current = state.length - mods - 1;
    physics.loadFromJSON(state[current]);
    physics.renderAll();

    //save the JSON of canvas
    var canvasJSON = canvas.toJSON();


    var grouped = canvas.getActiveGroup().toJSON()['objects'];
    var activeGroup = canvas.getActiveGroup();
    var objectsInGroup = activeGroup.getObjects();
    canvas.discardActiveGroup();

    objectsInGroup.forEach(function(object) {
		    canvas.remove(object);
    });
    var objects = canvas.toObject()['objects'];
  //******  console.log(activeGroup.toJSON()['objects'])
    var exported = {'groups': grouped, 'shapes' : objects}

    objectsInGroup.forEach(function(object) {
		    canvas.add(object);
    });

    console.log(exported);

};


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
