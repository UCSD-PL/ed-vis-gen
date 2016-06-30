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
