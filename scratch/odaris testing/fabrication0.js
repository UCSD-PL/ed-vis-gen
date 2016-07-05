var canvas = new fabric.Canvas('canvas'),
liveAction = new fabric.Canvas('live-action'),
canvasWidth = document.getElementById('canvas').width,
canvasHeight = document.getElementById('canvas').height,
counter = 0,
snap = 14; //Pixels to snap

//resize the canvas
window.addEventListener('resize',resizeCanvas, false);
window.addEventListener('resize',resizeLiveActionPanel, false);

var canvasHeight = window.innerHeight*0.8;
var canvasWidth = window.innerWidth*1.6/3;

function resizeCanvas () {
 canvas.setHeight(window.innerHeight*0.8);
 canvas.setWidth(window.innerWidth*1.6/3);
 canvas.renderAll();
}

function resizeLiveActionPanel () {
 liveAction.setHeight(window.innerHeight*0.8);
 liveAction.setWidth(window.innerWidth*1.35/3);
 liveAction.renderAll();
}

resizeCanvas();
resizeLiveActionPanel();

canvas.isDrawingMode = false;
canvas.selection = true;

var allowAnchoring = true;
var isSnapping = false;

var state = [];
var mods = 0;
var current = 0;
liveAction.counter = 0;

function updateLog() {
    updateModifications(true);
    liveAction.counter++;
}

canvas.on(
    'object:modified', function () {
    updateModifications(true);
},
    'object:added', function () {
    updateModifications(true);
});

function updateModifications(savehistory) {
    if (savehistory === true) {
        myjson = JSON.stringify(canvas);
        state.push(myjson);
        current += 1;
    }
}

function translate() {
    liveAction.clear().renderAll();
    current = state.length - mods - 1;
    liveAction.loadFromJSON(state[current]);
    liveAction.renderAll();
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

function isAnchored (object) {
  if (object.toObject.anchored != null) {
    if (object.toObject.anchored == true) {
      return true;
    }
  }
  else {
    return false;
  }
}

function fix(object, anchor) {
  if (isAnchored(object) && allowAnchoring) {
    if (anchor.getTop > object.getTop) {
      anchor.set({
        top: object.getTop(),
        left: object.getLeft()
      });
      object.toObject = function() {
        return {
          anchored: true
        };
      };
    }}

  else {
      anchor.set({
        top: object.getHeight() + object.getTop(),
        left: object.getLeft()
      });
      object.toObject = function() {
        return {
          anchored: true
        };
      };
  }}

function giveCue(dtop, dleft, obj1, obj2) {
  attachPoint.set({
        fill: 'orange',
        top: dtop,
        left: dleft,
        radius: 10
  });
  canvas.setOverlayImage(attachPoint);
  // when cue is selected
  canvas.on('object:moving', function (options) {
    fix(obj1, obj2);
});
}

function removeCue() {
  attachPoint.set({
        radius: 0
  });
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
	if(options.target.getLeft() < snap) {
		options.target.setLeft(0);
	}

	if(options.target.getTop() < snap) {
		options.target.setTop(0);
	}

	if((options.target.getWidth() + options.target.getLeft()) > (canvasWidth - snap)) {
		options.target.setLeft(canvasWidth - options.target.getWidth());
	}

	if((options.target.getHeight() + options.target.getTop()) > (canvasHeight - snap)) {
		options.target.setTop(canvasHeight - options.target.getHeight());
	}

  /* canvas.forEachObject(function (obj) {
    if (options.target.anchored) {
      canvas.on('object:moving', function(options) {}
      });
    }
  };
*/
	// Loop through objects
	canvas.forEachObject(function (obj) {
		if (obj === options.target) {
      isSnapping = false;
      return;
    };

    if (obj != null) {
     if (obj.get('lockScalingX') || obj.get('lockScalingY') || options.target.get('lockScalingX') || options.target.get('lockScalingY')) {
      isSnapping = false;
      return;
    }}

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
        isSnapping = true;
        options.target.set({
          strokeWidth: 2,
          stroke: 'rgb(0, 192, 255)'
        });
        giveCue(obj.getTop(), options.target.getLeft(), obj, options.target);
      }
			}

			// Snap target BR to object BL
		if(Math.abs((options.target.getLeft() + options.target.getWidth()) - obj.getLeft()) < snap) {
				options.target.setLeft(obj.getLeft() - options.target.getWidth());
				options.target.setTop(obj.getTop() + obj.getHeight() - options.target.getHeight());
        isSnapping = true;
        options.target.set({
          strokeWidth: 2,
          stroke: 'rgb(0, 192, 255)'
        });
        giveCue(obj.getTop(), options.target.getLeft(), obj, options.target);
			}

		// If top points are on same Y axis
		if (Math.abs(options.target.getTop() - obj.getTop()) < snap) {
			// Snap target TL to object TR
			if (Math.abs(options.target.getLeft() - (obj.getLeft() + obj.getWidth())) < snap) {
				options.target.setLeft(obj.getLeft() + obj.getWidth());
				options.target.setTop(obj.getTop());
        isSnapping = true;
        options.target.set({
          strokeWidth: 2,
          stroke: 'rgb(0, 192, 255)'
        });
        giveCue(obj.getTop(), options.target.getLeft(), obj, options.target);
			}

			// Snap target TR to object TL
			if(Math.abs((options.target.getLeft() + options.target.getWidth()) - obj.getLeft()) < snap) {
				options.target.setLeft(obj.getLeft() - options.target.getWidth());
				options.target.setTop(obj.getTop());
        isSnapping = true;
        options.target.set({
          strokeWidth: 2,
          stroke: 'rgb(0, 192, 255)'
        });
        giveCue(obj.getTop(), options.target.getLeft(), obj, options.target);
			}
      isSnapping = false;
		}

		// Snap objects to each other vertically

		// If right points are on same X axis
		if(Math.abs((options.target.getLeft() + options.target.getWidth()) - (obj.getLeft() + obj.getWidth())) < snap) {
			// Snap target TR to object BR
			if(Math.abs(options.target.getTop() - (obj.getTop() + obj.getHeight())) < snap) {
				options.target.setLeft(obj.getLeft() + obj.getWidth() - options.target.getWidth());
				options.target.setTop(obj.getTop() + obj.getHeight());
        isSnapping = true;
        options.target.set({
          strokeWidth: 2,
          stroke: 'rgb(0, 192, 255)'
        });
        giveCue(obj.getTop(), options.target.getLeft(), obj, options.target);
			}

			// Snap target BR to object TR
			if(Math.abs((options.target.getTop() + options.target.getHeight()) - obj.getTop()) < snap) {
				options.target.setLeft(obj.getLeft() + obj.getWidth() - options.target.getWidth());
				options.target.setTop(obj.getTop() - options.target.getHeight());
        isSnapping = true;
        options.target.set({
          strokeWidth: 2,
          stroke: 'rgb(0, 192, 255)'
        });
        giveCue(obj.getTop(), options.target.getLeft(), obj, options.target);
			}
		}

		// If left points are on same X axis
		if(Math.abs(options.target.getLeft() - obj.getLeft()) < snap) {
			// Snap target TL to object BL
			if(Math.abs(options.target.getTop() - (obj.getTop() + obj.getHeight())) < snap) {
				options.target.setLeft(obj.getLeft());
				options.target.setTop(obj.getTop() + obj.getHeight());
        isSnapping = true;
        options.target.set({
          strokeWidth: 2,
          stroke: 'rgb(0, 192, 255)'
        });
        giveCue(obj.getTop(), options.target.getLeft(), obj, options.target);
			}

			// Snap target BL to object TL
			if(Math.abs((options.target.getTop() + options.target.getHeight()) - obj.getTop()) < snap) {
				options.target.setLeft(obj.getLeft());
				options.target.setTop(obj.getTop() - options.target.getHeight());
        isSnapping = true;
        options.target.set({
          strokeWidth: 2,
          stroke: 'rgb(0, 192, 255)'
        });
        giveCue(obj.getTop(), options.target.getLeft(), obj, options.target);
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
		if (obj === options.target) return;

    if (obj.get('lockScalingX') || obj.get('lockScalingY') || options.target.get('lockScalingX') || options.target.get('lockScalingY')) {
      isSnapping = false;
      return;
    }

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
  if (!isSnapping) {
    options.target.set({
      stroke: options.target.fill
    });
    removeCue();
  }
});

//Now we test deletion
function deleteObjects(){
	var activeObject = canvas.getActiveObject(), activeGroup = canvas.getActiveGroup();
	if (activeObject) {canvas.remove(activeObject);}
	else if (activeGroup) {
		var objectsInGroup = activeGroup.getObjects();
		canvas.discardActiveGroup();
		objectsInGroup.forEach(function(object) {
		canvas.remove(object);
		});}}

//We test select mode
function selectmode(){
	canvas.isDrawingMode=false;
}

//We test drawing mode
function Drawingmode(){
	canvas.isDrawingMode=true;
}
