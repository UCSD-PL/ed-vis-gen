/////////
/// undos, redos, and updates
/////////

var state = [], // array list of modifications on canvas in JSON
mods = 0, // numer denotes how far back the user is undoing
fabricJSON, // JSON file transferred on to the "physics" canvas
current = 0; // current state on the "canvas" canvas

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

canvas.on('object:removed', function (object) {
    updatePhysics(true);
  });

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
        myjson = JSON.stringify(canvas);
        state.push(myjson);
        fabricJSON = transfer();
        mods = 0;
        current = state.length - 1;
    }
}

// updates the right-side physics canvas
function updatePhysics(start) {
  if (start === true) {
    fabricJSON = transfer();
    window.BACKEND.drawToPhysics(fabricJSON, physics);
  }
}

// undos
undo = function undo() {
    if (mods < state.length) {
        canvas.clear().renderAll();
        current = state.length - mods - 1;

        // candidateDragPoints.clear();
        // SnapGlobals.POINTS.clear();

        canvas.loadFromJSON(state[current - 1]);

        // rebuild the snappoint/dragpoint datastructures
        // canvas.forEachObject((obj) => {
        //   if (obj instanceof fabric.DragPoint) {
        //     let parent = obj.get('shape');
        //     let newCands = candidateDragPoints.get(parent);
        //     let newSnaps = SnapGlobals.POINTS.get(parent);
        //
        //     if (!newCands) {
        //       newCands = new Set();
        //       candidateDragPoints.set(parent, newCands);
        //     }
        //
        //     if (!newSnaps) {
        //       newSnaps = new Set();
        //       SnapGlobals.POINTS.set(parent, newSnaps);
        //     }
        //
        //     if (obj.get('type') == 'snap') {
        //       newSnaps.add(obj)
        //     } else {
        //       newCands.add(obj);
        //     }
        //   }
        // });

        mods += 1;
        canvas.renderAll();
        updatePhysics();
        onUndoRedo();
    }
}

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
