import M = require('../model/Model')
import {drawShape} from './Shapes'
import {DISPLAY_ID, partSet} from '../util/Util'
import {ICanvas} from 'fabric'
import {Variable} from '../model/Variable'
import {DragPoint, Shape} from '../model/Shapes'

type Context = CanvasRenderingContext2D

// grab the variable values using eval and draw the model's shapes on the canvas
export function renderState(s: M.State, canvas: ICanvas, plotCanv?: ICanvas) {
  let vars = s.eval()
  // canvas.clear()

  let ctx = canvas.getContext()
  ctx.clearRect(0,0, canvas.getWidth(), canvas.getHeight())
  let [normal, drags] = partSet(s.prog.shapes, s => s instanceof DragPoint)
  // s.prog.shapes.forEach(s => {
  //   VS.drawShape(ctx, s, vars)
  // })

  const drawer = (s: Shape) => drawShape(ctx, s, vars)
  normal.forEach(drawer)
  drags.forEach(drawer)
  // let plotCtx = plotCanv.getContext()
  // plotCtx.clearRect(0,0, plotCanv.getWidth(), plotCanv.getHeight())
  // let [x, y, h, w] = [0, 0, 150, 150]
  // s.plots.forEach(plot => {
  //   let [px, py, ph, pw] = [plot.x, plot.y, plot.h, plot.w]
  //   let plotDims = new Map<Variable, number>().set(px, x).set(py, y).set(ph, h).set(pw, w)
  //   s.store.suggestEdits(plotDims, new Set([px, py, ph, pw]))
  //
  // });
}
