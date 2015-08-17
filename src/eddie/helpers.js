window.requestAnimFrame = (function(){
  return  false ||
          window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          function( callback ){
            window.setTimeout(callback, 1000 / 60);
          };
})();


// Pushes a variable number of arguments to an array.
// Despite the function signature, the intended use is
// push([foo], bar, baz, boo, bob) => [foo, bar, baz, boo, bob].
// Modifies the array in place, unfortunately.
function push(arr) {
  for (var i = 1; i < arguments.length; ++i) {
    arr.push(arguments[i]);
  }
}

// Returns true iff the input point is within the radius defined by a circle-like
// object (namely, one that defines x, y, and r)
function withinRadius(x, y, iPoint) {
  var r = iPoint.r;
  var dx = x - iPoint.x.value;
  var dy = y - iPoint.y.value;
  return (dx <= r && dx >= -r && dy <= r && dy >= -r);
}

// Copy shared fields between two objects.
function restore(outdated, original) {
  //alert(original);
  for (var f in original) {
    //alert(f);
    //console.log(original + "[" + f + "]");
    if (f in outdated) {
      //console.log(outdated + "[" + f + "] = " +  outdated[f]);
      outdated[f] = original[f];
    }
  }
}

// Restore a bunch of objects. Input is an array of outdated,original objects
// "pairs". E.g. restoreAll([old,new,old2,new2]) restores old to new and old2 to new2.
function restoreAll(pairs) {
  for (var i = 0; i < pairs.length; i+=2) {
    restore(pairs[i], pairs[i+1]);
  }
}

// Apparently JS doesn't provide a built-in shallow copy constructor. Returns
// a shallow copy of input object.
function copy(src) {
  res = {};
  for (var f in src) {
    res[f] = src[f];
  }

  return res;
}

// Helper functions for HTML sliders.

// Create an HTML slider. Takes slider parameters, builds a node, and adds the
// node to a parent.
function addSlider(name, parent, min, max, start, onchange) {
  var step = (max-min)/(1000);
  var newSlider = document.createElement("input");
  var newNode = document.createElement("p");
  var padding = document.createElement("div");
  newNode.id = name;
  newNode.textContent = name + ":";
  newSlider.id = name + "-slider"; // if this naming convention changes, getSliderValue needs to change.
  newSlider.type = "range";
  newSlider.step = step;
  newSlider.min = min;
  newSlider.max = max;
  newSlider.value = start;
  newSlider.onchange = onchange;
  newNode.appendChild(padding);
  padding.appendChild(newSlider);
  document.getElementById(parent).appendChild(newNode);
  // document.getElementById(name).appendChild(newSlider);
}

// Get the value from an HTML slider. Takes the name of the slider.
function getSliderValue(name) {
  return parseFloat(document.getElementById(name + "-slider").value);
}

// Set the value for an HTML slider. Takes the name of the slider and the new value.
function setSliderValue(name, val) {
  document.getElementById(name + "-slider").value = val;
}

// sqrt-sum values in quadrature, assumes numeric arguments
function sqrtSquaredSum(args) {
  return Math.sqrt(args.reduce(function(s, next) {
    return s + (next * next);
  }, 1));
}

CLEAR_COLOR = "rgba(255,255,255,0)";

// suggest x and y of the given object should be edited.
function startEdit(slvr, o) {
  c.assert('x' in o, "bad object " + o.toString());
  c.assert('y' in o, "bad object " + o.toString());
  slvr.addEditVar(o.x, c.Strength.strong, 5).addEditVar(o.y, c.Strength.strong, 5).beginEdit();
}

// for a given x and y, force an update to the solver
function forceUpdate(slvr, vs, x, y) {
  c.assert('x' in vs, "bad object " + vs.toString());
  c.assert('y' in vs, "bad object " + vs.toString());
    try {
    slvr.suggestValue(vs.x, x);
  } catch (err) {
    console.log("err on x" + err.toString());
  }

    try {
    slvr.suggestValue(vs.y, y);
  } catch (err) {
    console.log("err on y" + err.toString());
  }
  //slvr.suggestValue(vs.x, x).suggestValue(vs.y, y);
}

// helper function to add a bunch of canvas constraints
function addWindowConstraints(slvr, window, xs, ys) {
  var h, w;
  h = window.height;
  w = window.width;
  xs.forEach(function (v) {
    slvr.addConstraint(new c.Inequality(v, c.GEQ, 10));
    slvr.addConstraint(new c.Inequality(v, c.LEQ, w));
  });
  ys.forEach(function (v) {
    slvr.addConstraint(new c.Inequality(v, c.GEQ, 10));
    slvr.addConstraint(new c.Inequality(v, c.LEQ, h));
  });
}

// prefer stays over edits. thus, a point's dimension is free iff the corresponding
// CV is in point.links

function makeStay(cvar, w) {
  return new c.StayConstraint(cvar, c.Strength.strong, w || 1);
}

function addEdit(slvr, cv, w) {
  slvr.addEditVar(cv, c.Strength.weak, w || 1);
}


// function to calculate the intersection of two circles. returns false if the
// circles do not intersect, or a list [x1, y1, x2, y2] otherwise.
// copied and adapted from http://stackoverflow.com/questions/12219802/a-javascript-function-that-returns-the-x-y-points-of-intersection-between-two-ci
function intersection(x0, y0, r0, x1, y1, r1) {
  var a, dx, dy, d, h, rx, ry;
  var x2, y2;

  /* dx and dy are the vertical and horizontal distances between
   * the circle centers.
   */
  dx = x1 - x0;
  dy = y1 - y0;

  /* Determine the straight-line distance between the centers. */
  d = Math.sqrt((dy*dy) + (dx*dx));

  /* Check for solvability. */
  if (d > (r0 + r1)) {
      /* no solution. circles do not intersect. */
      return false;
  }
  if (d < Math.abs(r0 - r1)) {
      /* no solution. one circle is contained in the other */
      return false;
  }

  /* 'point 2' is the point where the line through the circle
   * intersection points crosses the line between the circle
   * centers.
   */

  /* Determine the distance from point 0 to point 2. */
  a = ((r0*r0) - (r1*r1) + (d*d)) / (2.0 * d) ;

  /* Determine the coordinates of point 2. */
  x2 = x0 + (dx * a/d);
  y2 = y0 + (dy * a/d);

  /* Determine the distance from point 2 to either of the
   * intersection points.
   */
  h = Math.sqrt((r0*r0) - (a*a));

  /* Now determine the offsets of the intersection points from
   * point 2.
   */
  rx = -dy * (h/d);
  ry = dx * (h/d);

  /* Determine the absolute intersection points. */
  var xi = x2 + rx;
  var xi_prime = x2 - rx;
  var yi = y2 + ry;
  var yi_prime = y2 - ry;

  return [xi, yi, xi_prime, yi_prime];
}
