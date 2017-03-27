/////////
/// undos, redos, and updates
/////////

var state = [], // array list of modifications on canvas in JSON
mods = 0, // numer denotes how far back the user is undoing
fabricJSON, // JSON file transferred on to the "physics" canvas
current = 0; // current state on the "canvas" canvas

function invert(actionTag) {
  let invertAct;
  switch (actionTag) {
    case Actions.CreateObject:
      invertAct = Actions.DeleteObject;
      break;
    case Actions.DeleteObject:
      invertAct = Actions.CreateObject;
      break;
    case Actions.ModifyObject:
      invertAct = Actions.ModifyObject;
      break;
    default:
      console.log('unhandled action:');
      console.log(actionTag);
  }

  return invertAct;
}

function dumpUndoState(){
  console.log('undo list:');
  console.log(undoList);
  console.log('redo list:');
  console.log(redoList);
  console.log('initial obj:');
  console.log(initialObjState);
}

// invariant -- every object puts its current serialization into a __state field
// after modifications.

// needs to be in: CREATE, MODIFY


function initUndoState(obj){
  obj.__state = getCurrentState({obj: obj, type: obj.get('type')});
}

let initialObjState = {};
function startObjectModify(obj) {
  // console.log(obj.top);
  dumpUndoState();
  redoList = [];
  initialObjState = getCurrentState({obj: obj, type: obj.get('type')});
  // console.log(obj.top);
  // console.log(obj.get('top'));
  // console.log(initialObjState.top);
  // console.log(obj.getBoundingRect());
}

function finishObjectModify(obj) {
  let finalObjState = getCurrentState({obj: obj, type: obj.get('type')});
  // initUndoState(obj);
  // console.log(initialObjState);
  undoList.push({act: Actions.ModifyObject, args: {before: initialObjState, after: finalObjState}});
  checkUndoRedo();
}

// TODO: arrow UNDOs result in incorrect triangle height/width
// (both regular, and delete UNDO)
function performModify(wrappedFromObj, wrappedToObj) {
  // console.log('toObject:');
  // console.log(wrappedToObj);

  let mover = wrappedFromObj.obj
  if (wrappedFromObj.type == "line") {
    // console.log(wrappedToObj.obj.getBoundingRect().left);
    // console.log(wrappedToObj.left);
    // console.log(wrappedToObj.obj.getBoundingRect().top);
    // console.log(wrappedToObj.top);
  }

  let restrictedKeys = {x1:0, x2:0, y1:0, y2:0}
  for (let prop in wrappedToObj) {
    // if (mover.get(prop))
    // console.log('setting:')
    // console.log(prop);
    if (!(prop in restrictedKeys))
      mover.set(prop, wrappedToObj[prop]);
    // console.log('left:');
    // console.log(mover.left);
  }



  // mover.set('left', wrappedToObj.left);
  // mover.set('top', wrappedToObj.top);
  // console.log('reference:');
  // console.log(wrappedToObj.left);
  // console.log(wrappedToObj.top);
  //
  // console.log('mover:');
  // console.log(mover.top);
  mover.setCoords();
  // console.log(mover.top);

  mover.trigger('modified'); // moves drag points
  mover.trigger('moving');
  canvas.trigger('object:moving', {target: mover});
  canvas.trigger('object:modified', {target: mover}); // sends to backend
  canvas.renderAll();
}

function performUndo(fromList, toList) {
  // console.log(fromList);
  let toReverse = fromList.pop();
  let inverseArgs;

  let {act, args} = toReverse;
  switch (act) {
    case Actions.CreateObject:
        // perform a delete
        inverseArgs = args;
        deleteObject(args.obj);
      break;
    case Actions.DeleteObject:
        // perform a create
        let newArgs = Object.assign({}, args); // copy the args
        newArgs.obj = internalAdd(args.type, newArgs);

        // switch (args.type) {
        //   case 'circle':
        //     break;
        //   default:
        //     console.log('unhandled type:');
        //     console.log(args.type);
        // }

        inverseArgs = newArgs;
        // deleteObject(args.obj);
      break;
    case Actions.ModifyObject:
      // perform a modify
      inverseArgs = {before: args.after, after: args.before};

      // flip to args.before
      performModify(args.after, args.before);
      break;
    default:
      console.log('unhandled: ');
      console.log(toReverse)
  }

  toList.push({act: invert(toReverse.act), args: inverseArgs});

  checkUndoRedo();
  dumpUndoState();
}

function redoOnClick() {
  performUndo(redoList, undoList);
}

function undoOnClick() {
  performUndo(undoList, redoList);
}

// removes all drag points and pendulums (to include more physics objects as well)
function removeAllWeirdObjects(canvas) {
  canvas.forEachObject( function(o) {
    if (o.get('type') === 'dragPoint') {
        canvasDragPoints.add(o);
        canvas.remove(o);
    }
    if (o.get('physics') === 'pendulum') {
       physicsObjectList.push(o);
       canvas.remove(o);
     }
  });}

// adds back all drag points and pendulums (to include more physics objects as well)
function addBackAllWeirdObjects(canvas) {
  var pendulumList = [];
  for (var i = 0; i < physicsObjectList.length; i++) {
    if (physicsObjectList[i].get('item') == 'pivot' || physicsObjectList[i].get('item') == 'rod' || physicsObjectList[i].get('item') == 'bob' ) {
      pendulumList.push(physicsObjectList[i]);
      canvas.add(physicsObjectList[i]);
    }
    if (pendulumList.length == 3) {
      console.log(state[current]);
      // updatePendulum(pendulumList);
      pendulumList = [];
    }
  }
  // adds drag points back to the canvas
  for (let drag of canvasDragPoints) {
    canvas.add(drag);
    drag.startDragPointByName(canvas);
  }
}

// when undo and redo are implemented, drag points and pendulums are redrawn (to include more physics objects as well)
function onUndoRedo() {
  canvasDragPoints.clear();
  physicsObjectList = [];
  // removeAllWeirdObjects(canvas);
  // addBackAllWeirdObjects(canvas);
  updatePhysics(true);
  canvas.renderAll();
}

// simultaneously updates the right-side physics canvas as objects are manipulated
canvas.on('object:moving', function (object) {
    updatePhysics(true);
  });

canvas.on('object:scaling', function (object) {
    updatePhysics(true);
  });

// canvas.on('object:removed', function (object) {
//     updatePhysics(true);
//   });

// canvas.on('object:rotating', function (object) {
//     updatePhysics(true);
//   });

canvas.on('object:modified', function () {
    updateModifications(true);
    window.BACKEND.drawToPhysics(fabricJSON, physics);
  });

// updates the modifications
function updateModifications(savehistory) {
    if (savehistory === true) {
        // myjson = JSON.stringify(canvas);
        // state.push(myjson);
        fabricJSON = transfer();
        // mods = 0;
        // current = state.length - 1;
    }
}

// updates the right-side physics canvas
function updatePhysics(start) {
  // console.trace();
  if (start === true) {
    fabricJSON = transfer();
    window.BACKEND.drawToPhysics(fabricJSON, physics);
  }
}

// undos
// undo = function undo() {
//     if (mods < state.length) {
//         canvas.clear().renderAll();
//         current = state.length - mods - 1;
//
//         // candidateDragPoints.clear();
//         // SnapGlobals.POINTS.clear();
//
//         canvas.loadFromJSON(state[current - 1]);
//
//         // rebuild the snappoint/dragpoint datastructures
//         // canvas.forEachObject((obj) => {
//         //   if (obj instanceof fabric.DragPoint) {
//         //     let parent = obj.get('shape');
//         //     let newCands = candidateDragPoints.get(parent);
//         //     let newSnaps = SnapGlobals.POINTS.get(parent);
//         //
//         //     if (!newCands) {
//         //       newCands = new Set();
//         //       candidateDragPoints.set(parent, newCands);
//         //     }
//         //
//         //     if (!newSnaps) {
//         //       newSnaps = new Set();
//         //       SnapGlobals.POINTS.set(parent, newSnaps);
//         //     }
//         //
//         //     if (obj.get('type') == 'snap') {
//         //       newSnaps.add(obj)
//         //     } else {
//         //       newCands.add(obj);
//         //     }
//         //   }
//         // });
//
//         mods += 1;
//         canvas.renderAll();
//         updatePhysics();
//         onUndoRedo();
//     }
// }

// redos
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
