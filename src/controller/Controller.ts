
import M = require('../model/Model')
import Var = require('../model/Variable')
import S = require('../model/Shapes')
import V = require('../view/View')
import U = require('../util/Util')
import Main = require('../main')

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

export class ButtonController {
  constructor() {
    let buttonIDs = ['addRect', 'addImage', 'addSpring', 'addArrow', 'addCircle', 'addLine']
    let builders: {(st: M.State): M.State;}[] = [
      ButtonController.addRect, ButtonController.addImage, ButtonController.addSpring, ButtonController.addArrow, ButtonController.addCircle, ButtonController.addLine
    ]
    U.zip(buttonIDs, builders).forEach(([id, f]) => {
      document.getElementById(id).onclick = () => {
        let newState = f(Main.initModel.main)
        Main.initModel = new M.Model(newState)
        Main.refresh()
      }
    })
  }




  static addLine(s: M.State, numPoints?: number): M.State {
    numPoints = numPoints || 2
    let delta = 50
    let [x, y] = [50, 50]
    let points: [Var.Variable, Var.Variable][] = []
    for (let i = 0; i < numPoints; ++i) {
      let newPoint = [s.allocVar(x, "LX"), s.allocVar(y, "LY")] as [Var.Variable, Var.Variable]
      points.push(newPoint)
      x += delta
      y += delta
    }

    return s.addShape(new S.Line(points, "black", false))
  }

  static addSpring(s: M.State): M.State{
    let delta = 50
    let [x, y, dx, dy] = [50, 50, delta, delta]
    let [sx, sy, sdx, sdy] = [s.allocVar(x, "LX"), s.allocVar(y, "LY"), s.allocVar(dx, "LDX"), s.allocVar(dy, "LDY")]

    return s.addShape(new S.Spring(sx, sy, sdx, sdy, "black"))
  }

  static addArrow(s: M.State): M.State{
    let delta = 50
    let [x, y, dx, dy] = [50, 50, delta, delta]
    let [sx, sy, sdx, sdy] = [s.allocVar(x, "LX"), s.allocVar(y, "LY"), s.allocVar(dx, "LDX"), s.allocVar(dy, "LDY")]

    return s.addShape(new S.Arrow(sx, sy, sdx, sdy, "black"))
  }

  static addCircle(s: M.State): M.State{
    let delta = 50
    let [x, y, r] = [50, 50, delta]
    let [sx, sy, sr] = [s.allocVar(x, "CX"), s.allocVar(y, "CY"), s.allocVar(r, "SR")]

    return s.addShape(new S.Circle(sx, sy, sr, "black", "rgba(0,0,0,0)"))
  }

  static addRect(s: M.State): M.State{
    let delta = 50
    let [x, y, dx, dy] = [50, 50, delta, delta]
    let [sx, sy, sdx, sdy] = [s.allocVar(x, "LX"), s.allocVar(y, "LY"), s.allocVar(dx, "LDX"), s.allocVar(dy, "LDY")]

    return s.addShape(new S.Rectangle(sx, sy, sdx, sdy, "black"))
  }

  static addImage(s: M.State, name?: string): M.State{
    name = name || prompt('Input image name:')
    let delta = 50
    let [x, y, dx, dy] = [50, 50, delta, delta]
    let [sx, sy, sdx, sdy] = [s.allocVar(x, "LX"), s.allocVar(y, "LY"), s.allocVar(dx, "LDX"), s.allocVar(dy, "LDY")]

    return s.addShape(new S.Image(sx, sy, sdx, sdy, name, "black"))
  }

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
