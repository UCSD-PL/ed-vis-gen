fabric.DragPoint = fabric.util.createClass(fabric.Circle, {
  type: 'dragpoint',

  intialize: function() {
  },

  _render: function (ctx) {
  }
});

//Add drag points
function addWithDragPoint (obj) {
  var dragP = new fabric.Circle({
    top: 100 + obj.getHeight()/2,
    left: 100 + obj.getWidth()/2,
    originX: 'center',
    originY: 'center',
    fill: 'black',
    radius: 3
    //lockRotation: true,
    //lockScalingX: true,
    //lockScalingY: true
  });
  var drag_group = new fabric.Group([obj, dragP]);
  canvas.add(drag_group);
}

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

//Deletion
function deleteObjects(){
	var activeObject = canvas.getActiveObject(),activeGroup = canvas.getActiveGroup();
	if (activeObject) {
    canvas.remove(activeObject);
    updateLog();
  }
	else if (activeGroup) {
		var objectsInGroup = activeGroup.getObjects();
		canvas.discardActiveGroup();
		objectsInGroup.forEach(function(object) {
		canvas.remove(object);
    updateLog();
		});}
  }

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


//export to JSON
function exportjson(){
var json=JSON.stringify(canvas.toJSON());
//$http.post('http://serverurl/',stringJson);
}

/*
canvas.on({
'object:scaling': onChange
})

function onChange(obj) {
  if (obj.target.item(1) != null) {
    var point = obj.target.item(1),
        group = obj.target,
        scaleX = point.width / group.getWidth(),
        scaleY = point.height / group.getHeight();
    point.setScaleX(scaleX);
    point.setScaleY(scaleY);
  }
}
*/
