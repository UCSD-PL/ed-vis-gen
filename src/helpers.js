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
  var dx = x - iPoint.x;
  var dy = y - iPoint.y;
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
function sqrtSquaredSum() {
  return Math.sqrt(arguments.reduce(function(s, next) {
    return s + (next * next);
  }));
}
