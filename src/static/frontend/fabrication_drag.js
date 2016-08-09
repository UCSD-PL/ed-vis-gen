var canvas = new fabric.CanvasEx('canvas'), // left-side panel
physics = new fabric.Canvas('physics'), // right-side panel
interact = new fabric.CanvasEx('interact'), // overlay-side panel
sims = new fabric.Canvas('sims'),
counter = 0,
snap = 8, // pixels to snap
state = [],
mods = 0,
dragPointedObjects = [],
whereDP = 0,
arrayRect = [[0,0],[0,0.5],[0.5,0],[0.5,0.5],[0,1],[1,0],[0.5,1],[1,0.5],[1,1]],
arrayCirc = [[0,0],[0.15,0.15],[0,0.5],[0.5,0],[0.5,0.5],[0.15,0.85],[0.85,0.15],[0.85,0.85],[1,0.5]],
arrayLine = [[0,0],[0,0.5],[0,1]],
arrayArr = [[0.5,0],[0.5,0.5],[0.5,1]],
//arrayPen = [[0.5,0],[0.5,0,4],[0.5,0.8]],
//arraySpring = [[0,0],[0,0.5],[0,1]],
selectedX = [], // array with y-coords of drag points on canvas
selectedY = [], // array with x-coords of drag points on canvas
dragPointList = [], // list of drag points on canvas
oldDragPointList = [], // list of unwanted drag points on canvas :(
simArray = [], // adds a canvas for separate simulations
lastSim = 0, // last canvas for the drag point selection panel
currentSim = 0, // current canvas for the drag point selection panel
selectedSim = 0,
formerChoice = 0,
numOfChoices = 4, // # of "choices" for the drag point edit panel
currentDragPoint,
originalDragPoint,
isNew = false,
//snapColor = "red",
fabricJSON,
objectlist = [],
snapping = "on",
current = 0;


var canvasWidth = document.getElementById('canvas').width;
var canvasHeight = document.getElementById('canvas').height;

canvas.fireEventForObjectInsideGroup = false;
interact.fireEventForObjectInsideGroup = false;

canvas.selectable = true;
// physics.selectable = true;
//physics.selectable = false;
//physics.selection = false;
physics.isDrawingMode = false;
canvas.counter = 0;
physics.counter = 0;

//resize the canvas
window.addEventListener('resize', resizeCanvas(), false);
window.addEventListener('resize', resizePhysicsPanel(), false);

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

function resizePhysicsPanel () {
 physics.setHeight(window.innerHeight*0.7);
 physics.setWidth(window.innerWidth*(1-1.55/3));
 physics.renderAll();
}

resizeCanvas();
resizePhysicsPanel();

function updateLog() {
  updateModifications(true);
  canvas.counter++;
}


function addDragPoints(obj, dx, dy) {
  var drag = new fabric.DragPoint({
      name: allocSName(),
      shape: obj,
      shapeName: obj.get('name'),
      DX: dx,
      DY: dy,
      radius: 7
    });
    drag.startDragPoint(obj, interact);
    interact.add(drag);

    drag.on('selected', function() {
      //if a drag point hasn't been clicked before, upon being clicked,
      //a drag point is selected and added to dragPointList
      if (this.get('fill') == 'grey' && this.get('onCanvas') != true) {
        select(this);
      }
      // if it's on the canvas, but you're on the dp selection panel, remove it
      else if (this.get('fill') == 'orange' && this.get('onCanvas') === true) {
        undoSelect(this);
        canvas.remove(this);
      }
      // if it's just on the canvas, do nothing
      else if (this.get('fill') == 'grey' && this.get('onCanvas') === true) {}
      // undos selection of a drag point if you click it again
      else {
        undoSelect(this);
      }});

    // on right click, opens up the edit simulation panel
    drag.on('mousedown', function (options) {
      if (options.e.which === 3) {
          console.log('BETTER BE RIGHT CLICKING');
          if (this.get('onCanvas') != true) {
              select(drag);
          }
          open1();
          onLoadSims(drag);
      } } );
  }

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
                fill: 'orange'
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
      }
    }
  });
  return false;
}

// checks if a particular drag point is already located on shape
function checkForDragPoints(obj, type) {
  if (type === 'group') {}

  if (type === 'rect') {
    addAllDP(arrayRect, obj);
  }
  if (type === 'circle') {
    addAllDP(arrayCirc, obj);
  }
  if (type === 'line') {
    addAllDP(arrayLine, obj);
  }
  if (type === 'spring') {
    addAllDP(arraySpring, obj);
  }
}

// adds in the candidate points on the interact canvas
function candidatePoints() {
  interact.clear();
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
      fill: 'orange'
    });
    dragPointList.push(dragPoint);
  }

//undos selection of a drag point when you click on the "x" in the second overlay
function undoSelect(dragPoint) {
  dragPoint.set({
    fill: 'grey',
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
  generateSims(currentDragPoint);
  numOfChoices = BACKEND.getNumChoices(currentDragPoint.get("name")) - 1;
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
        fill: 'grey',
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

function removeAllDragPoints(canvas) {
  canvas.forEachObject( function(o) {
    if (o.get('type') == 'dragPoint') {
        canvas.remove(o);
    }});
  }

//
function onUndoRedo() {
  removeAllDragPoints(canvas);
  // adds drag points back to the canvas
  for (var i = 0; i < dragPointList.length; i++) {
    canvas.add(dragPointList[i]);
    dragPointList[i].startDragPointByName(canvas);
  }
}

canvas.on(
    'object:modified', function () {
    updateModifications(true);
    window.BACKEND.drawToPhysics(fabricJSON, physics);
},
    'object:added', function () {
      // console.log('added');
    updateModifications(true);
    window.BACKEND.drawToPhysics(fabricJSON, physics);
},
    'object:deselected', function() {
    updateModifications(true);
    window.BACKEND.drawToPhysics(fabricJSON, physics);
},
    'mouse:out', function() {
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

undo = function undo() {
    if (mods < state.length) {
        canvas.clear().renderAll();
        current = state.length - mods - 1;
        canvas.loadFromJSON(state[current - 1]);
        mods += 1;
        onUndoRedo();
        canvas.renderAll();
    }
}

redo = function redo() {
    if (mods > 0) {
        canvas.clear().renderAll();
        current = state.length - mods - 1;
        canvas.loadFromJSON(state[current + 1]);
        mods -= 1;
        onUndoRedo();
        canvas.renderAll();
    }
}

function findNewPos(distX, distY, target, obj) {
	// See whether to focus on X or Y axis
	if(Math.abs(distX) > Math.abs(distY)) {
		if (distX > 0) {
			target.setLeft(obj.getLeft() - target.getWidth());
		} else {
			target.setLeft(obj.getLeft() + obj.getWidth());
		}
	} else {
		if (distY > 0) {
			target.setTop(obj.getTop() - target.getHeight());
		} else {
			target.setTop(obj.getTop() + obj.getHeight());
		}
	}
}

canvas.on('object:moving', function (options) {

	// Sets corner position coordinates based on current angle, width and height
	options.target.setCoords();

	// Don't allow objects off the canvas
	if (options.target.getLeft() < snap) {
		options.target.setLeft(0);
	}

	if (options.target.getTop() < snap) {
		options.target.setTop(0);
	}

	if ((options.target.getWidth() + options.target.getLeft()) > (canvasWidth - snap)) {
		options.target.setLeft(canvasWidth - options.target.getWidth());
	}

	if ((options.target.getHeight() + options.target.getTop()) > (canvasHeight - snap)) {
		options.target.setTop(canvasHeight - options.target.getHeight());
	}

	// Loop through objects
	canvas.forEachObject(function (obj) {
    // makes sure drag points don't get in the way
    if (obj instanceof fabric.DragPoint || options.target instanceof fabric.DragPoint) return;

    // makes sure /some/ points don't get in the way
    if (obj.snap == false || options.target.snap == false) return;

    // turns snapping off
    if (snapping === 'off') return;

		if (obj === options.target) return;

		// If objects intersect
		if (options.target.isContainedWithinObject(obj) || options.target.intersectsWithObject(obj) || obj.isContainedWithinObject(options.target)) {

			var distX = ((obj.getLeft() + obj.getWidth()) / 2) - ((options.target.getLeft() + options.target.getWidth()) / 2);
			var distY = ((obj.getTop() + obj.getHeight()) / 2) - ((options.target.getTop() + options.target.getHeight()) / 2);

			// Set new position
			findNewPos(distX, distY, options.target, obj);
		}

		// Snap objects to each other horizontally

		// If bottom points are on same Y axis
		if (Math.abs((options.target.getTop() + options.target.getHeight()) - (obj.getTop() + obj.getHeight())) < snap) {


			// Snap target BL to object BR
			if(Math.abs(options.target.getLeft() - (obj.getLeft() + obj.getWidth())) < snap) {
				options.target.setLeft(obj.getLeft() + obj.getWidth());
				options.target.setTop(obj.getTop() + obj.getHeight() - options.target.getHeight());
        /*options.target.set({
          strokeWidth: 2,
          stroke: snapColor
        });*/
			}

			// Snap target BR to object BL
			if(Math.abs((options.target.getLeft() + options.target.getWidth()) - obj.getLeft()) < snap) {
				options.target.setLeft(obj.getLeft() - options.target.getWidth());
				options.target.setTop(obj.getTop() + obj.getHeight() - options.target.getHeight());
        /*options.target.set({
          strokeWidth: 2,
          stroke: snapColor
        });*/
			}
		}

		// If top points are on same Y axis
		if(Math.abs(options.target.getTop() - obj.getTop()) < snap) {
			// Snap target TL to object TR
			if(Math.abs(options.target.getLeft() - (obj.getLeft() + obj.getWidth())) < snap) {
				options.target.setLeft(obj.getLeft() + obj.getWidth());
				options.target.setTop(obj.getTop());
        /*options.target.set({
          strokeWidth: 2,
          stroke: snapColor
        });*/
			}

			// Snap target TR to object TL
			if(Math.abs((options.target.getLeft() + options.target.getWidth()) - obj.getLeft()) < snap) {
				options.target.setLeft(obj.getLeft() - options.target.getWidth());
				options.target.setTop(obj.getTop());
        /*options.target.set({
          strokeWidth: 2,
          stroke: snapColor
        });*/
			}
		}

		// Snap objects to each other vertically

		// If right points are on same X axis
		if(Math.abs((options.target.getLeft() + options.target.getWidth()) - (obj.getLeft() + obj.getWidth())) < snap) {
			// Snap target TR to object BR
			if(Math.abs(options.target.getTop() - (obj.getTop() + obj.getHeight())) < snap) {
				options.target.setLeft(obj.getLeft() + obj.getWidth() - options.target.getWidth());
				options.target.setTop(obj.getTop() + obj.getHeight());
        /*options.target.set({
          strokeWidth: 2,
          stroke: snapColor
        });*/
			}

			// Snap target BR to object TR
			if(Math.abs((options.target.getTop() + options.target.getHeight()) - obj.getTop()) < snap) {
				options.target.setLeft(obj.getLeft() + obj.getWidth() - options.target.getWidth());
				options.target.setTop(obj.getTop() - options.target.getHeight());
        /*options.target.set({
          strokeWidth: 2,
          stroke: snapColor
        });*/
			}
		}

		// If left points are on same X axis
		if(Math.abs(options.target.getLeft() - obj.getLeft()) < snap) {
			// Snap target TL to object BL
			if(Math.abs(options.target.getTop() - (obj.getTop() + obj.getHeight())) < snap) {
				options.target.setLeft(obj.getLeft());
				options.target.setTop(obj.getTop() + obj.getHeight());
        /*options.target.set({
          strokeWidth: 2,
          stroke: snapColor
        });*/
			}

			// Snap target BL to object TL
			if(Math.abs((options.target.getTop() + options.target.getHeight()) - obj.getTop()) < snap) {
				options.target.setLeft(obj.getLeft());
				options.target.setTop(obj.getTop() - options.target.getHeight());
        /*options.target.set({
          strokeWidth: 2,
          stroke: snapColor
        });*/
			}
		}
	});
	options.target.setCoords();

	// If objects still overlap

	var outerAreaLeft = null,
	outerAreaTop = null,
	outerAreaRight = null,
	outerAreaBottom = null;

	canvas.forEachObject(function (obj) {

    // makes sure drag points don't get in the way
    if (obj instanceof fabric.DragPoint || options.target instanceof fabric.DragPoint) return;

    // makes sure /some/ points don't get in the way
    if (obj.snap == false || options.target.snap == false) return;

    // turns snapping off
    if (snapping === 'off') return;

		if (obj === options.target) return;

		if (options.target.isContainedWithinObject(obj) || options.target.intersectsWithObject(obj) || obj.isContainedWithinObject(options.target)) {

			var intersectLeft = null,
			intersectTop = null,
			intersectWidth = null,
			intersectHeight = null,
			intersectSize = null,
			targetLeft = options.target.getLeft(),
			targetRight = targetLeft + options.target.getWidth(),
			targetTop = options.target.getTop(),
			targetBottom = targetTop + options.target.getHeight(),
			objectLeft = obj.getLeft(),
			objectRight = objectLeft + obj.getWidth(),
			objectTop = obj.getTop(),
			objectBottom = objectTop + obj.getHeight();

			// Find intersect information for X axis
			if (targetLeft >= objectLeft && targetLeft <= objectRight) {
				intersectLeft = targetLeft;
				intersectWidth = obj.getWidth() - (intersectLeft - objectLeft);

			} else if(objectLeft >= targetLeft && objectLeft <= targetRight) {
				intersectLeft = objectLeft;
				intersectWidth = options.target.getWidth() - (intersectLeft - targetLeft);
			}

			// Find intersect information for Y axis
			if(targetTop >= objectTop && targetTop <= objectBottom) {
				intersectTop = targetTop;
				intersectHeight = obj.getHeight() - (intersectTop - objectTop);

			} else if(objectTop >= targetTop && objectTop <= targetBottom) {
				intersectTop = objectTop;
				intersectHeight = options.target.getHeight() - (intersectTop - targetTop);
			}

			// Find intersect size (this will be 0 if objects are touching but not overlapping)
			if(intersectWidth > 0 && intersectHeight > 0) {
				intersectSize = intersectWidth * intersectHeight;
			}

			// Set outer snapping area
			if(obj.getLeft() < outerAreaLeft || outerAreaLeft == null) {
				outerAreaLeft = obj.getLeft();
			}

			if(obj.getTop() < outerAreaTop || outerAreaTop == null) {
				outerAreaTop = obj.getTop();
			}

			if((obj.getLeft() + obj.getWidth()) > outerAreaRight || outerAreaRight == null) {
				outerAreaRight = obj.getLeft() + obj.getWidth();
			}

			if((obj.getTop() + obj.getHeight()) > outerAreaBottom || outerAreaBottom == null) {
				outerAreaBottom = obj.getTop() + obj.getHeight();
			}

			// If objects are intersecting, reposition outside all shapes which touch
			if(intersectSize) {
				var distX = (outerAreaRight / 2) - ((options.target.getLeft() + options.target.getWidth()) / 2);
				var distY = (outerAreaBottom / 2) - ((options.target.getTop() + options.target.getHeight()) / 2);

				// Set new position
				findNewPos(distX, distY, options.target, obj);
			}
		}
	});
});
/*
canvas.on('object:modified', function (options) {
  if (options.target.fill != 'white' && options.target.fill != '#fff') {
     options.target.set({
      stroke: options.target.fill
    });
  }
  else {
    options.target.set({
      stroke: 'black'
    });
  }
})*/
