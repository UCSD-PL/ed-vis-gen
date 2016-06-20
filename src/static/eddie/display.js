// library functions for displaying interactions

// given a function, a length of time (in milliseconds), and a resolution, space the function's calls
// equally over the resolution. the function will receive the current resolution step
// as an argument. if shouldStop is true, the function will stop being called after
// resolution steps.
function scheduleCalls(work, time, resolution, Κ, shouldStop) {
  var i = 0;
  var calls = setInterval(function() {
        requestAnimFrame(function() {
          work(i);
          ++i;
        });
        if (shouldStop && i > resolution) { // stop incrementing if done
          clearInterval(calls);
          Κ()
        }
      }, time/resolution
    );
  return calls;

}

// given a callback, a circle, and a resolution, invoke the callback at equally
// spaced points along the circle. the callback is passed the x-y coordinates as
// an object.

function circularInvoke(Κ, circ, resolution, i) {
  var theta = i*Math.PI * 2/resolution;
  var x = circ.x + circ.r * Math.cos(theta);
  var y = circ.y + circ.r * Math.sin(theta);
  Κ({x: x, y: y});

}


// same as above, but for a line instead of a circle
function lineInvoke(Κ, start, end, resolution, i) {
  var dx = end.x - start.x;
  var dy = end.y - start.y;
  var x = start.x + dx/resolution*i;
  var y = start.y + dy/resolution*i;
  Κ({x: x, y: y});
}

// given a center point and a receiver for events, click on the center,
// drag to the start of a circle, drag a circle, and release.

function circularSim(offset, point, receiver) {

  var circResolution = 25;
  var circDuration = 1000;
  var r = 25;
  var deltaX = 0; // offset.left
  var deltaY = 0; // offset.top

  var cdelta = 20;
  cursor = Image(point.x + cdelta/2-5, point.y + cdelta/2 -2, cdelta, cdelta, "mouse"); // height, width
  all_objects.push(cursor);

  var newPoint = {x: point.x + deltaX, y: point.y + deltaY};
  dispatchEvent(receiver, generateMD(newPoint)); // click on the point


  return scheduleCalls(function (i) {
    circularInvoke( function(p) {
          cursor.x = p.x - deltaX + cdelta/2 - 5;
          cursor.y = p.y - deltaY + cdelta/2 - 2;
          dispatchEvent(receiver, generateMM(p)); // drag around the circle
        },
        {x: newPoint.x, y: newPoint.y, r: r},
        circResolution,
        i
      );
    }, circDuration, circResolution, function() {}, false
  );

}
