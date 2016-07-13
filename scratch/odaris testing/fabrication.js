var canvas = new fabric.Canvas('canvas');
//resize the canvas
window.addEventListener('resize',resizeCanvas,false);
function resizeCanvas () {
  canvas.setHeight(window.innerHeight*0.8);
  canvas.setWidth(window.innerWidth);
  canvas.renderAll
}
resizeCanvas();

counter = 0;
snap = 14; //Pixels to snap
var intersectPoint = false; // whether an intersect point exists
canvas.isDrawingMode = false;

/*
undo redo commandhistory with canvas
credits to http://jsfiddle.net/gcollect/b3aMF/
*/
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
    liveAction.loadFromJSON(state[current]);
    liveAction.renderAll();
    //console.log("geladen " + (state.length-1-mods-1));
    //console.log("state " + state.length);
    mods += 1;
    //console.log("mods " + mods);
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
        current = state.length - mods;
        canvas.loadFromJSON(state[state.length - 1 - mods + 1]);
        canvas.renderAll();
        //console.log("geladen " + (state.length-1-mods+1));
        mods -= 1;
        //console.log("state " + state.length);
        //console.log("mods " + mods);
    }
}

canvas.selection = true;

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
/*
function createGroup(target, relatedTarget, right, bottom) {
  // create a group with copies of existing (2) objects
	if (target != null && relatedTarget != null) {
		if (target.contains() != true || relatedTarget.contains() != true) {
			var group = new fabric.Group([
	    canvas.target.clone(),
	    canvas.relatedTarget.clone()
	  ], {
			left: right,
			top: bottom
		});
			// remove all objects and re-render
			canvas.target.remove();
			canvas.targetRelated.remove();
			// add group onto canvas
			canvas.add(group);
		}
	}}
*/

// creates a point at an intersection
function addPoint(x, y) {
  var attachPoint = new fabric.Circle({
      fill: 'black',
      top: y,
      left: x,
      radius: 2,
      selectable: false
    });
  canvas.add(attachPoint);
  intersectPoint = true;
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

	// Loop through objects
	canvas.forEachObject(function (obj) {
		if (obj === options.target) return;

		// If objects intersect
		if (options.target.isContainedWithinObject(obj) || options.target.intersectsWithObject(obj) || obj.isContainedWithinObject(options.target)) {
      var avgPointX = (obj.getLeft() + obj.getWidth() + options.target.getLeft() + options.target.getWidth()) / 2;
      var avgPointY = (obj.getTop() + obj.getHeight() + options.target.getTop() + options.target.getHeight()) / 2;
			var distX = ((obj.getLeft() + obj.getWidth()) / 2) - ((options.target.getLeft() + options.target.getWidth()) / 2);
			var distY = ((obj.getTop() + obj.getHeight()) / 2) - ((options.target.getTop() + options.target.getHeight()) / 2);

      addPoint(avgPointX, avgPointY);

     canvas.on('object:moving', function () {
         var last = canvas._objects[canvas._objects.length -1]
         canvas.remove(last);
         intersectPoint = false;
        }
      });

			// Set new position
			findNewPos(distX, distY, options.target, obj);
		}

		// Snap objects to each other horizontally

		// If bottom points are on same Y axis
		if(Math.abs((options.target.getTop() + options.target.getHeight()) - (obj.getTop() + obj.getHeight())) < snap) {

      //var obj_1 = options.target;
      //var obj_2 = obj;

			// Snap target BL to object BR
			if(Math.abs(options.target.getLeft() - (obj.getLeft() + obj.getWidth())) < snap) {
				options.target.setLeft(obj.getLeft() + obj.getWidth());
				options.target.setTop(obj.getTop() + obj.getHeight() - options.target.getHeight());
        options.target.set({
          strokeWidth: 2,
          stroke: 'rgb(0, 192, 255)'
        });
			}

			// Snap target BR to object BL
			if(Math.abs((options.target.getLeft() + options.target.getWidth()) - obj.getLeft()) < snap) {
				options.target.setLeft(obj.getLeft() - options.target.getWidth());
				options.target.setTop(obj.getTop() + obj.getHeight() - options.target.getHeight());
        options.target.set({
          strokeWidth: 2,
          stroke: 'rgb(0, 192, 255)'
        });
			}
			//createGroup(obj_1, obj_2, options.target.getHeight(), obj.getTop());

		}

		// If top points are on same Y axis
		if(Math.abs(options.target.getTop() - obj.getTop()) < snap) {
			// Snap target TL to object TR
			if(Math.abs(options.target.getLeft() - (obj.getLeft() + obj.getWidth())) < snap) {
				options.target.setLeft(obj.getLeft() + obj.getWidth());
				options.target.setTop(obj.getTop());
        options.target.set({
          strokeWidth: 2,
          stroke: 'rgb(0, 192, 255)'
        });
			}

			// Snap target TR to object TL
			if(Math.abs((options.target.getLeft() + options.target.getWidth()) - obj.getLeft()) < snap) {
				options.target.setLeft(obj.getLeft() - options.target.getWidth());
				options.target.setTop(obj.getTop());
        options.target.set({
          strokeWidth: 2,
          stroke: 'rgb(0, 192, 255)'
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
          stroke: 'rgb(0, 192, 255)'
        });
			}

			// Snap target BR to object TR
			if(Math.abs((options.target.getTop() + options.target.getHeight()) - obj.getTop()) < snap) {
				options.target.setLeft(obj.getLeft() + obj.getWidth() - options.target.getWidth());
				options.target.setTop(obj.getTop() - options.target.getHeight());
        options.target.set({
          strokeWidth: 2,
          stroke: 'rgb(0, 192, 255)'
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
          stroke: 'rgb(0, 192, 255)'
        });
			}

			// Snap target BL to object TL
			if(Math.abs((options.target.getTop() + options.target.getHeight()) - obj.getTop()) < snap) {
				options.target.setLeft(obj.getLeft());
				options.target.setTop(obj.getTop() - options.target.getHeight());
        options.target.set({
          strokeWidth: 2,
          stroke: 'rgb(0, 192, 255)'
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
			}

      else if(objectLeft >= targetLeft && objectLeft <= targetRight) {
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
  options.target.set({
<<<<<<< HEAD:scratch/current/fabrication.js
    strokeWidth: 2
=======
    stroke: options.target.fill
>>>>>>> b9f887de557a4a04be5f626338a81f956cee7044:scratch/odaris testing/fabrication.js
  });
})

//Now we test deletion
function deleteObjects(){
	var activeObject = canvas.getActiveObject(),activeGroup = canvas.getActiveGroup();
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