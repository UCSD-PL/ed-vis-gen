import M = require('../model/Model')
import VS = require('./Shapes')
import {DISPLAY_ID} from '../util/Util'
import {ICanvas} from 'fabric'

type Context = CanvasRenderingContext2D

export function renderModel(m: M.Model) {
  let mainCanv = document.getElementById(DISPLAY_ID) as HTMLCanvasElement
  let mainCtx = mainCanv.getContext('2d')
  renderState(m.main, mainCtx)
}

// grab the variable values using eval and draw the model's shapes on the canvas
export function renderState(s: M.State, ctx: Context) {
  let vars = s.eval()
  ctx.clearRect(0,0, ctx.canvas.width, ctx.canvas.height)
  s.prog.shapes.forEach(s => {
    VS.drawShape(ctx, s, vars)
  })
}
