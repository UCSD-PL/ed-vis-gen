/////////
/// fabrication
/// (adding and modifying the drag points)
/////////

var canvas = new fabric.CanvasEx('canvas'), // left-side panel
physics = new fabric.Canvas('physics'), // right-side panel
interact = new fabric.CanvasEx('interact'), // drag point editing panel
sims = new fabric.Canvas('sims'), // interaction editing panel

/* These arrays denote the location of the drag points in relation to
the top-left corner of the associated object multiplied by its dimension.
--Add arrays here for new shapes, as well as in the checkForDragPoints function--*/
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

whereDP = 0; // checks which drag points to delete in the dragPointList

// if true, events are fired for individual objects on a canvas
canvas.fireEventForObjectInsideGroup = true;
interact.fireEventForObjectInsideGroup = true;

canvas.selection = true; // if true, canvas is in selection mode
physics.isDrawingMode = false; // if false, canvas is not in drawing mode
physics.selection = false;

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


// snapping states enum
let SnapStates = {
  OFF: 0,
  UNSELECTED: 1,
  SELECTED: 2
}
// global state for snapping mode
let SnapGlobals = {
  STATE: SnapStates.OFF, // one of SnapStates
  MOVER: null, // original snappoint, whose parent object will translate
  POINTS: [] // list of all snappoints
}

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
      // if a drag point hasn't been clicked before, upon being clicked, a drag point is selected and added to dragPointList
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

// add snappoints to 'canvas'
function addSnapPoints() {
  canvas.forEachObject((obj) => {
    let dragLocs; // [number, number][]
    switch (obj.get('physics')) {
      case 'pendulum':
        switch (obj.get('item')) {
          case 'bob':
            dragLocs = arrayBob;
            break;
          case 'pivot':
            dragLocs = arrayPiv;
            break;
          default:
            console.log('unhandled object in snappoints:');
            console.log(obj);
            return;
        }

        break;
      case 'spring':
        dragLocs = arraySpring;
        break;
      case 'none':
        switch (obj.get('type')) {
          case 'arrow':
            dragLocs = arrayArr;
            break;
          case 'rect':
          case 'image':
            dragLocs = arrayRect;
            break;
          case 'circle':
            dragLocs = arrayCirc;
            break;
          case 'line':
            dragLocs = arrayLine;
            break;
          default:
            console.log('unhandled object in snappoints:');
            console.log(obj);
            return;
        }
        break;
      default:
        console.log('unhandled physics type in snappoints');
        console.log(obj);
        console.log(obj.get('physics'))
        return;
    }
    addSnapDrags(dragLocs, obj);
  });

}

// translate parent obj of mover to location specified by movee s.t. mover has
// has the same coordinates as movee. mover and movee are instances of DragPoint.
function translateParent(mover, movee) {
  // all dragpoints have the same radius, so it suffices to calculate dx, dy
  // with respect to top and left
  // assumes mover and movee are both oriented wrt to the canvas
  let [dx, dy] =
    [movee.get('left') - mover.get('left'), movee.get('top') - mover.get('top')];
  // console.log([dx, dy]);
  let parent = mover.get('shape');

  parent.setLeft(parent.get('left') + dx);
  parent.setTop(parent.get('top') + dy);
  parent.setCoords();

  canvas.fire('object:modified', {target: parent});
  updateModifications(true);
  canvas.renderAll();
}

// foreach part of receiver specified by locations, add a "dragpoint" to the
// main canvas and register a snapping callback.
function addSnapDrags(locations, receiver) {
  // initialize state
  SnapGlobals.STATE = SnapStates.UNSELECTED;
  for (let [dx, dy] of locations) {
    let drag = new fabric.DragPoint({
      name: allocSName(),
      shape: receiver,
      shapeName: receiver.get('name'),
      DX: dx,
      DY: dy,
      fill: dpColor,
      radius: 7,
      type: 'snap'
    });
    drag.startDragPoint(receiver, canvas);
    canvas.add(drag);

    // register callback(s)
    drag.on('selected', () => {
      let me = drag; // ugh
      console.log(me);
      // once selected, if the state is:
      switch (SnapGlobals.STATE) {
        // unselected, track the selected object + receiver and
        // transition to selected
        case SnapStates.UNSELECTED:
          SnapGlobals.MOVER = drag;
          SnapGlobals.STATE = SnapStates.SELECTED;
          break;
        // selected, translate the mover's parent object and transition to unselected
        case SnapStates.SELECTED:
          translateParent(SnapGlobals.MOVER, me);
          SnapGlobals.STATE = SnapStates.UNSELECTED;
          break;
        case SnapGlobals.OFF:
        default:
          console.log('unhandled state in snappoint callback:');
          console.log(SnapGlobals);
          console.log(me);
      }
    });
  }
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
    else if (type === 'rect' || type === 'image') {
      // console.log('adding dp to img')
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

  whereDP = dragPointList.findIndex(checkDP); // finds unselected drag point from dragPointList
  dragPointList.splice(whereDP, 1); // removes unselected drag point from dragPointList

  window.BACKEND.finishEditChoice();
}

// displays next simulation on the simulation selection panel
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

// displays previous simulation on the simulation selection panel
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

// accepts currentSim as selectedSim for the choice attribute on the drag point
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

// loads a sim on the drag point
function onLoadSims(dragPoint) {
  // sets up JSON files the simsArray list and loads the current JSON
  sims.clear();
  currentDragPoint = dragPoint;  //.clone();
  currentSim = 0;
  formerChoice = currentDragPoint.get('choice');
  numOfChoices = BACKEND.getNumChoices(currentDragPoint.get("name") - 1);
  generateSims(currentDragPoint);
}

// generates the animations for the interactions
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

// closes the interact canvas and adds any drag points on the drag point list
function onOverlayClosed() {

  var obj;
  // makes objects selectable again
  canvas.forEachObject( function (obj) {
    obj.set ({
      selectable: true
    });
  });

  // adds drag points to the canvas and attaches them to shapes
  for (var i = 0; i < dragPointList.length; i++) {
      dragPointList[i].set({
        fill: dpColor,
        onCanvas: true
      });

      canvas.add(dragPointList[i]);
      obj = dragPointList[i].get('shape');
      dragPointList[i].startDragPoint(obj);
    }

  canvas.renderAll();
  updateModifications(true);
  window.BACKEND.drawToPhysics(fabricJSON, physics);
}
