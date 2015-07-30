
// Pushes a variable number of arguments to an array.
// Despite the function signature, the intended use is
// push([foo], bar, baz, boo, bob) => [foo, bar, baz, boo, bob].
// Modifies the array in place, unfortunately.
function push(arr) {
  for (var i = 1; i < arguments.length; ++i) {
    arr.push(arguments[i]);
  }
}
