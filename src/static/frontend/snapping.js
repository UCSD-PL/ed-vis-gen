/////////
/// snapping
/// credits to Anna Phillips @https://jsfiddle.net/aphillips8/31qbr0vn/1/
/////////

var snapping = false, // true permits snapping on the "canvas" canvas
newArray = [],
snap = 8; // pixels to snap;

function alignContactPoints(obj, target, array) {
	if (array.length != 0) {
		var dx = array[0],
		dy = array[1];

		obj.set({
			left: target.getLeft() + target.getWidth()*dx,
			top: target.getTop() + target.getHeight()*dy
		});
}}

function findCP(array, dx, dy) {
	for (var i = 0; i < array.length; i++) {
		if (dx == array[i][0] && dy == array[i][1]) {
			return array[i];
		}
	}
	return [];
}

function checkForContactPoints(obj, target, dx, dy) {
	if (obj.get('physics') === 'pendulum') {
    if (obj.get('item') === 'bob') {
			newArray = findCP(arrayBob, dx, dy);
      alignContactPoints(obj, target, newArray);
    }
    if (obj.get('item') === 'pivot') {
			newArray = findCP(arrayPiv, dx, dy);
      alignContactPoints(obj, target, newArray);
    }
  }
  else if (obj.get('physics') === 'spring') {
			newArray = findCP(arraySpring, dx, dy);
      alignContactPoints(obj, target, newArray);
  }
  else if (obj.get('physics') === 'none') {
    if (obj.get('type') === 'arrow') {
			newArray = findCP(arrayArr, dx, dy);
      alignContactPoints(obj, target, newArray);
    }
    else if (obj.get('type') === 'rect') {
			newArray = findCP(arrayRect, dx, dy);
      alignContactPoints(obj, target, newArray);
    }
    else if (obj.get('type') === 'circle') {
			newArray = findCP(arrayCirc, dx, dy);
      alignContactPoints(obj, target, newArray);
    }
    else if (obj.get('type') === 'line') {
			newArray = findCP(arrayLine);
      alignContactPoints(obj, target, newArray);
    }
    else { return; }
  }
  else { return; }
}

function snapToNearestContactPoint(obj, target) {
 	if (obj.getTop() >= target.getTop() - target.getHeight()*0.2
	&& obj.getLeft() >= target.getLeft() + target.getWidth()) {
		if (target.getTop() + target.getHeight()*0.25 >= obj.getTop()
				&& obj.getTop() >= target.getTop()) {
			checkForContactPoints(obj, target, 1, 0);
		}
		else if (target.getTop() + target.getHeight()*0.25 < obj.getTop()
				&& obj.getTop() <= target.getTop() + target.getHeight()*0.75) {
			checkForContactPoints(obj, target, 1, 0.5);
		}
		else if (target.getTop() + target.getHeight()*0.25 <= obj.getTop()
				&& obj.getTop() >= target.getTop() + target.getHeight()) {
			checkForContactPoints(obj, target, 1, 1);
		}
		else { }
	}
	else if (obj.getLeft() < target.getLeft() + target.getWidth()) {
		if (obj.getLeft() > target.getLeft() + target.getWidth()*0.75) {
			checkForContactPoints(obj, target, 1, 1);
		}
		else if (obj.getLeft() > target.getLeft() + target.getWidth()*0.25
			&& obj.getLeft() < target.getLeft() + target.getWidth()*0.75) {
			checkForContactPoints(obj, target, 0.5, 1);
		}
		else if (obj.getLeft() <= target.getLeft() + target.getWidth()*0.25) {
			checkForContactPoints(obj, target, 0, 0);
		}
		else { }
	}
	else { }
}

function findNewPos(distX, distY, target, obj) {
	// See whether to focus on X or Y axis
	if (Math.abs(distX) > Math.abs(distY)) {
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
    if (!snapping) return;

		if (obj === options.target) return;

		// If objects intersect
		if (options.target.isContainedWithinObject(obj) || options.target.intersectsWithObject(obj) || obj.isContainedWithinObject(options.target)) {

			var distX = ((obj.getLeft() + obj.getWidth()) / 2) - ((options.target.getLeft() + options.target.getWidth()) / 2);
			var distY = ((obj.getTop() + obj.getHeight()) / 2) - ((options.target.getTop() + options.target.getHeight()) / 2);

			// Set new position
			findNewPos(distX, distY, options.target, obj);
			snapToNearestContactPoint(options.target, obj);
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
    if (!snapping) return;

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
