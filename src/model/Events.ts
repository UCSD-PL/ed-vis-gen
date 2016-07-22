
import {ICanvas} from 'fabric'
import {Point} from '../util/Util'
// helper functions for building mouse events and dispatching events to a canvas



// build a mouse event at a particular target
function generateME(receiver: ICanvas, name: string, point: Point) {
  let options = {} //options || {}
  // function mouseEvent(type, sx, sy, cx, cy) {
  //   var evt;
  //   var e = {
  //     bubbles: true,
  //     cancelable: (type != "mousemove"),
  //     view: window,
  //     detail: 0,
  //     screenX: sx,
  //     screenY: sy,
  //     clientX: cx,
  //     clientY: cy,
  //     ctrlKey: false,
  //     altKey: false,
  //     shiftKey: false,
  //     metaKey: false,
  //     button: 0,
  //     relatedTarget: undefined
  //   };
  //   if (typeof( document.createEvent ) == "function") {
  //     evt = document.createEvent("MouseEvents");
  //     evt.initMouseEvent(type,
  //       e.bubbles, e.cancelable, e.view, e.detail,
  //       e.screenX, e.screenY, e.clientX, e.clientY,
  //       e.ctrlKey, e.altKey, e.shiftKey, e.metaKey,
  //       e.button, document.body.parentNode);
  //   } else if (document.createEventObject) {
  //     evt = document.createEventObject();
  //     for (prop in e) {
  //     evt[prop] = e[prop];
  //   }
  //     evt.button = { 0:1, 1:4, 2:2 }[evt.button] || evt.button;
  //   }
  //   return evt;
  // }
  let opt = Object.assign({}, options)
  Object.assign(opt, {x: point.x, y: point.y})
  return receiver.trigger("mouse:" + name, opt)
}

// mouse events (parameterized at a point) for mouseup, mousedown, and drags
function generateMU(receiver: ICanvas, point: Point) {
  return generateME(receiver, "up", point);
}
function generateMD(receiver: ICanvas, point: Point) {
  return generateME(receiver, "down", point);
}
function generateMM(receiver: ICanvas, point: Point) {
  return generateME(receiver, "move", point);
}
