import {PhysChart} from '../model/Chart'
import {Variable} from '../model/Variable'
import {Arrow} from '../model/Shapes'
import {_drawArrow} from './Shapes'
import {map4Tup} from '../util/Util'

type Context = CanvasRenderingContext2D
type Env = Map<Variable, number>

// config needs to define:
// ymin, ymax, xmin, xmax, (axes dimensions, e.g. out of 200),
// xtitle, ytitle, (strings), and x,y,h,w (top-left and dimensions)
function drawAxes (ctx: Context, x: number, y: number, h: number, w: number, yMax: number, yMin: number, title: string, stroke?: string) {

  ctx.save();
  ctx.fillStyle = stroke || 'black';
  ctx.beginPath();

  // axes
  ctx.moveTo(x, y + h/2); // x axis
  ctx.lineTo(x + w, y + h/2);
  ctx.moveTo(x + w/2, y); // y axis
  ctx.lineTo(x + w/2, y + h);

  // y ticks
  ctx.moveTo(x + w/2 - 10, y + h/4);
  ctx.lineTo(x + w/2 + 10, y + h/4);

  // y numbering
  ctx.font = "12pt MS Comic Sans"
  ctx.fillText((3*yMax/4 + yMin/4).toFixed(0), x + w/2 + 15, y + h/4 + 5)

  ctx.moveTo(x + w/2 - 10, y + 3*h/4);
  ctx.lineTo(x + w/2 + 10, y + 3*h/4);
  ctx.fillText((3*yMin/4 + yMax/4).toFixed(0), x + w/2 + 15, y + 3*h/4 + 5)


  // y title
  ctx.fillText(title, x + w/2 - 5*title.length, y + h + 20)

  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

export function drawChart(ctx: Context, chart: PhysChart, env: Env) {
  let physValue = chart.eval(env)
  // scale data to axis
  let hCnst = chart.max - chart.min

  // project ymax -> -h, ymin -> h
  let [x, y, h, w] = map4Tup([chart.x, chart.y, chart.h, chart.w], v => env.get(v))
  let dy = 2*h * (1 - (physValue - chart.min)/hCnst) - h

  // axes TODO
  _drawArrow(ctx, x + w/2, y + h/2, 0, dy, chart.stroke)
}
