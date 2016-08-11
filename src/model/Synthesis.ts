import {Variable, CassVar} from './Variable'
import {Program, State} from './Model'
import {Shape, Line, Spring, Arrow, Circle, DragPoint, Rectangle, VecLike, RecLike, Image, pp} from './Shapes'
import {uniqify, map, uniq, overlap, extendMap, copy, Point, Tup, exists, flatMap, assert, intersect, find, toMap, forall, filter, partMap, map2Tup, union} from '../util/Util'
import {Expression, Equation, Constraint, Strength} from 'cassowary'

import {Expr, Eq} from './Expr'

// go from Program -> a set of points and their cass expressions. so, we need to:
// build a bunch of points, a bunch of corresponding cass expressions, and a map
// including the new variables.
type PExpr = Tup<CassVar, Expr>

export class PointGeneration {
  private _vars: Map<CassVar, number>
  constructor(vars: Map<Variable, number>) {
    this._vars = new Map<CassVar, number>()
    for (let [k, v] of vars)
      if (k instanceof CassVar)
        this._vars.set(k, v)
  }

  private alloc(v: number): CassVar {
    let prefix = "PGV"
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
    let newExp = le.plus(re).div(2)
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
    // console.log('before:')
    // console.log(v[1].toString())
    let ne = v[1].times(-1)
    // console.log(ne.toString())
    return [nv, ne]
  }
  // given a shape, return the points
  private shapePoints(s: Shape): Set<Tup<PExpr, PExpr>> {
    let ret: Set<Tup<PExpr, PExpr>>
    if (s instanceof Line) {
      ret = this.linePoints(s)
    } else if (s instanceof Arrow || s instanceof Spring) {
      ret = this.vectPoints(s)
    } else if (s instanceof Circle || s instanceof DragPoint) {
      ret = this.circPoints(s)
    } else if (s instanceof Rectangle || s instanceof Image) {
      ret = this.rectPoints(s)
    }  else {
      console.log('unhandled shape for drawing: ' + s.toString())
      assert(false)
    }

    return ret
  }

  // TODO: this creates shared variable references. clone if necessary
  private toPoint(x: Variable, y: Variable): Tup<PExpr, PExpr> {
    assert(x instanceof CassVar)
    assert(y instanceof CassVar)
    let hd: PExpr = [x as CassVar, Expr.fromVar(x as CassVar)]
    let tl: PExpr = [y as CassVar, Expr.fromVar(y as CassVar)]
    return [hd, tl]
  }

  private _line(start: Tup<Variable, Variable>, finish: Tup<Variable, Variable>): Set<Tup<PExpr, PExpr>> {
    let [x1, y1] = start
    let [x2, y2] = finish
    let begin = this.toPoint(x1, y1)
    let end = this.toPoint(x2, y2)
    let mid = this.midPoint(begin, end)
    let ret = new Set<Tup<PExpr, PExpr>>()
    return ret.add(begin).add(end).add(mid)
  }

  private static TODO = new Set<Tup<PExpr, PExpr>>()
  private linePoints(s: Line): Set<Tup<PExpr, PExpr>> {
    // beginning, middle, and end
    let begin = s.points[0]
    let end = s.points[1]
    return this._line(begin, end)
  }
  private vectPoints(s: VecLike): Set<Tup<PExpr, PExpr>> {
    let begin = this.toPoint(s.x, s.y)
    let delta = this.toPoint(s.dx, s.dy)
    let next = this.plusPoint(begin, delta)
    let mid = this.midPoint(begin, next)
    return (new Set<Tup<PExpr, PExpr>>()).add(begin).add(next).add(mid)
  }
  private circPoints(s: Circle | DragPoint): Set<Tup<PExpr, PExpr>> {
    let [x, y] = this.toPoint(s.x, s.y)
    assert(s.r instanceof CassVar)
    let r:PExpr = [s.r as CassVar, Expr.fromVar(s.r as CassVar)]
    let mr = this.negate(r)
    let ret = new Set<Tup<PExpr, PExpr>>()
    ret.add([x, y])

    if (s instanceof Circle) {
      ret.add([x, this.from(y, r)]).add([x, this.from(y, mr)])
         .add([this.from(x, r), y]).add([this.from(x, mr), y])
    }

    return ret
  }
  private rectPoints(s: RecLike): Set<Tup<PExpr, PExpr>> {
    let [x, y] = this.toPoint(s.x, s.y)
    let [dx, dy] = this.toPoint(s.dx, s.dy)
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
    // console.log('building points: for ' + p.shapes.size.toString() + ' shapes:')
    let ret = new Set<Tup<PExpr, PExpr>>()
    // let ret = flatMap(p.shapes, e => this.shapePoints(e))
    for (let shape of p.shapes) {
      ret = union(ret, this.shapePoints(shape))
    }
    // console.log(ret.size.toString() + ' points')
    return ret
  }

  public eval(): Map<Variable, number> {
    return copy(this._vars)
  }
}

// given a state, add in equations enforcing adjacent shapes to the state's store.
// modifies the store in-place. returns a set encoding of equations -- X = Y + Z => {X, Y, Z}
export function constrainAdjacent(state: State): [Set<Set<CassVar>>, Set<Set<CassVar>>] {

  let store = state.eval()
  let pointGen = new PointGeneration(store)
  let points = pointGen.makePoints(state.prog)
  // console.log('finished with points')

  let newStore = extendMap(store, pointGen.eval())
  // foreach contact point, there exists another (nonidentical) point with the same
  // coordinates, add the points to the state and add an equality between the points

  let added = new Set<Tup<PExpr, PExpr>>()

  let finder = ([[seedX], [seedY]]: Tup<PExpr, PExpr>) => (test: Tup<PExpr, PExpr>) => {
    let [[testX], [testY]] = test
    assert(newStore.has(seedX) && newStore.has(seedY) && newStore.has(testX) && newStore.has(testY), 'point not found in pointgen map')
    let lp = {x: newStore.get(seedX), y: newStore.get(seedY)}
    let rp = {x: newStore.get(testX), y: newStore.get(testY)}

    return seedX !== testX && seedY !== testY && overlap(lp, rp, 9) && !added.has(test)
  }
  let [retX, retY] = [new Set<Set<CassVar>>(), new Set<Set<CassVar>>()]

  for (let point of points) {
    let overlapped = find(points, finder(point))
    // typescript needs if-let -.-
    if (overlapped) {

      // TODO: i don't use the LHS variables, rewrite
      let [[x1v, x1e], [y1v, y1e]] = point
      let [[x2v, x2e], [y2v, y2e]] = overlapped

      let ex = new Eq(x1e, x2e)
      let ey = new Eq(y1e, y2e)
      state.store.addEq(ex, Strength.strong)
      state.store.addEq(ey, Strength.strong)

      let newXs = union(x1e.vars(), x2e.vars())
      let newYs = union(y1e.vars(), y2e.vars())

      retX.add(newXs)
      retY.add(newYs)

      for (let newVar of union(newXs, newYs)) {
        state.store.addCVar(newVar)
      }

      added.add(point)
    }
  }

  // console.log('finished adding eqs, building rett from:' + ret.size.toString())
  // let rett = uniqify(ret)
  // console.log(rett)

  // console.log('finished rett with: ' + rett.size.toString())

  return [retX, retY]
}

// starting from a seed set of source variables:
//   * a configuration is **consistent** if every equation has either one source + sink
//     OR no sources or sinks
//   * associate configurations with colorings (a map from equation to empty/Source/Source + Sink).
//     a candidate:
//       ** lives in a equation with a Source
//       ** is not a Source/Sink in another equation
//     foreach candidate:
//       ** add the candidate to the configuration
//       ** color the candidate as a Sink in the other equations

export namespace InteractionSynthesis {
  interface Color {}
  var Empty: Color = {}
  class Half implements Color {
    constructor(public src: CassVar) {}
  }
  class Full implements Color {
    constructor(public src: CassVar, public snk: CassVar) {}
  }

  type Coloring = Map<Set<CassVar>, Color>


  // generate valid free-variable sets for a constraint solver.
  // inputs: sources, variables whose value is pre-determined
  // eqVars: sets of constraint variables. each set corresponds to the variables
  //         in a constraint equation: X + Y = 2 * Z => {X, Y, Z}
  // returns: all sets of valid free variables.

  // for optimization purposes, we split the sucker up into a bunch of helper functions.

  // first, build an initial coloring from a set of equations.
  function buildColoring(inputs: Set<CassVar>, eqs: Set<Set<CassVar>>): Coloring {
    return toMap([... eqs].map(e => {
      let v = find(inputs, v => e.has(v))
      if (v) {
        return [e, new Half(v)] as [Set<CassVar>, Color]
      } else {
        return [e, Empty] as [Set<CassVar>, Color]
      }
    }))
  }

  export function validFreeVariables(inputs: Set<CassVar>, eqVars: Set<Set<CassVar>>): Set<Set<CassVar>> {


    // degenerate case? TODO
    // let degenerate = exists(eqVars, e => intersect(inputs, e).size >= 2)
    //
    // if (degenerate) {
    //   console.log('degenerate input to free vars:')
    //   console.log(inputs)
    //   console.log(eqVars)
    //   assert(false)
    // }

    let initColor: Coloring = buildColoring(inputs, eqVars)
    let candColorings = new Set<Coloring>()
    let finishedColorings = new Set<Coloring>()
    // console.log('initial coloring:')
    // console.log(initColor)
    candColorings.add(initColor)

    let total = 0
    let duplicates = 0

    while (candColorings.size != 0) {
      let nextSeed: Coloring = candColorings.entries().next().value[0]
      // console.log('candidates:')
      // console.log(candColorings)
      candColorings.delete(nextSeed)
      // console.log('next:')
      // console.log(nextSeed)
      //   * a configuration is **consistent** if every equation has either one source + sink
      //   //     OR no sources or sinks
      let done = forall(nextSeed, ([vals, color]) => color === Empty || color instanceof Full)

      if (done) {
        // console.log('finished')
        finishedColorings.add(nextSeed)
      } else {
        //     a candidate:
        //     //       ** lives in a equation with a Source
        let nextColorings: Set<Tup<Set<CassVar>, Full>> = new Set<Tup<Set<CassVar>, Full>>()
        for (let [vals, color] of nextSeed) {
          if (color instanceof Half) {
            // let newColors = map(
            //   filter(vals, v => v != color.src),
            //   v => [vals, new Full(color.src, v)] as Tup<Set<CassVar>, Full>
            // )
            // for (let v of newColors) {
            //   // if (nextColorings)
            //   nextColorings.add(v)
            // }

            for (let v of vals) {
              if (v != color.src) {
                nextColorings.add([vals, new Full(color.src, v)])
              }
            }
          }
        }

        // console.log('candidates in equation with source:')
        // console.log(nextColorings)


        //       ** is not a Source/Sink in another equation, and doesn't break the
        //          Source/Sink abstraction (i.e. isn't a Sink twice, each equation
        //          has one Source + Sink

        let newCands = filter(nextColorings, ([eq, color]) => {
          // let otherEqs = partMap(nextSeed, ([e, _]) => e != eq)[0]
          // console.log('other eqs:')
          // console.log(otherEqs)
          return forall(nextSeed, ([otherEq, otherColor]) => {
            if (otherEq == eq) {
              return true // restrict filter to other equations
            }
            if (otherColor === Empty) {
              return true
            } else if (otherColor instanceof Half) {
              return !otherEq.has(color.snk)
            } else if (otherColor instanceof Full) {
              return (!otherEq.has(color.snk)) && (otherColor.src != color.snk) && (otherColor.snk != color.snk)
            }
          })
        })

        // console.log('final candidates:')
        // console.log(newCands)


            //     foreach candidate:
            //       ** add the candidate to the configuration
            //       ** color the candidate as a Sink in the other equations

        for (let [newEq, candColor] of newCands) {
          // let newColoring = partMap(nextSeed, kv => true)[0] // copy the coloring
          // newColoring.set(newEq, candColor)
          let newColoring = new Map<Set<CassVar>, Color>()
          for (let [oldEq, oldColor] of nextSeed) {
            if (oldEq !== newEq) {
              if (oldColor === Empty && oldEq.has(candColor.snk)) {
                newColoring.set(oldEq, new Half(candColor.snk))
              } else {
                newColoring.set(oldEq, oldColor)
              }
            } else {
              newColoring.set(newEq, candColor)
            }
          }

          // newColoring.forEach((newColor, eqs) => {
          //   if (eqs != newEq) {
          //     if (newColor === Empty && eqs.has(candColor.snk)){
          //       newColoring.set(eqs, new Half(candColor.snk))
          //     } else {
          //       // do nothing
          //     }
          //   }
          // })
          // if (! exists(candColorings, v => v == newColoring)) {
            // console.log('adding coloring to worklist:')
            // console.log(newColoring)
            candColorings.add(newColoring)
          // } else {
          //   duplicates++
          // }
          // total++
        }

      }

    }

    // console.log('took ' + total.toString() + 'attempts, with ' + duplicates.toString() + ' duplicates.')

    let ret = new Set<Set<CassVar>>()
    // console.log('resulting colorings:')
    // console.log(finishedColorings)
    // foreach finished coloring, convert to a set of free variables. the free
    // variables are specified by the full colorings.
    for (let coloring of finishedColorings) {
      let newFrees = new Set<CassVar>()
      for (let [_, color] of coloring) {
        if (color instanceof Full) {
          newFrees.add(color.src).add(color.snk)
        } else if (color === Empty) {
          // we gucci
        } else {
          // oboy
          console.log(finishedColorings)
          // assert(false, 'half coloring in finished colorings')
        }
      }

      ret.add(newFrees)
    }

    // console.log('free var sets:')
    // console.log(ret)



    return uniqify(ret)
  }
}
