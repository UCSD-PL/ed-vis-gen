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
arrayLine = [[0,0], [0, 0.5], [0,1]],
arrayArr = [[0.5,0],[0.5,0.5],[0.5,1]],
arrayPen = [[0.5,0],[0.5,0.4],[0.5,0.8]],
arraySpring = [[0.5,0],[0.5,0.5],[0.5,1]],
arrayBob = [[0,0.5],[0.5,0],[0.5,0.5],[1,0.5],[0.5,1]],
arrayRod = [[0,0.5]],
arrayPiv = [[0.5,0.5]],

canvasDragPoints = new Set(), // set of drag points on canvas
candidateDragPoints = new Map(), // map from objects to sets of dragpoints
physicsObjectList = [], // list of objects with physics attributes on canvas

lastSim = 0, // last interaction for the drag point selection panel
currentSim = 0, // current interaction for the drag point selection panel
selectedSim = 0, // chosen interaction for the drag point selection panel
formerChoice = 0, /* the last choice selected by the drag point.
closing the overlay without accepting will cause the drag point to rever to it's "former choice" */
numOfChoices = 4, // # of "choices" for the drag point edit panel
currentDragPoint, // current drag point on the "sims" panel

dpColor = "black", // color of unselected drag points
dpSelectedColor = "orange"; // color of selected drag points

// if true, events are fired for individual objects on a canvas
canvas.fireEventForObjectInsideGroup = true;
interact.fireEventForObjectInsideGroup = true;

canvas.selection = false; // if true, canvas is in selection mode
physics.selection = false;
physics.isDrawingMode = false; // if false, canvas is not in drawing mode

// canvasWidth and canvasHeight are resized according to the dimensions of the browser window
var canvasWidth = document.getElementById('canvas').width;
var canvasHeight = document.getElementById('canvas').height;

//resize the canvas
window.addEventListener('resize', resizeCanvas, false);
window.addEventListener('resize', resizePhysicsPanel, false);

// resizes the "canvas" canvas according to the current dimensions of the browser window
function resizeCanvas () {
 var theWidth = $('#draw').width();
 var theHeight = $('#draw').height();
 canvas.setWidth(theWidth);
 canvas.setHeight(theHeight);
 canvas.renderAll();
}

// resizes the "physics" canvas according to the current dimensions of the browser window
function resizePhysicsPanel () {
 var theWidth = $('#simulate').width();
 var theHeight = $('#simulate').height();
 physics.setWidth(theWidth);
 physics.setHeight(theHeight);
 physics.renderAll();
}

resizeCanvas();
resizePhysicsPanel();

// states of global application
const AppStates = {
  EDITING: 0, // basic editing mode
  SNAPPING: 1, // snapping mode
  SELECTDP: 2, // selecting dragpoint location mode
  SIMDP: 3 // simulation dragpoint semantics mode
}

let AppGlobals = {
  STATE: AppStates.EDITING,
  PREVSTATE: AppStates.EDITING,
  PHYSICS_RUNNING: false
}

const BENCHDATA = {
  views: 0,
  maxModalities: 0
}

// undo/redo globals
let undoList = []; // list of actions for undoing, of the form {action: Actions.field, args: json}
let redoList = []; // same, but for redos
const Actions = {
  CreateObject: 0,
  DeleteObject: 1,
  ModifyObject: 2
};

// snapping states enum
const SnapStates = {
  OFF: 0,
  UNSELECTED: 1,
  SELECTED: 2
}
// global state for snapping mode
let SnapGlobals = {
  STATE: SnapStates.OFF, // one of SnapStates
  MOVER: null, // original snappoint, whose parent object will translate
  POINTS: new Map() // map from object to object's snappoints
}

// adds drag points
function buildInteractDP(obj, dx, dy) {
  let drag = new fabric.DragPoint({
    name: allocSName(),
    shape: obj,
    shapeName: obj.get('name'),
    DX: dx,
    DY: dy,
    fill: dpColor,
    radius: 7
  });

  drag.startDragPoint(obj, interact);

  drag.on('selected', () => {
    switch (AppGlobals.STATE) {
      case AppStates.SELECTDP:
        if (drag.get('fill') == dpColor && drag.get('onCanvas') != true) {
          select(drag);
        } else if (drag.get('fill') == dpSelectedColor && drag.get('onCanvas') === true) {
          // if it's on the canvas, but has been unselected on the dp selection panel, remove it from the canvas
          undoSelect(drag);
          canvas.remove(drag);
        } else if (drag.get('fill') == dpColor && drag.get('onCanvas') === true) {
          // if it's already on the canvas and reselected, do nothing
        } else {
          // undos selection of a drag point if you click it again so it won't show up on canvas
          undoSelect(drag);
        }

        break;
      case AppStates.EDITING:
      case AppStates.SNAPPING:
        break;
      case AppStates.SIMDP:
      default:
        console.log('unhandled state in dragpoint select:');
        console.log(AppGlobals);
        break;

    }
  });

  // on right click, opens up the edit simulation panel
  drag.on('eddie:mousedown', options => {
    if (options.e.which === 3) {
      switch (AppGlobals.STATE) {

        case AppStates.EDITING:
          if (drag.get('onCanvas') != true) {
            select(drag);
          }
          open1();
          AppGlobals.STATE = AppStates.SIMDP;
          onLoadSims(drag);
          break;

        case AppStates.SELECTDP:
        case AppStates.SNAPPING:
          // ignore if we're in selection mode
          break;
        case AppStates.SIMDP:
        default:
          console.log('unrecognized appstate in dragpoint click:');
          console.log(AppGlobals);
          break;
      }
    }
  });


  return drag;
}



// adds all the drag points on the "interact" canvas
function addAllDP(array, obj) {
  if (canvasDragPoints.size == 0 ) {
    for (let coord of array) { // array has type [number, number][]
      let [dx, dy] = coord; // coord is a tuple [number, number]
      let drag = buildInteractDP(obj, dx, dy);
      interact.add(drag);
    }
  } else {
    for (let coord of array) {
      let [dx, dy] = coord;
      for (let drag of canvasDragPoints) {
        if (!checkDragPointLocation(drag, obj, dx, dy)) {
          interact.add(buildInteractDP(obj, dx, dy));
        } else {
          interact.add(drag);
          drag.set({
            fill: dpSelectedColor
          });
        }
      }
    }
  }
}

// given an object, returns a new array of dragpoints attached to the object.
// addToCanvas => whether or not the dragpoint should be added to the global canvas.
function buildDragpointsByObj(receiver, addToCanvas) {
  let dragLocs; // [number, number][]
  switch (receiver.get('physics')) {
    case 'pendulum':
      switch (receiver.get('item')) {
        case 'bob':
          dragLocs = arrayBob;
          break;
        case 'pivot':
          dragLocs = arrayPiv;
          break;
        case 'rod':
          dragLocs = arrayRod;
          break;
        default:
          console.log('unhandled object in dragpoint builder:');
          console.log(receiver);
          return [];
      }

      break;
    case 'spring':
      dragLocs = arraySpring;
      break;
    case 'mass':
    case 'none':
      switch (receiver.get('type')) {
        case 'arrow':
          dragLocs = arrayArr;
          // console.log('adding to arrow')
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
        case 'snap':
          // do nothing
          return;
        default:
          console.log('unhandled object in dragpoint builder:');
          console.log(receiver);
          return [];
      }
      break;
    default:
      console.log('unhandled physics type in dragpoint builder');
      console.log(receiver);
      console.log(receiver.get('physics'))
      return [];
  }
  return dragLocs.map(loc => {
    let [dx, dy] = loc
    let drag = new fabric.DragPoint({
      name: allocSName(),
      shape: receiver,
      shapeName: receiver.get('name'),
      DX: dx,
      DY: dy,
      fill: 'black',
      radius: 5,
      type: 'dragPoint'
    });

    drag.startDragPoint(receiver, canvas);
    if (addToCanvas)
      canvas.add(drag);

    return drag;
  });
}

// build snappoints for a particular object and add to 'canvas' if specified.
function addSnapPoints(obj, addToCanvas) {
  let newDrags = buildDragpointsByObj(obj, addToCanvas);
  let newSnaps = new Set();
  // console.log(newDrags);
  // addSnapDrags(dragLocs, obj, addToCanvas);
  newDrags.forEach(drag => {
    drag.set('type', 'snap');
    // drag.set('fill', 'red');
    newSnaps.add(drag);
    drag.on('eddie:selected', () => {
    // console.log('selected');
    // once selected, if the state is:
      switch (SnapGlobals.STATE) {
        // unselected, track the selected object + receiver and
        // transition to selected
        case SnapStates.UNSELECTED:
          SnapGlobals.MOVER = drag;
          drag.set('fill', 'yellow');
          canvas.renderAll();
          SnapGlobals.STATE = SnapStates.SELECTED;
          break;
        // selected, translate the mover's parent object and transition to unselected
        case SnapStates.SELECTED:
          SnapGlobals.MOVER.set('fill', 'black');
          canvas.renderAll();
          translateParent(SnapGlobals.MOVER, drag);
          // toggleSnaps();
          SnapGlobals.STATE = SnapStates.UNSELECTED;
          break;
        case SnapStates.OFF:
        default:
          console.log('unhandled state in snappoint callback:');
          console.log(SnapGlobals);
          console.log(drag);
      }
    });
  });

  SnapGlobals.POINTS.set(obj, newSnaps);
}

// analogously, build dragpoints for an object and add to 'canvas' if specified.
function addDragPoints(obj, addToCanvas) {

  if (obj instanceof fabric.Spring || obj instanceof fabric.Line) {
    // TODO: we don't add dragpoints for springs and lines because the import is broken.
    // fix the import and remove this part.
    return;
  }

  let newDrags = buildDragpointsByObj(obj, addToCanvas);
  let newDragSet = new Set();


   newDrags.forEach(drag => {

    drag.set('eddie:active', false);
    drag.set('fill', dpColor);
    // drag.set('type', 'dragPoint');

    drag.on('eddie:selected', () => {
      switch (AppGlobals.STATE) {
        case AppStates.SELECTDP:
          if (drag.get('eddie:active')) {
            drag.set('eddie:active', false);
            drag.set('fill', dpColor);
            // select(drag);

          } else {
            drag.set('eddie:active', true);
            drag.set('fill', dpSelectedColor);

            // select(drag);
          }

          canvas.renderAll();
          updateModifications(true);
          window.BACKEND.drawToPhysics(fabricJSON, physics);
          break;
        case AppStates.EDITING:
        case AppStates.SNAPPING:
          break;
        case AppStates.SIMDP:
        default:
          console.log('unhandled state in dragpoint select:');
          console.log(AppGlobals);
          break;

      }
    });

    // on right click, opens up the edit simulation panel
    drag.on('eddie:mousedown', options => {
      if (drag.get('eddie:active') && options.e.which === 3) {
        switch (AppGlobals.STATE) {

          case AppStates.EDITING:
          case AppStates.SELECTDP:

            open1();
            AppGlobals.PREVSTATE = AppGlobals.STATE;
            AppGlobals.STATE = AppStates.SIMDP;
            // @BENCH
            BENCHDATA.views++;
            onLoadSims(drag);
            break;

          case AppStates.SNAPPING:
            break;

          case AppStates.SIMDP:
          default:
            console.log('unrecognized appstate in dragpoint click:');
            console.log(AppGlobals);
            break;
        }
      }
    });

    newDragSet.add(drag);
  });

  candidateDragPoints.set(obj, newDragSet);
}

function translateShape(mover, dx, dy) {
  mover.setLeft(mover.get('left') + dx);
  mover.setTop(mover.get('top') + dy);
  mover.setCoords();

  mover.trigger('modified'); // moves drag points
  mover.trigger('moving');
  canvas.trigger('object:moving', {target: mover});
  canvas.trigger('object:modified', {target: mover}); // sends to backend
  // updateModifications(true);
  canvas.renderAll();

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
  startObjectModify(parent);
  translateShape(parent, dx, dy);
  finishObjectModify(parent);
}

function toggleDrags() {
  // console.log(candidateDragPoints);
  let button = document.getElementById('toggle-drags');

  switch (AppGlobals.STATE) {
    // if we're in snapping mode, turn snapping mode off, then show drags
    case AppStates.SNAPPING:
      // turn snapping mode off and fall-through
      canvas.forEachObject(obj => {
        if (obj.get('type') == 'snap') {
          canvas.remove(obj);
        } else {
          // obj.set('selectable', true); // TODO: pendulum
          // obj.set('hasControls', true);
        }
      });

      SnapGlobals.STATE = SnapStates.OFF;

      if (SnapGlobals.MOVER)
        SnapGlobals.MOVER.set('fill', 'black');

      SnapGlobals.MOVER = null;
      document.getElementById('toggle-snaps').innerHTML = 'Show Alignment Points';
      // FALLTHROUGH!!!!!
    case AppStates.EDITING:
      // show each hidden dragpoint
      for (let [_, dps] of candidateDragPoints) {
        for (let dp of dps) {
          if (!dp.get('eddie:active')) {
            canvas.add(dp)
          }
        }
      }
      AppGlobals.STATE = AppStates.SELECTDP;
      button.innerHTML = 'Hide Drag Points';
      break;
    case AppStates.SELECTDP:
      // hide unselected dragpoints
      for (let [_, dps] of candidateDragPoints) {
        for (let dp of dps) {
          if (!dp.get('eddie:active')) {
            canvas.remove(dp)
          }
        }
      }
      AppGlobals.STATE = AppStates.EDITING;
      button.innerHTML = 'Show Drag Points';
      break;


    case AppStates.SIMDP:
      console.log('simming???');
    default:
      console.log('unhandled app state in toggle drags:');
      console.log(AppGlobals);
      break;

  }
}

function toggleSnaps() {
  let button = document.getElementById('toggle-snaps');

  switch (AppGlobals.STATE) {
    // if we're selecting DPs, stop selecting dps and transition to snapping
    case AppStates.SELECTDP:
      for (let [_, dps] of candidateDragPoints) {
        for (let dp of dps) {
          canvas.remove(dp)
        }
      }
      document.getElementById('toggle-drags').innerHTML = 'Show Drag Points';
      // FALLTHROUGH
    case AppStates.EDITING:
    case AppStates.SNAPPING: // TODO...this is wonky...
      switch (SnapGlobals.STATE) {
        case SnapStates.OFF:
          canvas.forEachObject(obj => {
            if (obj.get('type') != 'snap') {
              // obj.set('selectable', false);
              // obj.set('hasControls', false);
            }
          });

          for (let [_, snaps] of SnapGlobals.POINTS) {
            for (let snap of snaps) {
              canvas.add(snap);
            }
          }

          SnapGlobals.STATE = SnapStates.UNSELECTED;
          button.innerHTML = 'Hide Alignment Points';

          AppGlobals.STATE = AppStates.SNAPPING;
          break;
        case SnapStates.UNSELECTED:
        case SnapStates.SELECTED:
        // SnapGlobals.POINTS.forEach(p => {
        //   console.log('removing: ' + p.get('name'));
        //   canvas.remove(p);
        // });
        canvas.forEachObject(obj => {
          if (obj.get('type') == 'snap') {
            canvas.remove(obj);
          } else {
            // obj.set('selectable', true); // TODO: pendulum
            // obj.set('hasControls', true);
          }
        });

        SnapGlobals.STATE = SnapStates.OFF;

        AppGlobals.STATE = AppStates.EDITING;

        SnapGlobals.MOVER = null;
        button.innerHTML = 'Show Alignment Points';
        // canvas.renderAll();
        break;
        default:
          console.log('unhandled state in toggle snaps:');
          console.log(SnapGlobals);
      }
      break;
    case AppStates.SIMDP:
    default:
      console.log('unhandled global state in toggle snaps:');
      console.log(AppGlobals);
  }
}

function togglePhysics() {
  const button = document.getElementById('toggle-physics');
  if (AppGlobals.PHYSICS_RUNNING) {
    BACKEND.stopPhysics();
    button.innerHTML = 'Start';
  } else {
    BACKEND.startPhysics();
    button.innerHTML = 'Stop';
  }

  AppGlobals.PHYSICS_RUNNING = !AppGlobals.PHYSICS_RUNNING;
}


canvas.on('object:added', opts => {
  let obj = opts.target;
  // console.log(newObj);
  switch (obj.type) {
    case 'dragPoint':
    case 'snap':
      break; // do nothing
    default:
      // handle snappoints
      switch (SnapGlobals.STATE) {
        case SnapStates.OFF:
          addSnapPoints(obj, false);
          break; // do nothing

        // add in snappoints for the new obj if we're in snapping mode
        case SnapStates.UNSELECTED:
        case SnapStates.SELECTED: // clear the selection....?
          // console.log('adding');
          addSnapPoints(obj, true);
          break;
        default:
          console.log('unhandled state in new object snap handler:');
          console.log(SnapGlobals);
      }

      // handle dragpoints
      switch (AppGlobals.STATE) {
        case AppStates.SNAPPING:
        case AppStates.EDITING:
          addDragPoints(obj, false);
          break;
        case AppStates.SELECTDP:
          addDragPoints(obj, true);
          break;
        default:
          console.log('unhandled state in new object drag handler:');
          console.log(AppGlobals);
      }
      break;
  }
});



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
  canvasDragPoints.clear();

  forEachDP(drag => canvasDragPoints.add(drag));


  canvas.forEachObject( function (obj) {
    if (obj.get('type') != 'dragPoint') {
      interact.add(obj);
      obj.set({
        selectable: false
      });
      checkForDragPoints(obj, obj.get('type'));
    }
  });

  AppGlobals.STATE = AppStates.SELECTDP;
  interact.renderAll();
}

//selects drag point and adds it to the drag point list
function select(dragPoint) {
  dragPoint.set({
    fill: dpSelectedColor
  });
  canvasDragPoints.add(dragPoint);
}

//undos selection of a drag point when you click on the "x" in the second overlay
function undoSelect(dragPoint) {
  // console.log('undoing selection, from state:');
  // console.log(AppGlobals);
  switch (AppGlobals.STATE) {
    case AppStates.SIMDP:
      AppGlobals.STATE = AppStates.EDITING;
      break;
    case AppStates.SELECTDP:
    case AppStates.EDITING:
    default:
      console.log('unrecognized app state in undo sim:');
      console.log(AppGlobals);
      break;
  }

  dragPoint.set({
    // fill: dpColor,
    choice: formerChoice
  });

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
  // @BENCH
  BENCHDATA.views++;
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
  // @BENCH
  BENCHDATA.views++;
  window.BACKEND.drawToEdit(currentDragPoint.get('name'), currentSim, sims);
  sims.renderAll();
}

// accepts currentSim as selectedSim for the choice attribute on the drag point
function onACCEPT() {
  // switch (AppGlobals.STATE) {
  //   case AppStates.SIMDP:
  //     AppGlobals.STATE = AppStates.EDITING; // oops
  //     break;
  //   case AppStates.SELECTDP:
  //   case AppStates.EDITING:
  //   default:
  //     console.log('unrecognized app state in accept simulation:');
  //     console.log(AppGlobals);
  //     break;
  // }

  AppGlobals.STATE = AppGlobals.PREVSTATE;
  // sets 'choice', the selected sim, to the corresponding dragpoint
  selectedSim = currentSim;
  currentDragPoint.set({
    choice: selectedSim
  });

  close1(); // closes current screen; returns to drag point selection panel
  updateModifications(true);
  window.BACKEND.drawToPhysics(fabricJSON, physics);
  window.BACKEND.finishEditChoice();
}

// loads a sim on the drag point
function onLoadSims(dragPoint) {
  // console.log('loading sims for dp:');
  // console.log(dragPoint);
  // sets up JSON files the simsArray list and loads the current JSON
  AppGlobals.STATE = AppStates.SIMDP;

  sims.clear();
  currentDragPoint = dragPoint;  //.clone();
  currentSim = 0;
  formerChoice = currentDragPoint.get('choice');

  numOfChoices = BACKEND.getNumChoices(currentDragPoint.get("name")) - 1;
  // @BENCH
  if (numOfChoices+1 > BENCHDATA.maxModalities)
    BENCHDATA.maxModalities = numOfChoices+1;

  generateSims(currentDragPoint);
}

// generates the animations for the interactions
function generateSims(currentDP) {
  // console.log('generating');
  // if (currentDP.get('onCanvas') != true) {
  //   canvas.add(currentDP);
  //   obj = currentDP.get('shape');
  //   currentDP.startDragPoint(obj);
  //   canvas.renderAll();
  //   myjson = JSON.stringify(canvas);
  //   fabricJSON = transfer();
  //   window.BACKEND.drawToPhysics(fabricJSON, physics);
  // }

  window.BACKEND.drawToEdit(currentDP.get('name'), currentDP.get('choice'), sims);
  sims.renderAll();

  // if (currentDP.get('onCanvas') != true) {
  //   canvas.remove(currentDP);
  //   canvas.renderAll();
  // }
}

// closes the interact canvas and adds any drag points on the drag point list
function onOverlayClosed() {

  switch (AppGlobals.STATE) {
    case AppStates.SELECTDP:
      AppGlobals.STATE = AppStates.EDITING;
      break;
    case AppStates.EDITING:
    case AppStates.SIMDP:
    default:
      console.log('unrecognized app state in select overlay:');
      console.log(AppGlobals);
      break;
  }

  // makes objects selectable again
  canvas.forEachObject( obj => {
    obj.set({
      selectable: true
    });
  });

  // adds drag points to the canvas and attaches them to shapes
  for (let drag of canvasDragPoints) {
    // if it hasn't been added to the canvas yet
    if (!drag.get('onCanvas')) {
      canvas.add(drag);
    }
    drag.set({
      // fill: dpColor,
      onCanvas: true
    });

    drag.startDragPoint(drag.get('shape'));
  }



  canvas.renderAll();
  updateModifications(true);
  window.BACKEND.drawToPhysics(fabricJSON, physics);
}

// mouse actions modify objects when the underlying active object is not a snap
function shouldSaveActive() {
  // console.log(canvas.getActiveObject());
  return canvas.getActiveObject() && canvas.getActiveObject().type != 'snap'
}

canvas.on('mouse:up', opts => {
  if (shouldSaveActive()) finishObjectModify(canvas.getActiveObject())
});

document.addEventListener('keydown', opts => {

  if (opts.key === 'Backspace') deleteObjects();
})

// manual hit detection...fun
canvas.on('mouse:down', opts => {
  // console.log(opts);
  // console.log(canvas.getPointer(opts.e));

  // log object modification for undo/redo
  // let active = canvas.getActiveObject();
  // if we've selected a DP, it's not a modification
  if (shouldSaveActive()) {
    // console.log(canvas.getActiveObject());
    startObjectModify(canvas.getActiveObject());
  }

  let clickLocation = canvas.getPointer(opts.e);
  let clickPoint = new fabric.Point(clickLocation.x, clickLocation.y);
  // console.log(clickPoint);
  let notFired = true;
  // DP events might modify the underlying positions, so we run two passes:
  // gather up the hit dps, then fire mousedown and selected on the hit points.
  let hitDPs = new Set(); // Set<DragPoint>

  forEachDP(drag => {
    // console.log(drag.getLeft());
    // console.log(drag.getTop());
    let dragCent = new fabric.Point(drag.getLeft(), drag.getTop());
    // console.log(dragCent);
    let contained = clickPoint.distanceFrom(dragCent) <= drag.get('radius');
    // console.log(contained);
    if (contained) {
      hitDPs.add(drag);
    }
  });

  // console.log('hits:');
  // console.log(hitDPs);

  for (let drag of hitDPs) {
    if (opts.e.which === 3) {
      drag.fire('eddie:mousedown', opts);
    } else {
      drag.fire('eddie:selected', opts);
    }
  }
});

function physicsReset() {
  BACKEND.resetPhysics();
  if (AppGlobals.PHYSICS_RUNNING) togglePhysics();
  BACKEND.drawToPhysics(fabricJSON, physics);
}


function startSession() {
  BACKEND.startSession();
}

function endSession() {

  // const done = confirm("Has John or Sorin recorded your result?");
  // if (done) {
    BACKEND.endSession();
  // } else {
    // do nothing
  // }
}
