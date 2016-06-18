// for encapsulation purposes, we use a wrapper over mouse events.
// this file defines the internals of the wrapper, as well as conversion
// functions from vanilla JS events to the wrapped events.

// for now, we only retain the positional fields of events, plus the button
function eddieME(type, x, y, button) {
  return new CustomEvent("eddie" + type, {
    detail: {
      x: x,
      y: y,
      button: button
    }
  });
}

function wrapEvent(e, offset) {
  offset = offset || {dx: 0, dy: 0};
  return eddieME(e.type, e.clientX + offset.dx, e.clientY + offset.dy, e.button);
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

// pulled from http://marcgrabanski.com/simulating-mouse-click-events-in-javascript/
// create a mouse event
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
  return wrapEvent(mouseEvent(type, point.x, point.y, point.x, point.y));
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


// add wrappers for eddie-style events
// receiver should be a canvas of some sort
// (e.g. doc.getElementById('mainCanvas'))
function addEddieWrappers(receiver) {
  var offset = receiver.getBoundingClientRect();
  offset = {dx: -offset.left, dy: -offset.top};

  receiver.addEventListener("mousedown", function (e) {
      var evnt = wrapEvent(e, offset);
      // console.log('clicked at: ' +  evnt.detail.x + ", " + evnt.detail.y);
      dispatchEvent(receiver, evnt);
    }, true);
  receiver.addEventListener("mouseup", function (e) {
      dispatchEvent(receiver, wrapEvent(e, offset));
    }, true);
  receiver.addEventListener("mousemove", function (e) {
      dispatchEvent(receiver, wrapEvent(e, offset));
    }, true);
}
