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


function transmit() {
  var fabricJSON = JSON.parse(canvas);
  physics.loadFromJSON(fabricJSON);
}


//animation

function animation0(){
  var activeObject = physics.getActiveObject()
  var heights0 = activeObject.getTop();
  var drop0 = document.getElementById('physics').height
  var dis0 = drop0 - heights0 - activeObject.getHeight();
  var dis = "+=" + dis0.toString();
  activeObject.animate('top', dis, {
  duration: 1000,
  onChange: physics.renderAll.bind(physics),
});
}

function updatePhysics() {

}
