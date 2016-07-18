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
  var rectangle0 = new fabric.Rect({ name: "banana-face", width: 30, height:30, fill:'royalblue', top: 100, left:100, lockRotation: true});
  canvas.add(rectangle0);
  console.log(rectangle0.get('name'));
  updateLog();
}

transfer = function transfer() {
    physics.clear().renderAll();
    current = state.length - mods - 1;
    physics.loadFromJSON(state[current]);
    physics.renderAll();
};

//Add line with oversized dragPoint
function addLineWithBob() {
  //var rod = new fabric.Line([50,100,50,300], {name: "rod", left: 100, top: 100, stroke: 'blue', strokeWidth: 2});
  function makeCircle(radius, left, top, select, line1, line2) {
    var bob = new fabric.Circle({
      left: left,
      top: top,
      strokeWidth: 5,
      radius: radius,
      originX: 'center',
      originY: 'center',
      fill: '#fff',
      stroke: 'black',
      selectable: select
    });
    bob.hasControls = bob.hasBorders = false;

    bob.line1 = line1;
    bob.line2 = line2;

    return bob;
  }

  function makeALine(coords) {
    return new fabric.Line(coords, {
      fill: 'black',
      stroke: 'black',
      strokeWidth: 5,
      selectable: false,
      snap: false
    });
  }
  rod = makeALine([ 250, 250, 300, 350]);
  canvas.add(rod);
  canvas.add(
    makeCircle(5, rod.get('x1'), rod.get('y1'), false, rod),
    makeCircle(25, rod.get('x2'), rod.get('y2'), true, null, rod)
  );
  //var bob = new fabric.DragPoint({ name: "bob", shapeName: "rod", DX: 0.5, DY: 1, shape: rod, radius: 20});
  canvas.on('object:moving', function(e) {
    var p = e.target;
    p.line1 && p.line1.set({ 'x1': p.left, 'y1': p.top});
    p.line2 && p.line2.set({ 'x2': p.left, 'y2': p.top});
    canvas.renderAll();
  });
}

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
