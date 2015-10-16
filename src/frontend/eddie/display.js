// library functions for displaying interactions

// pulled from http://marcgrabanski.com/simulating-mouse-click-events-in-javascript/
// simulate a generic mouse event
// expects type ∈ {"mousemove", "click", "mouseup", "mousedown"}
// sx, sy, cx, cy ∈ nats
// example: mouseEvent("click", 1, 50, 1, 50);
function mouseEvent(type, sx, sy, cx, cy) {
  var evt;
  var e = {
    bubbles: true,
    cancelable: (type != "mousemove"),
    view: window,
    detail: 0,
    screenX: sx,
    screenY: sy,
    clientX: cx,
    clientY: cy,
    ctrlKey: false,
    altKey: false,
    shiftKey: false,
    metaKey: false,
    button: 0,
    relatedTarget: undefined
  };
  if (typeof( document.createEvent ) == "function") {
    evt = document.createEvent("MouseEvents");
    evt.initMouseEvent(type,
      e.bubbles, e.cancelable, e.view, e.detail,
      e.screenX, e.screenY, e.clientX, e.clientY,
      e.ctrlKey, e.altKey, e.shiftKey, e.metaKey,
      e.button, document.body.parentNode);
  } else if (document.createEventObject) {
    evt = document.createEventObject();
    for (prop in e) {
    evt[prop] = e[prop];
  }
    evt.button = { 0:1, 1:4, 2:2 }[evt.button] || evt.button;
  }
  return evt;
}

// build a mouse event at a particular target
function generateME(type, point) {
  return mouseEvent(type, point.x, point.y, point.x, point.y);
}

// mouse events (parameterized at a point) for mouseup, mousedown, and drags
function generateMU(point) {
  return generateME("mouseup", point);
}
function generateMD(point) {
  return generateME("mousedown", point);
}
function generateMM(point) {
  return generateME("mousemove", point);
}

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

function circularSim(point, receiver) {

  var lineResolution = 20;
  var lineDuration = 200;
  var circResolution = 50;
  var circDuration = 1000;
  var r = 40;

  dispatchEvent(receiver, generateMD(point)); // click on the point

  scheduleCalls(function(i){
    lineInvoke(function(point) {
          dispatchEvent(receiver, generateMM(point)); // drag to the start
        },
        point,
        {x: point.x + r, y: point.y},
        lineResolution,
        i
      );
    }, lineDuration, lineResolution, function() {
    scheduleCalls(function (i) {
      circularInvoke( function(point) {
            dispatchEvent(receiver, generateMM(point)); // drag around the circle
          },
          {x: point.x, y: point.y, r: r},
          circResolution,
          i
        );
      }, circDuration, circResolution, function() {}, false
    )}, true);

}

// trigger generic event to target
function dispatchEvent (el, evt) {
  if (el.dispatchEvent) {
    el.dispatchEvent(evt);
  } else if (el.fireEvent) {
    el.fireEvent('on' + type, evt);
  }
  return evt;
}
