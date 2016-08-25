/////////
/// snapping
/// credits to Anna Phillips @https://jsfiddle.net/aphillips8/31qbr0vn/1/
/////////

var snapping = false, // true permits snapping on the "canvas" canvas
newArray = [],
snap = 8; // pixels to snap;

function alignContactPoints(obj, target, array) {
	var dx = array[0],
	dy = array[1];
	if (array.length == 0) {}
	else if (array[0] >= 0 && array[1] >= 0) {
		obj.set({
			left: target.getLeft() + target.getWidth()*dx,
			top: target.getTop() + target.getHeight()*dy
		});
		console.log('setting');
	}
	else if (array[0] < 0 && array[1] >= 0) {
		obj.set({
			left: target.getLeft() + obj.getWidth()*dx,
			top: target.getTop() + target.getHeight()*dy
		});
		console.log('setting');
	}
	else if (array[0] >= 0 && array[1] < 0) {
		obj.set({
			left: target.getLeft() + target.getWidth()*dx,
			top: target.getTop() + obj.getHeight()*dy
		});
		console.log('setting');
	}
	else if (array[0] < 0 && array[1] < 0) {
		obj.set({
			left: target.getLeft() + obj.getWidth()*dx,
			top: target.getTop() + obj.getHeight()*dy
		});
		console.log('setting');
	}
	else {}

	if (array[0] == 0.5 || array[1] == 0.5) {
		if (array[0] == 0.5) {
			obj.set({
				left: target.getLeft() + target.getWidth()*dx - obj.getHeight()*0.5
			});
		}
		if (array[1] == 0.5) {
			obj.set({
				top: target.getTop() + target.getHeight()*dy - obj.getHeight()*0.5
			});
		}
	}
}

function findCP(array, dx, dy) {
	for (var i = 0; i < array.length; i++) {
		if (Math.abs(dx) == array[i][0] && Math.abs(dy) == array[i][1]) {
			return array[i];
		}
	}
	return [];
}

function checkForContactPoints(obj, target, dx, dy) {
	if (obj.get('physics') === 'pendulum') {
    if (obj.get('item') === 'bob') {
			newArray = [dx, dy];
      alignContactPoints(obj, target, newArray);
    }
    if (obj.get('item') === 'pivot') {
			newArray = [dx, dy];
      alignContactPoints(obj, target, newArray);
    }
  }
  else if (obj.get('physics') === 'spring') {
			newArray = [dx, dy];
      alignContactPoints(obj, target, newArray);
  }
  else if (obj.get('physics') === 'none') {
    if (obj.get('type') === 'arrow') {
			newArray = [dx, dy];
      alignContactPoints(obj, target, newArray);
    }
    else if (obj.get('type') === 'rect') {
			newArray = [dx, dy];
      alignContactPoints(obj, target, newArray);
    }
    else if (obj.get('type') === 'circle') {
			newArray = [dx, dy];
      alignContactPoints(obj, target, newArray);
    }
    else if (obj.get('type') === 'line') {
			newArray = [dx, dy];
      alignContactPoints(obj, target, newArray);
    }
    else { return; }
  }
  else { return; }
}

function snapToNearestContactPoint(obj, target) {
	// top-left from top-left
	if (obj.getTop() < target.getTop() && obj.getLeft() < target.getLeft()) {
			checkForContactPoints(obj, target, -1, -1);
			//console.log("top-left");
		}
	// top-left from top
	else if (obj.getLeft() <= target.getLeft()
		&& obj.getTop() <= target.getTop() + target.getHeight()*0.25) {
			checkForContactPoints(obj, target, -1, -1);
			//console.log("top-left");
		}
	// top-left from left
	else if (obj.getTop() < target.getTop()
		&& obj.getLeft() <= target.getLeft() + target.getWidth()*0.25) {
			checkForContactPoints(obj, target, -1, -1);
			//console.log("top-left");
		}
	// top
	else if (obj.getTop() < target.getTop()
		&& obj.getLeft() >= target.getLeft() + target.getWidth()*0.25) {
			// top-middle
			if (obj.getLeft() <= target.getLeft() + target.getWidth()*0.75) {
				checkForContactPoints(obj, target, 0.5, -1);
				//console.log("top-middle");
			}
			// top-right
			else if (obj.getLeft() <= target.getLeft() + target.getWidth()*1.1) {
				checkForContactPoints(obj, target, 1, -1);
				//console.log("top-right");
			}
		}
	// left
  else if (obj.getLeft() <= target.getLeft()) {
		// left-middle
		if (obj.getTop() <= target.getTop() + target.getHeight()*0.75) {
			checkForContactPoints(obj, target, -1, 0.5);
			//console.log("left-middle");
		}
		// left-bottom
		else if (obj.getTop() <= target.getTop() + target.getHeight()*1.1) {
			checkForContactPoints(obj, target, -1, 1);
			//console.log("left-bottom");
		}
	}
	// right
 	else if (obj.getTop() >= target.getTop() + target.getHeight()*0.2
	&& obj.getLeft() >= target.getLeft() + target.getWidth()) {
		// right-top
		if (target.getTop() + target.getHeight()*0.25 >= obj.getTop()
				&& obj.getTop() >= target.getTop()) {
			checkForContactPoints(obj, target, 1, -1);
			//console.log("right-top");
		}
		// right-middle
		else if (target.getTop() + target.getHeight()*0.25 < obj.getTop()
				&& obj.getTop() <= target.getTop() + target.getHeight()*0.75) {
			checkForContactPoints(obj, target, 1, 0.5);
			//console.log("right-middle");
		}
		// right-bottom
		else if (target.getTop() + target.getHeight()*0.25 <= obj.getTop()
				&& obj.getTop() >= target.getTop() + target.getHeight()*1.1) {
			checkForContactPoints(obj, target, 1, 1);
			//console.log("right-bottom");
		}
	}
	// bottom
	else if (obj.getTop() >= target.getTop() + target.getHeight()) {
		// bottom-middle
		if (obj.getLeft() >= target.getLeft() + target.getWidth()*0.25
			&& obj.getLeft() < target.getLeft() + target.getWidth()*0.75) {
			checkForContactPoints(obj, target, 0.5, 1);
			//console.log("bottom-middle");
		}
		// bottom-right
		else if (obj.getLeft() > target.getLeft() + target.getWidth()*0.75) {
			checkForContactPoints(obj, target, 1, 1);
			//console.log("bottom-right");
		}
		// bottom-left
		else if (obj.getLeft() <= target.getLeft() + target.getWidth()*0.25) {
			checkForContactPoints(obj, target, -1, 1);
			//console.log("bottom-left");
		}
	}
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

			/*
			// Snap target BL to object BR
			if(Math.abs(options.target.getLeft() - (obj.getLeft() + obj.getWidth())) < snap) {
				options.target.setLeft(obj.getLeft() + obj.getWidth());
				options.target.setTop(obj.getTop() + obj.getHeight() - options.target.getHeight());
			}

			// Snap target BR to object BL
			if(Math.abs((options.target.getLeft() + options.target.getWidth()) - obj.getLeft()) < snap) {
				options.target.setLeft(obj.getLeft() - options.target.getWidth());
				options.target.setTop(obj.getTop() + obj.getHeight() - options.target.getHeight());
			} */
			snapToNearestContactPoint(options.target, obj);
		}

		// If top points are on same Y axis
		if(Math.abs(options.target.getTop() - obj.getTop()) < snap) {
			/*// Snap target TL to object TR
			if(Math.abs(options.target.getLeft() - (obj.getLeft() + obj.getWidth())) < snap) {
				options.target.setLeft(obj.getLeft() + obj.getWidth());
				options.target.setTop(obj.getTop());
			}

			// Snap target TR to object TL
			if(Math.abs((options.target.getLeft() + options.target.getWidth()) - obj.getLeft()) < snap) {
				options.target.setLeft(obj.getLeft() - options.target.getWidth());
				options.target.setTop(obj.getTop());
			}*/
			snapToNearestContactPoint(options.target, obj);
		}

		// Snap objects to each other vertically

		// If right points are on same X axis
		if(Math.abs((options.target.getLeft() + options.target.getWidth()) - (obj.getLeft() + obj.getWidth())) < snap) {
			/*// Snap target TR to object BR
			if(Math.abs(options.target.getTop() - (obj.getTop() + obj.getHeight())) < snap) {
				options.target.setLeft(obj.getLeft() + obj.getWidth() - options.target.getWidth());
				options.target.setTop(obj.getTop() + obj.getHeight());
			}

			// Snap target BR to object TR
			if(Math.abs((options.target.getTop() + options.target.getHeight()) - obj.getTop()) < snap) {
				options.target.setLeft(obj.getLeft() + obj.getWidth() - options.target.getWidth());
				options.target.setTop(obj.getTop() - options.target.getHeight());
			}*/
			snapToNearestContactPoint(options.target, obj);
		}

		// If left points are on same X axis
		if(Math.abs(options.target.getLeft() - obj.getLeft()) < snap) {
			/*// Snap target TL to object BL
			if(Math.abs(options.target.getTop() - (obj.getTop() + obj.getHeight())) < snap) {
				options.target.setLeft(obj.getLeft());
				options.target.setTop(obj.getTop() + obj.getHeight());
			}

			// Snap target BL to object TL
			if(Math.abs((options.target.getTop() + options.target.getHeight()) - obj.getTop()) < snap) {
				options.target.setLeft(obj.getLeft());
				options.target.setTop(obj.getTop() - options.target.getHeight());
			}*/
			snapToNearestContactPoint(options.target, obj);
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
