
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
