import M = require('../model/Model')
import VS = require('./Shapes')
import {DISPLAY_ID} from '../util/Util'
import {ICanvas} from 'fabric'
import {Variable} from '../model/Variable'

type Context = CanvasRenderingContext2D

// grab the variable values using eval and draw the model's shapes on the canvas
export function renderState(s: M.State, canvas: ICanvas, plotCanv?: ICanvas) {
  let vars = s.eval()
  // canvas.clear()

  let ctx = canvas.getContext()
  ctx.clearRect(0,0, canvas.getWidth(), canvas.getHeight())
  s.prog.shapes.forEach(s => {
    VS.drawShape(ctx, s, vars)
  })

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
