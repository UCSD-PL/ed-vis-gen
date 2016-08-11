var canvas = new fabric.CanvasEx('canvas'), // left-side panel
physics = new fabric.Canvas('physics'), // right-side panel
interact = new fabric.CanvasEx('interact'), // drag point editing panel
sims = new fabric.Canvas('sims'), // interaction editing panel

whereDP = 0, // checks which drag points to delete in the dragPointList

/* These arrays denote the location of the drag points in relation to
the top-left corner of the associated object multiplied by its dimension. */
arrayRect = [[0,0],[0,0.5],[0.5,0],[0.5,0.5],[0,1],[1,0],[0.5,1],[1,0.5],[1,1]],
arrayCirc = [[0.15,0.15],[0,0.5],[0.5,0],[0.5,0.5],[0.15,0.85],[0.85,0.15],[0.85,0.85],[1,0.5],[0.5,1]],
arrayLine = [[0,0],[0,0.5],[0,1]],
arrayArr = [[0.5,0],[0.5,0.5],[0.5,1]],
arrayPen = [[0.5,0],[0.5,0,4],[0.5,0.8]],
arraySpring = [[0.5,0],[0.5,0.5],[0.5,1]],
arrayBob = [[0,0.5],[0.5,0],[0.5,0.5],[1,0.5],[0.5,1]],
arrayRod = [[0,0.5]],
arrayPiv = [[0.5,0.5]],

dragPointList = [], // list of drag points on canvas
physicsObjectList = [], // list of objects with physics attributes on canvas

lastSim = 0, // last interaction for the drag point selection panel
currentSim = 0, // current interaction for the drag point selection panel
selectedSim = 0, // chosen interaction for the drag point selection panel

formerChoice = 0, /* the last choice selected by the drag point.
closing the overlay without accepting will cause the drag point to rever to it's "former choice" */

numOfChoices = 4, // # of "choices" for the drag point edit panel

currentDragPoint, // current drag point on the "sims" panel

dpColor = "red", // color of unselected drag points
dpSelectedColor = "orange", // color of selected drag points

state = [], // array list of modifications on canvas in JSON
mods = 0, // numer denotes how far back the user is undoing
fabricJSON, // JSON file transferred on to the "physics" canvas
current = 0; // current state on the "canvas" canvas

// if true, events are fired for individual objects on a canvas
canvas.fireEventForObjectInsideGroup = true;
interact.fireEventForObjectInsideGroup = true;

canvas.selection = true; // if true, canvas is in selection mode
physics.isDrawingMode = false; // if false, canvas is not in drawing mode

// canvasWidth and canvasHeight are resized according to the dimensions of the browser window
var canvasWidth = document.getElementById('canvas').width;
var canvasHeight = document.getElementById('canvas').height;

//resize the canvas
window.addEventListener('resize', resizeCanvas(), false);
window.addEventListener('resize', resizePhysicsPanel(), false);

// resizes the "canvas" canvas according to the current dimensions of the browser window
function resizeCanvas () {
 canvas.setHeight(window.innerHeight*0.7);
 canvas.setWidth(window.innerWidth*1.55/3);
 interact.setWidth(canvasWidth);
 interact.setHeight(canvasHeight);
 sims.setWidth(canvasWidth);
 sims.setHeight(canvasHeight);
 canvas.renderAll();
 canvasWidth = document.getElementById('canvas').width;
 canvasHeight = document.getElementById('canvas').height;
}

// resizes the "physics" canvas according to the current dimensions of the browser window
function resizePhysicsPanel () {
 physics.setHeight(window.innerHeight*0.7);
 physics.setWidth(window.innerWidth*(1-1.55/3));
 physics.renderAll();
}

resizeCanvas();
resizePhysicsPanel();

// adds drag points
function addDragPoints(obj, dx, dy) {
  var drag = new fabric.DragPoint({
      name: allocSName(),
      shape: obj,
      shapeName: obj.get('name'),
      DX: dx,
      DY: dy,
      fill: dpColor,
      radius: 7
    });
    drag.startDragPoint(obj, interact);
    interact.add(drag);

    drag.on('selected', function() {
      /*if a drag point hasn't been clicked before, upon being clicked,
      a drag point is selected and added to dragPointList*/
      if (this.get('fill') == dpColor && this.get('onCanvas') != true) {
        select(this);
      }
      // if it's on the canvas, but has been unselected on the dp selection panel, remove it from the canvas
      else if (this.get('fill') == dpSelectedColor && this.get('onCanvas') === true) {
        undoSelect(this);
        canvas.remove(this);
      }
      // if it's already on the canvas and reselected, do nothing
      else if (this.get('fill') == dpColor && this.get('onCanvas') === true) {}

      // undos selection of a drag point if you click it again so it won't show up on canvas
      else {
        undoSelect(this);
      }});

    // on right click, opens up the edit simulation panel
    drag.on('mousedown', function (options) {
      if (options.e.which === 3) {
          //console.log('BETTER BE RIGHT CLICKING');
          if (this.get('onCanvas') != true) {
              select(drag);
          }
          open1();
          onLoadSims(drag);
      } } );
  }
// adds all the drag points on the "interact" canvas
function addAllDP(array, obj) {
    if (dragPointList.length === 0 ) {
      for (var i = 0; i < array.length; i++) {
        addDragPoints(obj, array[i][0], array[i][1]);
      }}
    else {
      for (var i = 0; i < array.length; i++) {
        for (var j = 0; j < dragPointList.length; j++) {
            if (!checkDragPointLocation(dragPointList[j], obj, array[i][0], array[i][1])) {
                addDragPoints(obj, array[i][0], array[i][1]);
              }
            else {
              interact.add(dragPointList[j]);
              dragPointList[j].set({
                fill: dpSelectedColor
              });
            }
  }} }
}

// checks if a drag point is located in a specific part of the shape
function checkDragPointLocation(dp, obj, dx, dy) {
  if (dp.get('shapeName') === obj.get('name') && dx === dp.get('DX') && dy === dp.get('DY')) {
    return true;
  }
  else {
    return false;
  }
}

// checks if an object is in a group
function inGroup(obj, canvas) {
  canvas.forEachObject(function(o) {
    if (o.get('type') === 'group') {
      if (o.contains(obj)) {
        return true;
      }}
  });
  return false;
}

// checks if a particular drag point is already located on shape
function checkForDragPoints(obj, type) {
  if (obj.get('physics') === 'pendulum') {
    /*if (obj.get('item') === 'rod') {
      addAllDP(arrayRod, obj);
    }*/
    if (obj.get('item') === 'bob') {
      addAllDP(arrayBob, obj);
    }
    if (obj.get('item') === 'pivot') {
      addAllDP(arrayPiv, obj);
    }
  }
  else if (obj.get('physics') === 'spring') {
      addAllDP(arraySpring, obj);
  }
  else if (obj.get('physics') === 'none') {
    if (type === 'arrow') {
      addAllDP(arrayArr, obj);
    }
    else if (type === 'rect') {
      addAllDP(arrayRect, obj);
    }
    else if (type === 'circle') {
      addAllDP(arrayCirc, obj);
    }
    else if (type === 'line') {
      addAllDP(arrayLine, obj);
    }
    else { return; }
  }
  else { return; }
}

// adds in the candidate points on the interact canvas
function candidatePoints() {
  interact.clear();
  dragPointList = [];
  canvas.forEachObject( function (o) {
    if (o.get('type') == 'dragPoint') {
      dragPointList.push(o);
    }
  });
  //oldDragPointList = dragPointList;
  //dragPointList = [];
  canvas.forEachObject( function (obj) {
    if (obj.get('type') != 'dragPoint') {
      interact.add(obj);
      obj.set({
        selectable: false
      });
      checkForDragPoints(obj, obj.get('type'));
    }
  });
  interact.renderAll();
}

//selects drag point and adds it to the drag point list
function select(dragPoint) {
    dragPoint.set({
      fill: dpSelectedColor
    });
    dragPointList.push(dragPoint);
  }

//undos selection of a drag point when you click on the "x" in the second overlay
function undoSelect(dragPoint) {
  dragPoint.set({
    fill: dpColor,
    choice: formerChoice,
    onCanvas: false
  });

  function checkDP (dp) {
    return dp == dragPoint;
  }

  whereDP = dragPointList.findIndex(checkDP);

  dragPointList.splice(whereDP, 1);

  window.BACKEND.finishEditChoice();
}

//displays next simulation on the simulation selection panel
function onRight() {
  sims.clear();
  if (currentSim == numOfChoices) {
    lastSim = numOfChoices;
    currentSim = 0;
  }
  else {
    lastSim = currentSim;
    currentSim += 1;
  }
  currentDragPoint.set({
    choice: currentSim
  });
  window.BACKEND.drawToEdit(currentDragPoint.get('name'), currentSim, sims);
  sims.renderAll();
}

//displays previous simulation on the simulation selection panel
function onLeft() {
  sims.clear();
  if (currentSim == 0) {
    lastSim = 0;
    currentSim = numOfChoices;
  }
  else {
    lastSim = currentSim;
    currentSim -= 1;
  }
  currentDragPoint.set({
    choice: currentSim
  });
  window.BACKEND.drawToEdit(currentDragPoint.get('name'), currentSim, sims);
  sims.renderAll();
}

function onACCEPT() {
  // sets 'choice', the selected sim, to the corresponding dragpoint
  selectedSim = currentSim;
  currentDragPoint.set({
    choice: selectedSim
  });

  close1(); // closes current screen; returns to drag point selection panel
  window.BACKEND.drawToPhysics(fabricJSON, physics);
  window.BACKEND.finishEditChoice();
}

function onLoadSims(dragPoint) {
  // sets up JSON files the simsArray list and loads the current JSON
  sims.clear();
  currentDragPoint = dragPoint;  //.clone();
  currentSim = 0;
  formerChoice = currentDragPoint.get('choice');
  numOfChoices = BACKEND.getNumChoices(currentDragPoint.get("name") - 1);
  generateSims(currentDragPoint);
}

function generateSims(currentDP) {
  if (currentDP.get('onCanvas') != true) {
    canvas.add(currentDP);
    obj = currentDP.get('shape');
    currentDP.startDragPoint(obj);
    canvas.renderAll();
    myjson = JSON.stringify(canvas);
    fabricJSON = transfer();
    window.BACKEND.drawToPhysics(fabricJSON, physics);
  }
    window.BACKEND.drawToEdit(currentDP.get('name'), currentDP.get('choice'), sims);
    sims.renderAll();
if (currentDP.get('onCanvas') != true) {
    canvas.remove(currentDP);
    canvas.renderAll();
  }
}

function onOverlayClosed() {

  // removes old dragPoints
  var obj;
  //for (var i = 0; i < oldDragPointList.length; i++) {
  //  canvas.remove(oldDragPointList[i]);
  //}
  // makes objects selectable again
  canvas.forEachObject( function (obj) {
    obj.set ({
      selectable: true
    });
  });

  // adds drag points to the canvas and attaches them to shapes
  for (var i = 0; i < dragPointList.length; i++) {
      // console.log("the drag point should have been added!");
      dragPointList[i].set({
        fill: dpColor,
        onCanvas: true
      });

      canvas.add(dragPointList[i]);
      obj = dragPointList[i].get('shape');
      dragPointList[i].startDragPoint(obj);
    }
  //console.log(state[current]);

  canvas.renderAll();
  updateModifications(true);
  window.BACKEND.drawToPhysics(fabricJSON, physics);
}

function removeAllWeirdObjects(canvas) {
  canvas.forEachObject( function(o) {
    if (o.get('type') === 'dragPoint') {
        dragPointList.push(o);
        canvas.remove(o);
    }
    if (o.get('physics') === 'pendulum') {
       physicsObjectList.push(o);
       canvas.remove(o);
     }
  });}

function addBackAllWeirdObjects(canvas) {
  var pendulumList = [];
  for (var i = 0; i < physicsObjectList.length; i++) {
    if (physicsObjectList[i].get('item') == 'pivot' || physicsObjectList[i].get('item') == 'rod' || physicsObjectList[i].get('item') == 'bob' ) {
      pendulumList.push(physicsObjectList[i]);
      canvas.add(physicsObjectList[i]);
    }
    if (pendulumList.length == 3) {
      console.log(state[current]);
      updatePendulum(pendulumList);
    }
  }
  pendulumList = [];
  // adds drag points back to the canvas
  for (var i = 0; i < dragPointList.length; i++) {
    canvas.add(dragPointList[i]);
    dragPointList[i].startDragPointByName(canvas);
  }
}

//
function onUndoRedo() {
  dragPointList = [];
  physicsObjectList = [];
  removeAllWeirdObjects(canvas);
  addBackAllWeirdObjects(canvas);
  canvas.renderAll();
}

canvas.on('object:moving', function (object) {
    updatePhysics(true);
  });

canvas.on('object:scaling', function (object) {
    updatePhysics(true);
  });

canvas.on('object:removed', function (object) {
    updatePhysics(true);
  });

canvas.on('object:rotating', function (object) {
    updatePhysics(true);
  });

canvas.on('object:modified', function () {
    updateModifications(true);
    window.BACKEND.drawToPhysics(fabricJSON, physics);
  });

function updateModifications(savehistory) {
    if (savehistory === true) {
        myjson = JSON.stringify(canvas);
        state.push(myjson);
        fabricJSON = transfer();
        mods = 0;
        current = state.length - 1;
    }
}

function updatePhysics(start) {
  if (start === true) {
    fabricJSON = transfer();
    window.BACKEND.drawToPhysics(fabricJSON, physics);
  }
}

undo = function undo() {
    if (mods < state.length) {
        canvas.clear().renderAll();
        current = state.length - mods - 1;
        canvas.loadFromJSON(state[current - 1]);
        mods += 1;
        canvas.renderAll();
        updatePhysics();
        onUndoRedo();
    }
}

redo = function redo() {
    if (mods > 0) {
        canvas.clear().renderAll();
        current = state.length - mods - 1;
        canvas.loadFromJSON(state[current + 1]);
        mods -= 1;
        canvas.renderAll();
        updatePhysics();
        onUndoRedo();
    }
}
