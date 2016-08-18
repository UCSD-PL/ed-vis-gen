
import {PhysExpr, evalPhysicsExpr} from './PhysicsExpr'
import {Variable} from './Variable'



// class for one-dimensional charts -- plot the instantaneous magnitude of
// some physical expr. we linearly scale the physics expr's value to the canvas
// height of the chart object.

// configuration options:
type ChartConfig = {
  min: number, // minimum and maximum values expected for the physics expresion
  max: number,
  xTitle: string,
  yTitle: string
}
export class PhysChart {
  constructor(
    public x: Variable, public y: Variable, // coordinates of top-left of chart
    public h: Variable, public w: Variable, // height and width of chart
    public min: number, public max: number, // min and max value of physics expression
    public expr: PhysExpr, // expression to plot
    public title: string, // name of plot
    public stroke: string // arrow stroke
  ) {}

  public eval(store: Map<Variable, number>) {
    return evalPhysicsExpr(store, this.expr)
  }
}

// export class VecChart(x, y, h, w, config, stroke, simple) {
//   return {
//     x: x,
//     y: y,
//     dx: 0,
//     dy: 0,
//     h: h,
//     w: w,
//     stroke: stroke,
//     config: config, // record holding ymin, ymax, xmin, xmax, xtitle, ytitle
//     // takes input of the form {x: val, y: val}
//     record: function(data) { with (this) {
//
//       // scale data to axis
//       var hCnst = (config.ymax-config.ymin);
//       dy = 2*h * (1 - (data.y - config.ymin)/hCnst) - h;
//       // ymax -> -h, ymin -> h
//     }},
//     draw: function(ctx) { with (this) {
//       //draw labels, plot vector at center w/ dy, dx
//       // TODO
//       var plotConfig = _.extend(config, {
//         x: x, y: y, h: h, w: w
//       });
//       Plot.drawAxes(ctx, plotConfig);
//       // Arrow(x, y, dx, dy, color)
//
//       Arrow(x + w/2, y + h/2, dx, dy, stroke).draw(ctx);
//
//     }}
//   }
// }
