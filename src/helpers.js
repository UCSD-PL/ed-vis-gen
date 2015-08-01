
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
