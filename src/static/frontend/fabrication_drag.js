var canvas = new fabric.Canvas('canvas'), // left-side panel
physics = new fabric.Canvas('physics'), // right-side panel
interact = new fabric.Canvas('interact'), // overlay-side panel
counter = 0,
snap = 14, // pixels to snap
state = [],
mods = 0,
selectedObj = [],
whereDP = 0,
selectedX = [], // array with y-coords of drag points on canvas
selectedY = [], // array with x-coords of drag points on canvas
dragPointList = [], // list of drag points on canvas
oldDragPointList = [], // list of unwanted drag points on canvas :(
snapColor = "red",
fabricJSON,
objectlist = [],
snapping = "on",
current = 0;


var canvasWidth = document.getElementById('canvas').width;
var canvasHeight = document.getElementById('canvas').height;

canvas.selectable = true;
physics.selectable = false;
physics.isDrawingMode = false;
canvas.counter = 0;
physics.counter = 0;

//resize the canvas
window.addEventListener('resize', resizeCanvas(), false);
window.addEventListener('resize', resizePhysicsPanel(), false);

function resizeCanvas () {
 canvas.setHeight(window.innerHeight*0.7);
 canvas.setWidth(window.innerWidth*1.55/3);
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

// adds in the candidate points on the interact canvas
function candidatePoints() {
  interact.clear();
  oldDragPointList = dragPointList;
  dragPointList = [];
  canvas.forEachObject( function (obj) {
    if (obj != null && obj instanceof fabric.Rect) {
      var thing = obj;
      objectlist.push(obj);
      interact.add(obj);
      obj.set({
        selectable: false
      });
      //console.log("it's a rectangle!");
      addDragPoints(obj, 0.5, 0.5);
      addDragPoints(obj, 0, 0);
      addDragPoints(obj, 1, 1);
      addDragPoints(obj, 0, 0.5);
      addDragPoints(obj, 0.5, 0);
      addDragPoints(obj, 0, 1);
      addDragPoints(obj, 1, 0.5);
      addDragPoints(obj, 1, 0);
      addDragPoints(obj, 0.5, 1);
      interact.renderAll();
    }
    if (obj != null && obj instanceof fabric.Circle) {
      objectlist.push(obj);
      obj.set({
        selectable: false
      });
      interact.add(obj);
      //console.log("it's a circle!");
      addDragPoints(obj, 0.5, 0.5);
      addDragPoints(obj, 0.15, 0.15);
      addDragPoints(obj, 0.85, 0.85);
      addDragPoints(obj, 0, 0.5);
      addDragPoints(obj, 0.5, 0);
      addDragPoints(obj, 0.15, 0.85);
      addDragPoints(obj, 1, 0.5);
      addDragPoints(obj, 0.85, 0.15);
      addDragPoints(obj, 0.5, 1);
      interact.renderAll();
    }
  });

  function addDragPoints(obj, dx, dy) {
    var drag = new fabric.DragPoint({
        name: allocSName(),
        shape: obj,
        DX: dx,
        DY: dy
      });
      drag.updateCoords(interact);
      interact.add(drag);

      drag.on('selected', function() {
        //console.log("THE DRAG POINTS ARE BEING RECOGNIZED");
        if (this.get('fill') == 'black') {
          this.set({
            fill: 'orange'
          });
          dragPointList.push(drag);
        }

        else {
          this.set({
            fill: 'black'
          });

          function checkDP (dp) {
            return dp == drag;
          }

          whereDP = dragPointList.findIndex(checkDP);

          dragPointList.splice(whereDP, 1);
        }});
      }
    }

function onOverlayClosed(){
  console.log(dragPointList);
  // removes old dragPoints.
  for (var i = 0; i < oldDragPointList.length; i++) {
    canvas.remove(oldDragPointList[i]);
  }

  // adds drag points to the canvas and attaches them to shapes
  for (var i = 0; i < dragPointList.length; i++) {
      console.log("the drag point should have been added!");
      dragPointList[i].set({
        fill: 'black'
      });
      canvas.add(dragPointList[i]);
    }
  for (var i=0; i < objectlist.length; i++) {
    objectlist[i].set({
      selectable: true
    });
  }
  canvas.renderAll();
}

// keeps drag points moving when object is modified
function keepDragPointsMoving() {
  for (var i = 0; i < dragPointList.length; i++) {
      //console.log("the drag point should have been moved!");
      dragPointList[i].updateCoords(canvas);
  }
}


canvas.on(
    'object:modified', function () {
    keepDragPointsMoving();
    updateModifications(true);
    window.BACKEND.drawFromFabric(fabricJSON);
},
    'object:added', function () {
    updateModifications(true);
    window.BACKEND.drawFromFabric(fabricJSON);
},
    'object:deselected', function() {
    updateModifications(true);
    window.BACKEND.drawFromFabric(fabricJSON);
},
    'mouse:out', function() {
    updateModifications(true);
    window.BACKEND.drawFromFabric(fabricJSON);
}
);

function updateModifications(savehistory) {
    if (savehistory === true) {
        myjson = JSON.stringify(canvas);
        state.push(myjson);
        fabricJSON = transfer();
        current += 1;
    }
}

undo = function undo() {
    if (mods < state.length) {
        canvas.clear().renderAll();
        current = state.length - mods - 1;
        canvas.loadFromJSON(state[current - 1]);
        canvas.renderAll();
        //console.log("geladen " + (state.length-1-mods-1));
        //console.log("state " + state.length);
        mods += 1;
        //console.log("mods " + mods);
    }
}

redo = function redo() {
    if (mods > 0) {
        canvas.clear().renderAll();
        current = state.length - mods - 1;
        canvas.loadFromJSON(state[current]);
        canvas.renderAll();
        //console.log("geladen " + (state.length-1-mods+1));
        mods -= 1;
        //console.log("state " + state.length);
        //console.log("mods " + mods);
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
		if(Math.abs((options.target.getTop() + options.target.getHeight()) - (obj.getTop() + obj.getHeight())) < snap) {


			// Snap target BL to object BR
			if(Math.abs(options.target.getLeft() - (obj.getLeft() + obj.getWidth())) < snap) {
				options.target.setLeft(obj.getLeft() + obj.getWidth());
				options.target.setTop(obj.getTop() + obj.getHeight() - options.target.getHeight());
        options.target.set({
          strokeWidth: 2,
          stroke: snapColor
        });
			}

			// Snap target BR to object BL
			if(Math.abs((options.target.getLeft() + options.target.getWidth()) - obj.getLeft()) < snap) {
				options.target.setLeft(obj.getLeft() - options.target.getWidth());
				options.target.setTop(obj.getTop() + obj.getHeight() - options.target.getHeight());
        options.target.set({
          strokeWidth: 2,
          stroke: snapColor
        });
			}
		}

		// If top points are on same Y axis
		if(Math.abs(options.target.getTop() - obj.getTop()) < snap) {
			// Snap target TL to object TR
			if(Math.abs(options.target.getLeft() - (obj.getLeft() + obj.getWidth())) < snap) {
				options.target.setLeft(obj.getLeft() + obj.getWidth());
				options.target.setTop(obj.getTop());
        options.target.set({
          strokeWidth: 2,
          stroke: snapColor
        });
			}

			// Snap target TR to object TL
			if(Math.abs((options.target.getLeft() + options.target.getWidth()) - obj.getLeft()) < snap) {
				options.target.setLeft(obj.getLeft() - options.target.getWidth());
				options.target.setTop(obj.getTop());
        options.target.set({
          strokeWidth: 2,
          stroke: snapColor
        });
			}
		}

		// Snap objects to each other vertically

		// If right points are on same X axis
		if(Math.abs((options.target.getLeft() + options.target.getWidth()) - (obj.getLeft() + obj.getWidth())) < snap) {
			// Snap target TR to object BR
			if(Math.abs(options.target.getTop() - (obj.getTop() + obj.getHeight())) < snap) {
				options.target.setLeft(obj.getLeft() + obj.getWidth() - options.target.getWidth());
				options.target.setTop(obj.getTop() + obj.getHeight());
        options.target.set({
          strokeWidth: 2,
          stroke: snapColor
        });
			}

			// Snap target BR to object TR
			if(Math.abs((options.target.getTop() + options.target.getHeight()) - obj.getTop()) < snap) {
				options.target.setLeft(obj.getLeft() + obj.getWidth() - options.target.getWidth());
				options.target.setTop(obj.getTop() - options.target.getHeight());
        options.target.set({
          strokeWidth: 2,
          stroke: snapColor
        });
			}
		}

		// If left points are on same X axis
		if(Math.abs(options.target.getLeft() - obj.getLeft()) < snap) {
			// Snap target TL to object BL
			if(Math.abs(options.target.getTop() - (obj.getTop() + obj.getHeight())) < snap) {
				options.target.setLeft(obj.getLeft());
				options.target.setTop(obj.getTop() + obj.getHeight());
        options.target.set({
          strokeWidth: 2,
          stroke: snapColor
        });
			}

			// Snap target BL to object TL
			if(Math.abs((options.target.getTop() + options.target.getHeight()) - obj.getTop()) < snap) {
				options.target.setLeft(obj.getLeft());
				options.target.setTop(obj.getTop() - options.target.getHeight());
        options.target.set({
          strokeWidth: 2,
          stroke: snapColor
        });
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
			if(targetLeft >= objectLeft && targetLeft <= objectRight) {
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
})
