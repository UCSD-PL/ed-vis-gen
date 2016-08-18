import S = require('../model/Shapes')
import V = require('../model/Variable')
import U = require('../util/Util')

// type aliases for convenience
type Context = CanvasRenderingContext2D
type Env = Map<V.Variable, number>
type NT = [number, number]
type VT = [V.Variable, V.Variable]

// given a context and shape, draw the shape on the context.
export function drawShape(
  ctx: Context,
  s:S.Shape,
  store: Env
): void {
  // Line | Arrow | Spring | Text | Circle | Rectangle | Image | DragPoint
  if (s instanceof S.Line) {
    drawLine(ctx, s, store)
  } else if (s instanceof S.Arrow) {
    drawArrow(ctx, s, store)
  } else if (s instanceof S.Spring) {
    drawSpring(ctx, s, store)
  } else if (s instanceof S.Text) {
    drawText(ctx, s, store)
  } else if (s instanceof S.Circle) {
    drawCircle(ctx, s, store)
  } else if (s instanceof S.Rectangle) {
    drawRectangle(ctx, s, store)
  } else if (s instanceof S.Image) {
    let img: HTMLImageElement = document.getElementById(s.name) as HTMLImageElement
    drawImage(ctx, s, img, store)
  } else if (s instanceof S.DragPoint) {
    drawDragPoint(ctx, s, store)
  } else {
    console.log('unhandled shape for drawing: ' + s.toString())
    assert(false)
  }

}

// helper function: draw a line between the input points
function _drawLine(
  ctx: Context, // canvas
  points: NT[], // input points
  close?: boolean, // should the line be closed?
  stroke?: string, // stroke color
  fill?: string, // fill color
  dash?: boolean // should the line be dashed?
) {
  close = close || false
  stroke = stroke || "black"
  fill = fill || "rgba(0,0,0,0)"
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

// helper function: draw a triangle between the input points
function _drawTriangle(ctx: Context, points:[NT, NT, NT], stroke: string, fill: string) {
  _drawLine(ctx, points.concat([points[0]]), true, stroke, fill)
}

function _drawCircle(ctx: Context, x: number, y: number, r: number, stroke: string, fill: string) {
  ctx.save()
  ctx.beginPath()
  ctx.fillStyle = fill
  ctx.strokeStyle = stroke

  ctx.arc(x,y,r, 0, 2*Math.PI)

  ctx.fill()
  ctx.stroke()
  ctx.restore()
}

export function _drawArrow(ctx: Context, x: number, y: number, dx: number, dy: number, stroke: string) {
  _drawLine(ctx, [[x,y], [x+dx,y+dy]], false, stroke)

  // arrows are hard, adapted from here:
  // http://www.dbp-consulting.com/tutorials/canvas/CanvasArrow.html
  // x1 = x, y1 = y, x2 = x+dx, y2 = y+dy
  let angle = Math.PI/8 // angle arrowhead makes with line
  let d = 20 // length of arrowhead hypotenuses

  // calculate the angle of the line
  let theta=Math.atan2(dy,dx)
  // h is the line length of a side of the arrow head
  let h=Math.abs(d/Math.cos(angle))
  // angle of top hypotenuse with +X axis
  let angle1=theta+Math.PI+angle
  // x, y coordinates of top corner
  let topx=x+dx+Math.cos(angle1)*h
  let topy=y+dy+Math.sin(angle1)*h
  // same calculations, but for bottom hypotenuse and corner
  let angle2=theta+Math.PI-angle
  let botx=x+dx+Math.cos(angle2)*h
  let boty=y+dy+Math.sin(angle2)*h

  _drawTriangle(ctx, [[x+dx, y+dy], [topx, topy], [botx, boty]], stroke, stroke)
}

// draw a (shape) line
function drawLine(ctx: Context, line: S.Line, store: Env) {
  // we need to give an explicit typing to the map function to get the types to work out...
  let mapper: (t: VT) => NT = ([x, y]) => [store.get(x), store.get(y)]

  let pnts = line.points.map(mapper)
  _drawLine(ctx, pnts, false, line.stroke, "white", false)
}

function drawCircle (ctx: Context, circ: S.Circle, store: Env) {
  let [x, y, r] = U.map3Tup([circ.x, circ.y, circ.r], i => store.get(i))
  _drawCircle(ctx, x, y, r, circ.stroke, "rgba(0,0,0,0)")
}

function drawImage(ctx: Context, i: S.Image, src: HTMLImageElement, store: Env) {
  ctx.save()
  let [x, y, dx, dy] = U.map4Tup([i.x, i.y, i.dx, i.dy], i => store.get(i))
  //x-w/2, y-h/2, w, h
  ctx.drawImage(src, x-dx, y-dy, 2*dx, 2*dy)
  ctx.restore()
}

function drawRectangle(ctx: Context, r: S.Rectangle, store: Env) {
  let [x, y, dx, dy] = U.map4Tup([r.x, r.y, r.dx, r.dy], i => store.get(i))
  let [x1, y1] = [x-dx, y-dy]
  let [x2, y2] = [x+dx, y+dy]
  let topLeft: NT = [x1, y1], topRight: NT = [x2, y1]
  let botRight: NT = [x2, y2], botLeft: NT = [x1, y2]
  _drawLine(ctx, [topLeft, topRight, botRight, botLeft, topLeft], true, r.stroke)
}

function drawArrow(ctx: Context, arr:S.Arrow, store: Env) {

  let [x, y, dx, dy] = U.map4Tup([arr.x, arr.y, arr.dx, arr.dy], i => store.get(i))
  _drawArrow(ctx, x, y, dx, dy, arr.stroke)
}



function drawSpring(ctx: Context, spring:S.Spring, store: Env) {
  ctx.save()
  ctx.strokeStyle = spring.stroke
  ctx.beginPath()

  let [x, y, dx, dy] = U.map4Tup([spring.x, spring.y, spring.dx, spring.dy], i => store.get(i))

  // it's all black magic and really only looks good for horizontal springs
  // intuition: draw a circle and translate over time.
  // circle drawing parameters
  let A = 10
  let tau = Math.PI/50
  let deltay = - A*Math.cos(0)
  let offset = 0
  let IMAX = 1000

  let dist = 10
  let theta = Math.atan2(dy,dx)
  let dx2 = dist*Math.cos(theta)
  let dy2 = dist*Math.sin(theta)
  ctx.lineTo(x,y)
  ctx.lineTo(x + dx2, y + dy2)

  // i == amount of translation
  for (let i = 100; i < IMAX-100; ++i) {
    let p = x + i * (dx-dx2)/IMAX + A*Math.sin(tau*i+offset)
    let q = y + i * (dy-dy2)/IMAX + A*Math.cos(tau*i+offset)
    ctx.lineTo(p, q + deltay)
  }

  ctx.lineTo(x + dx, y + dy)
  ctx.stroke()
  ctx.restore()
}

function drawText(ctx: Context, txt:S.Text, store: Env) {
  let [x, y] = [store.get(txt.x), store.get(txt.y)]

  ctx.save()
  ctx.font = txt.font
  ctx.fillStyle = txt.stroke
  ctx.fillText(txt.text, x, y)
  ctx.restore()

}

function drawDragPoint(ctx: Context, point:S.DragPoint, store: Env) {
  let [x,y,r] = U.map3Tup([point.x, point.y, point.r], i => store.get(i))
  _drawCircle(ctx, x, y, r, point.stroke, point.stroke)
}


// let foo: [number, number] = [1,2,'3']
