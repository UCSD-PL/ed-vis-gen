
import M = require('../model/Model')
import Var = require('../model/Variable')
import S = require('../model/Shapes')
import {renderState} from '../view/View'
import {Point, assert, filter} from '../util/Util'
import Main = require('../main')
import {ICanvas, IEvent} from 'fabric'


function makePoint(e: MouseEvent): Point { return {x: e.clientX, y: e.clientY} }
function pointFromDrag(d: S.DragPoint, s: M.Store): Point {
  let [x, y] = s.getValues([d.x, d.y])
  return {x: x, y: y}
}

function overlap({x: lx, y:ly}: Point, {x: rx, y:ry}: Point, thresh?: number) {
  thresh = thresh || 100
  let [dx, dy] = [Math.abs(lx - rx), Math.abs(ly - ry)]
  return (dx*dx + dy*dy) <= thresh
}



export class DragController {

  // simulation mode == false =>  DragController handles wrapped MouseEvents
  // simulation mode == true =>   DragController handles events with clientX and clientY (unwrapped events)
  constructor(public m: M.Model, public receiver: ICanvas, private simulationMode: boolean) {

    this.enableDrags()
  }

  public enableDrags() {
    let mainCanv = this.receiver
    mainCanv.on("mouse:down", e => this.handleLeftClick(e))
    mainCanv.on("mouse:move", e => this.handleMove(e))
    mainCanv.on("mouse:up", e => this.handleRelease(e))

    // mainCanv.style.cursor = 'default';
    mainCanv.setCursor('default')
  }

  // return an optional point. if the event should not be handled, return null.
  private convertEvent(e: IEvent): Point {
    // let event = e.e as MouseEvent
    // let rect = this.receiver.getBoundingRect()
    // let [dx, dy] = [-rect.left, -rect.top]
    // return {x: event.x + dx, y: event.y + dy}
    // assert(e.e instanceof MouseEvent, 'tried to convert event that wasnt mouseclick:' + e.toString())

    let ret: Point
    if (e.e instanceof MouseEvent && !this.simulationMode) {
      ret = this.receiver.getPointer(e.e as MouseEvent)
    } else if (this.simulationMode) {
      let eAny = e as any
      if ('clientX' in eAny && 'clientY' in eAny) {
        ret = {x: eAny.clientX, y: eAny.clientY}
      } else {
        // console.log('unrecognized event:')
        // console.log(e)
        // assert(false)
      }
      // assert('clientX' in eAny && 'clientY' in eAny, 'expected point-like argument to convert event:' + e.toString())
    } else {
      // nothing
    }
    return ret
  }

  private handleLeftClick(e: IEvent) {
    let p = this.convertEvent(e)
    // console.log("click at: ")
    // console.log(p)
    if (p) {
      let drags: Set<S.DragPoint> =
      filter(this.m.main.prog.shapes, s => s instanceof S.DragPoint) as Set<S.DragPoint>
      for (let d of drags) {
        // console.log("drag at: ")
        // console.log(d)
        if (overlap(p, pointFromDrag(d, this.m.main.store))) {
          // console.log("clicked:")
          // console.log(d)
          // this.m.main.prog.printShapes()
          // console.log("drag frees:")
          // console.log(this.m.main.prog.allFrees.get(d))
          this.m.main.draggedPoint = d
          this.m.main.dragging = true

          this.m.main.stop()
          break
        }
      }
    }

  }

  private handleMove(e: IEvent) {
    let p = this.convertEvent(e)
    if (p && this.m.main.dragging) {
      // suggest value for x and y
      // gross...refactor or something idk
      let [x,y] = [this.m.main.draggedPoint.x, this.m.main.draggedPoint.y]
      let edits = (new Map<Var.Variable, number>()).set(x, p.x).set(y, p.y)
      // console.log('edits:')
      // console.log(edits)
      this.m.main.store.suggestEdits(edits, this.m.main.prog.allFrees.get(this.m.main.draggedPoint))
      // redraw
      renderState(this.m.main, this.receiver)
    }
  }

  private handleRelease(e: IEvent) {
    let p = this.convertEvent(e)
    // release!
    if (p && this.m.main.dragging) {
      // just state change
      this.m.main.draggedPoint = null // TODO: option monad
      this.m.main.dragging = false

      this.m.main.start()
    }
  }



}
