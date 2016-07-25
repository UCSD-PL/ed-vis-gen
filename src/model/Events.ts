
import {ICanvas} from 'fabric'
import {Point} from '../util/Util'
// helper functions for dispatching events to a canvas
// fire a mouse event at a particular target
function triggerME(receiver: ICanvas, name: string, point: Point) {
  let type = 'mouse:' + name
  let options = {
      bubbles: true,
      cancelable: (type != "mouse:move"),
      view: window,
      detail: 0,
      screenX: point.x,
      screenY: point.y,
      clientX: point.x,
      clientY: point.y,
      ctrlKey: false,
      altKey: false,
      shiftKey: false,
      metaKey: false,
      button: 1
  }

  return receiver.trigger(type, options)
}

// mouse events (parameterized at a point) for mouseup, mousedown, and drags
export function triggerMU(receiver: ICanvas, point: Point) {
  return triggerME(receiver, "up", point);
}
export function triggerMD(receiver: ICanvas, point: Point) {
  return triggerME(receiver, "down", point);
}
export function triggerMM(receiver: ICanvas, point: Point) {
  return triggerME(receiver, "move", point);
}
