import M = require('../model/Model')
import VS = require('./Shapes')
import {DISPLAY_ID} from '../util/Util'
import {ICanvas} from 'fabric'

type Context = CanvasRenderingContext2D

// grab the variable values using eval and draw the model's shapes on the canvas
export function renderState(s: M.State, canvas: ICanvas) {
  let vars = s.eval()
  // canvas.clear()

  let ctx = canvas.getContext()
  ctx.clearRect(0,0, canvas.getWidth(), canvas.getHeight())
  s.prog.shapes.forEach(s => {
    VS.drawShape(ctx, s, vars)
  })
}
