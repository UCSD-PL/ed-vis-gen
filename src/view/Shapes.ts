import S = require('../model/Shapes')
import V = require('../model/Variable')
import U = require('../util/Util')

// type aliases for convenience
type Context = CanvasRenderingContext2D
type Env = Map<V.Variable, number>

// given a context and shape, draw the shape on the context.
export function drawShape(
  ctx: Context,
  s:S.Shape,
  store: Env
): void {
  // Line | Arrow | Spring | Text | Circle | Rectangle | Image | DragPoint
  let _draw = (shp: S.Shape) => {
    if (s instanceof S.Line) {
      drawLine(ctx, s, store)
    }
  }
}

// helper function: draw a line between the input points
function _drawLine(
  ctx: Context, // canvas
  points: [number, number][], // input points
  close?: boolean, // should the line be closed?
  stroke?: string, // stroke color
  fill?: string, // fill color
  dash?: boolean // should the line be dashed?
) {
  close = close || false
  stroke = stroke || "black"
  fill = fill || "white"
  dash = dash || false

  ctx.save()
  let len = points.length
  if (len <= 1) {
    console.log('bad points argument to line:' + points.toString())
    return
  }

  ctx.fillStyle = fill
  ctx.strokeStyle = stroke
  if (dash) {
    ctx.setLineDash([2,2])
  }
  ctx.beginPath()

  let fst = points[0]
  ctx.moveTo(fst[0],fst[1])

  for (let [x, y] of points.slice(1)) {
    ctx.lineTo(x, y)
  }

  if (close) {
    ctx.fill()
  }
  ctx.stroke()
  ctx.restore()
}

// draw a (shape) line
export function drawLine(ctx: Context, line: S.Line, store: Env) {
  let pnts: [number, number][] = U.tupMap(line.points, store.get)
  _drawLine(ctx, pnts, false, "black", "white", false)
}
