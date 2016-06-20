
import M = require('../model/Model')
import Var = require('../model/Variable')
import S = require('../model/Shapes')
import V = require('../view/View')
import U = require('../util/Util')

type Point = U.Point

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
  constructor(public m: M.Model, public receiver: HTMLElement) {

    this.enableDrags()
  }

  public enableDrags() {
    let mainCanv = document.getElementById('mainCanvas') as HTMLCanvasElement
    let mouseEvents = ["mousedown", "mouseup", "mousemove"]
    mainCanv.addEventListener("mousedown", e => this.handleLeftClick(e))
    mainCanv.addEventListener("mousemove", e => this.handleMove(e))
    mainCanv.addEventListener("mouseup", e => this.handleRightClick(e))

    mainCanv.style.cursor = 'default';
  }

  private convertEvent(e: MouseEvent): Point {
    let rect = this.receiver.getBoundingClientRect()
    let [dx, dy] = [-rect.left, -rect.top]
    return {x: e.x + dx, y: e.y + dy}
  }

  private handleLeftClick(e: MouseEvent) {
    let p = this.convertEvent(e)
    // console.log("click at: ")
    // console.log(p)
    let drags: Set<S.DragPoint> =
      U.filter(this.m.main.prog.shapes, s => s instanceof S.DragPoint) as Set<S.DragPoint>
    for (let d of drags) {
      // console.log("drag at: ")
      // console.log(d)
      if (overlap(p, pointFromDrag(d, this.m.main.store))) {
        // console.log("clicked:")
        // console.log(d)
        // console.log("drag frees:")
        // console.log(this.m.main.prog.allFrees.get(d))
        this.m.main.draggedPoint = d
        this.m.main.dragging = true
        break
      }
    }

  }

  private handleMove(e: MouseEvent) {
    let p = this.convertEvent(e)
    if (this.m.main.dragging) {
      // suggest value for x and y
      // gross...refactor or something idk
      let [x,y] = [this.m.main.draggedPoint.x, this.m.main.draggedPoint.y]
      let edits = (new Map<Var.Variable, number>()).set(x, p.x).set(y, p.y)
      // console.log('edits:')
      // console.log(edits)
      this.m.main.store.suggestEdits(edits, this.m.main.prog.allFrees.get(this.m.main.draggedPoint))
      // redraw
      V.renderModel(this.m)
    }
  }

  private handleRightClick(e: MouseEvent) {
    let p = this.convertEvent(e)
    // release!
    if (this.m.main.dragging) {
      // just state change
      this.m.main.draggedPoint = null // TODO: option monad
      this.m.main.dragging = false
    }
  }



}
