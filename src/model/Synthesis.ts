import {Variable, CassVar} from './Variable'
import {Program} from './Model'
import * as S from './Shapes'
import {copy, Point, Tup, exists, flatMap, assert} from '../util/Util'
import {Expression} from 'cassowary'


// go from Program -> a set of points and their cass expressions. so, we need to:
// build a bunch of points, a bunch of corresponding cass expressions, and a map
// including the new variables.
type PExpr = Tup<CassVar, Expression>

export class PointGeneration {
  private _vars: Map<CassVar, number>
  constructor(vars: Map<Variable, number>) {
    this._vars = new Map<CassVar, number>()
    for (let [k, v] of vars)
      if (k instanceof CassVar)
        this._vars.set(k, v)
  }

  // lift a variable to an expression
  private static liftVar(v: CassVar): Expression {
    return Expression.fromVariable(v._value)
  }
  private alloc(v: number): CassVar {
    let prefix = "CV"
    let suffix = 0
    while (exists(this._vars, ([k, v]) => k.name== (prefix + suffix.toString())))
      ++suffix

    let newVar = new CassVar(prefix + suffix.toString(), v)
    this._vars.set(newVar, v)
    return newVar
  }
  // given two vars and exprs, build a middle var/expr
  private between(l: PExpr, r: PExpr): PExpr {
    // alloc a new variable,
    let [lcv, le] = l
    let [rcv, re] = r
    let [lv, rv] = [this._vars.get(lcv), this._vars.get(rcv)]
    let newVar = this.alloc((lv + rv)/2)
    let newExp = le.plus(re).divide(2)
    return [newVar, newExp]
  }

  // given a base and a delta, return the end
  private from(base: PExpr, delta: PExpr): PExpr {
    let [bCV, bE] = base
    let [deltaCV, deltaE] = delta
    let [bV, deltaV] = [this._vars.get(bCV), this._vars.get(deltaCV)]
    let newVar = this.alloc(bV + deltaV)
    let newExp = bE.plus(deltaE)
    return [newVar, newExp]
  }

  // monadic plus...huehuehue
  private mPlus(
    l: Tup<PExpr, PExpr>,
    r: Tup<PExpr, PExpr>,
    builder: {(fst: PExpr, snd: PExpr): PExpr}): Tup<PExpr, PExpr> {
    let [x1, y1] = l
    let [x2, y2] = r
    return [builder.bind(this)(x1, x2), builder.bind(this)(y1, y2)]
  }

  // given two points, return a midpoint
  private midPoint( l: Tup<PExpr, PExpr>, r: Tup<PExpr, PExpr> ): Tup<PExpr, PExpr> {
    return this.mPlus(l, r, this.between)
  }
  // given a point and two deltas, return the next point
  private plusPoint( base: Tup<PExpr, PExpr>, delta: Tup<PExpr, PExpr>): Tup<PExpr, PExpr> {
    return this.mPlus(base, delta, this.from)
  }

  private negate(v: PExpr): PExpr {
    let nv = this.alloc(this._vars.get(v[0]) * -1)
    let ne = v[1].times(-1)
    return [nv, ne]
  }
  // given a shape, return the points
  private shapePoints(s: S.Shape): Set<Tup<PExpr, PExpr>> {
    let ret: Set<Tup<PExpr, PExpr>>
    if (s instanceof S.Line) {
      ret = this.linePoints(s)
    } else if (s instanceof S.Arrow || s instanceof S.Spring) {
      ret = this.vectPoints(s)
    } else if (s instanceof S.Circle || s instanceof S.DragPoint) {
      ret = this.circPoints(s)
    } else if (s instanceof S.Rectangle || s instanceof S.Image) {
      ret = this.rectPoints(s)
    }  else {
      console.log('unhandled shape for drawing: ' + s.toString())
      assert(false)
    }

    return ret
  }

  // TODO: this creates shared variable references. clone if necessary
  private static toPoint(x: Variable, y: Variable): Tup<PExpr, PExpr> {
    assert(x instanceof CassVar)
    assert(y instanceof CassVar)
    let hd: PExpr = [x as CassVar, PointGeneration.liftVar(x as CassVar)]
    let tl: PExpr = [y as CassVar, PointGeneration.liftVar(y as CassVar)]
    return [hd, tl]
  }

  private _line(start: Tup<Variable, Variable>, finish: Tup<Variable, Variable>): Set<Tup<PExpr, PExpr>> {
    let [x1, y1] = start
    let [x2, y2] = finish
    let begin = PointGeneration.toPoint(x1, y1)
    let end = PointGeneration.toPoint(x2, y2)
    let mid = this.midPoint(begin, end)
    let ret = new Set<Tup<PExpr, PExpr>>()
    return ret.add(begin).add(end).add(mid)
  }

  private static TODO = new Set<Tup<PExpr, PExpr>>()
  private linePoints(s: S.Line): Set<Tup<PExpr, PExpr>> {
    // beginning, middle, and end
    let begin = s.points[0]
    let end = s.points[1]
    return this._line(begin, end)
  }
  private vectPoints(s: S.VecLike): Set<Tup<PExpr, PExpr>> {
    let begin = PointGeneration.toPoint(s.x, s.y)
    let delta = PointGeneration.toPoint(s.dx, s.dy)
    let next = this.plusPoint(begin, delta)
    let mid = this.midPoint(begin, next)
    return (new Set<Tup<PExpr, PExpr>>()).add(begin).add(next).add(mid)
  }
  private circPoints(s: S.Circle | S.DragPoint): Set<Tup<PExpr, PExpr>> {
    let [x, y] = PointGeneration.toPoint(s.x, s.y)
    assert(s.r instanceof CassVar)
    let r:PExpr = [s.r as CassVar, PointGeneration.liftVar(s.r as CassVar)]
    let mr = this.negate(r)
    let ret = new Set<Tup<PExpr, PExpr>>()
    ret.add([x, y])
       .add([x, this.from(y, r)]).add([x, this.from(y, mr)])
       .add([this.from(x, r), y]).add([this.from(x, mr), y])

    return ret
  }
  private rectPoints(s: S.RecLike): Set<Tup<PExpr, PExpr>> {
    let [x, y] = PointGeneration.toPoint(s.x, s.y)
    let [dx, dy] = PointGeneration.toPoint(s.dx, s.dy)
    let [mdx, mdy] = [this.negate(dx), this.negate(dy)]
    let ret = new Set<Tup<PExpr, PExpr>>()
    ret.add([x, y]) // center
       .add([x, this.from(y, dy)]).add([x, this.from(y, mdy)]) // middle lines
       .add([this.from(x, dx), y]).add([this.from(x, mdx), y])
       .add([this.from(x, dx), this.from(y, dy)]).add([this.from(x, mdx), this.from(y, dy)]) // endpoints
       .add([this.from(x, dx), this.from(y, mdy)]).add([this.from(x, mdx), this.from(y, mdy)])

    return ret
  }
  public makePoints(p: Program): Set<Tup<PExpr, PExpr>> {
    // console.log(p)
    return flatMap(p.shapes, e => this.shapePoints(e))
  }
}
