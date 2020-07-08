import {Variable, CassVar, VType} from './Variable'
import {Program, State} from './Model'
import {Shape, Line, Spring, Arrow, Circle, DragPoint, Rectangle, VecLike, RecLike, Image, pp, collectVars, stretchVars, translationVars} from './Shapes'
import {uniqify, map, uniq, overlap, extendMap, copy, Point, Tup, exists, flatMap, assert, intersect, find, toMap, forall, filter, partMap, map2Tup, union, flip, partSet, diff} from '../util/Util'
import {Expression, Equation, Constraint, Strength} from 'cassowary'

import {PositionUtil} from './Ranking'

import {Expr, Eq} from './Expr'

// go from Program -> a set of points, their cass expressions, and their parent shapes. so, we need to:
// build a bunch of points, a bunch of corresponding cass expressions, and a map
// including the new variables.
type PExpr = [CassVar, Expr, Shape]

export class PointGeneration {
  private _vars: Map<CassVar, number>
  constructor(vars: Map<Variable, number>) {
    this._vars = new Map<CassVar, number>()
    for (let [k, v] of vars)
      if (k instanceof CassVar)
        this._vars.set(k, v)
  }

  private static allocSuffix = 0;
  private alloc(v: number): CassVar {
    let prefix = "PGV"
    ++PointGeneration.allocSuffix

    let newVar = new CassVar(prefix + PointGeneration.allocSuffix.toString(), v)
    this._vars.set(newVar, v)
    return newVar
  }
  // given two vars and exprs, build a middle var/expr
  private between(l: PExpr, r: PExpr): PExpr {
    // alloc a new variable,
    let [lcv, le, lparent] = l
    let [rcv, re, rparent] = r
    if (lparent !== rparent) {
      console.log('left and right parents are different??')
      console.log(lparent)
      console.log(rparent)
    }
    let [lv, rv] = [this._vars.get(lcv), this._vars.get(rcv)]
    let newVar = this.alloc((lv + rv)/2)
    let newExp = le.plus(re).div(2)
    return [newVar, newExp, lparent]
  }

  // given a base and a delta, return the end
  private from(base: PExpr, delta: PExpr): PExpr {
    let [bCV, bE, lparent] = base
    let [deltaCV, deltaE, rparent] = delta
    if (lparent !== rparent) {
      console.log('left and right parents are different??')
      console.log(lparent)
      console.log(rparent)
    }
    let [bV, deltaV] = [this._vars.get(bCV), this._vars.get(deltaCV)]
    let newVar = this.alloc(bV + deltaV)
    let newExp = bE.plus(deltaE)
    return [newVar, newExp, lparent]
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
    return [nv, ne, v[2]]
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
      console.log(s)
      console.log('unhandled shape for shapepoints: ' + s.toString())
      assert(false)
    }

    return ret
  }

  // TODO: this creates shared variable references. clone if necessary
  private toPoint(x: Variable, y: Variable, parent: Shape): Tup<PExpr, PExpr> {
    assert(x instanceof CassVar)
    assert(y instanceof CassVar)
    let hd: PExpr = [x as CassVar, Expr.fromVar(x as CassVar), parent]
    let tl: PExpr = [y as CassVar, Expr.fromVar(y as CassVar), parent]
    return [hd, tl]
  }

  private _line(start: Tup<Variable, Variable>, finish: Tup<Variable, Variable>, parent:Shape): Set<Tup<PExpr, PExpr>> {
    let [x1, y1] = start
    let [x2, y2] = finish
    let begin = this.toPoint(x1, y1, parent)
    let end = this.toPoint(x2, y2, parent)
    let mid = this.midPoint(begin, end)
    let ret = new Set<Tup<PExpr, PExpr>>()
    return ret.add(begin).add(end).add(mid)
  }

  private static TODO = new Set<Tup<PExpr, PExpr>>()
  private linePoints(s: Line): Set<Tup<PExpr, PExpr>> {
    // beginning, middle, and end
    let begin = s.points[0]
    let end = s.points[1]
    return this._line(begin, end, s)
  }
  private vectPoints(s: VecLike): Set<Tup<PExpr, PExpr>> {
    let begin = this.toPoint(s.x, s.y, s)
    let delta = this.toPoint(s.dx, s.dy, s)
    let next = this.plusPoint(begin, delta)
    let mid = this.midPoint(begin, next)
    return (new Set<Tup<PExpr, PExpr>>()).add(begin).add(next).add(mid)
  }
  private circPoints(s: Circle | DragPoint): Set<Tup<PExpr, PExpr>> {
    let [x, y] = this.toPoint(s.x, s.y, s)
    assert(s.r instanceof CassVar)
    let r:PExpr = [s.r as CassVar, Expr.fromVar(s.r as CassVar), s]
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
    let [x, y] = this.toPoint(s.x, s.y, s)
    let [dx, dy] = this.toPoint(s.dx, s.dy, s)
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

// add points to a state. returns the elaborated points and new store.
export function addPoints(state: State): [Set<Tup<PExpr, PExpr>>, Map<Variable, number>] {
  let store = state.eval()
  let pointGen = new PointGeneration(store)
  let points = pointGen.makePoints(state.prog)
  // console.log('finished with points')

  let newStore = extendMap(store, pointGen.eval())

  return [points, newStore]
}
// given a state, add in equations enforcing adjacent shapes to the state's store.
// modifies the store in-place. returns a set encoding of equations -- X = Y + Z => {X, Y, Z}
export function constrainAdjacent(state: State, points: Set<Tup<PExpr, PExpr>>, pointStore: Map<Variable, number>): [Set<Set<CassVar>>, Set<Set<CassVar>>] {

  // assumes points have already been added to the diagram
  let store = extendMap(state.eval(), pointStore)
  // console.log(points)
  // console.log(store)

  // foreach contact point, there exists another (nonidentical) point with the same
  // coordinates, add the points to the state and add an equality between the points

  let added = new Set<Tup<PExpr, PExpr>>()
  let constrained = new Map<Shape, Shape>()

  let finder = ([[seedX], [seedY]]: Tup<PExpr, PExpr>) => (test: Tup<PExpr, PExpr>) => {
    let [[testX], [testY]] = test
    assert(store.has(seedX) && store.has(seedY) && store.has(testX) && store.has(testY), 'point not found in pointgen map')
    let lp = {x: store.get(seedX), y: store.get(seedY)}
    let rp = {x: store.get(testX), y: store.get(testY)}

    return seedX !== testX && seedY !== testY && overlap(lp, rp, 9) && !added.has(test)
  }
  let [retX, retY] = [new Set<Set<CassVar>>(), new Set<Set<CassVar>>()]

  for (let point of points) {
    let oldLapped = find(points, finder(point))
    let tookLoop = false
    for (let overlapped of filter(points, finder(point))) {
    // if (oldLapped) {
      // let overlapped = oldLapped
      tookLoop = true
      // console.log('found:' + overlapped[0][1].toString() + ", " +  overlapped[1][1].toString())
      // console.log(overlapped)
      // TODO: i don't use the LHS variables, rewrite
      let [[x1v, x1e, p1], [y1v, y1e]] = point
      let [[x2v, x2e, p2], [y2v, y2e]] = overlapped

      if (constrained.get(p1) === p2 || constrained.get(p2) === p1) {
        // console.log('skipping')
        continue
      }


      if (x1e.isEqual(x2e)) {
        // console.log('equal exprs: ' + x1e.toString() + ", " + x2e.toString() )
      } else {
        let ex = new Eq(x1e, x2e)
        state.store.addEq(ex, Strength.strong)
      }

      if (y1e.isEqual(y2e)) {
        // console.log('equal exprs: ' + y1e.toString() + ", " + y2e.toString() )
      } else {
        let ey = new Eq(y1e, y2e)
        state.store.addEq(ey, Strength.strong)
      }


      let newXs = union(x1e.vars(), x2e.vars())
      let newYs = union(y1e.vars(), y2e.vars())

      retX.add(newXs)
      retY.add(newYs)

      for (let newVar of union(newXs, newYs)) {
        // console.log('adding:' + newVar.name)
        state.store.addCVar(newVar)
      }

      added.add(point)
      constrained.set(p1, p2)
      constrained.set(p2, p1)
    }

  }


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



            candColorings.add(newColoring)
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

// construction of constrained direct manipulation interface
// step 0 -- collection of shapes
// step one -- add in DPs and base equations (with empty free variable maps)
// step two -- add in translation vars foreach shape in diagram
// step three -- for DP,shape tuples that should stretch i.e. dragpoints that lie on shape edges, replace translation vars
// with stretch vars
export namespace ConstrainedDirManip {
  // add in all DPS. modifies the state in-place to add drag points.
  export function elaborateDPs(state: State, targetName: string): [State, Map<DragPoint, Shape>] {
    let origStore = state.eval()
    let names = flip(state.prog.names)
    let [points, pstore] = addPoints(state)

    let prefix = "DP"
    var suffix = 0

    let get = (v: Variable) => pstore.get(v) || origStore.get(v)


    let radius = state.store.addVar(VType.Prim, "DPR", 5)
    var ret: State = state
    let parents = new Map<DragPoint, Shape>()
    // update points with new parents
    let newPoints:Set<[[CassVar, Expr, Shape],[CassVar, Expr, Shape]]> = new Set()
    for (let xy of points) {

      let [[x, xe, xs], [y, ye, ys]] = xy // assumes xy have already been added

      if (!origStore.has(x)) {
        let eq = new Eq(Expr.fromVar(x), xe)
        ret.store.addEq(eq, Strength.strong)
      }
      if (!origStore.has(y)) {
        let eq = new Eq(Expr.fromVar(y), ye)
        ret.store.addEq(eq, Strength.strong)
      }

      let dp = new DragPoint(x, y, radius, 'blue')

      // add in target points
      if ( get(x) == get((xs as any).x) && get(y) == get((xs as any).y)) {
        // console.log('centered, with names')
        // console.log(names.get(xs) + ", " + targetName)
        if (names.get(xs) == targetName) {
          dp.stroke = 'green'
          // also, add in a target

          let tx = state.store.addVar(VType.Prim, "targX", get(x) + 50)
          let ty = state.store.addVar(VType.Prim, "targY", get(y) + 50)
          let targ = new Circle(tx, ty, radius, 'green', 'solid')
          ret = ret.addShape('targetShape', targ, false)
        }
      }

      parents.set(dp, ys)
      ret = ret.addShape(prefix + suffix.toString(), dp, false)
      suffix++
      newPoints.add([[x, xe, dp], [y, ye, dp]])
      // console.log('added:' + prefix + suffix.toString())
    }

    // console.log(pstore)
    // console.log(points)
    // console.log(newPoints)
    for (let newVar of pstore) {
      if (newVar[0] instanceof CassVar)
        ret.store.addCVar(newVar[0] as CassVar)
    }

    let [xEqs, yEqs] = constrainAdjacent(ret, newPoints, pstore)
    // ret.debug()

    return [ret, parents]
  }

  function generateMotive(state: State, dp: DragPoint, parent: Shape): Set<Variable> {
    let ret: Set<Variable> = new Set()
    let pu = new PositionUtil(state.store)

    // for points on the edge of
    let constrainX = false
    let constrainY = false
    if (pu.lieOnCorner(dp, parent)) {
      constrainX = pu.storeEq(dp.x, (parent as any).x)
      constrainY = pu.storeEq(dp.y, (parent as any).y)
    }

    // first, generate the parent motive
    if (pu.lieOnCorner(dp, parent)) {
      if (parent instanceof Rectangle) {

        if (!constrainX)
          ret.add(parent.dx)
        if (!constrainY)
          ret.add(parent.dy)

      } else if (parent instanceof Circle) {
        ret.add(parent.r)
      } else {
        assert(false, 'unhandled shape in motives')
      }
    } else {
      // in the middle
      ret.add((parent as any).x).add((parent as any).y)
    }

    // handle other shapes in extend-links pass

    // finally, add in dragpoints of the same shape.

    for (let sp of filter(state.prog.shapes, s => s instanceof DragPoint)) {
      let otherDP = sp as DragPoint
      let onSameShape = (pu.lieOnCorner(otherDP, parent) || pu.lieOnCenter(otherDP, parent))

      if (!onSameShape) {

        continue
      }


      if (parent instanceof Circle) {
        // case: dp is in the middle of the circle.
        // otherDP should translate -- cases: otherDP === dp, otherDP lies on circle, otherDP not on circle
        if (pu.lieOnCenter(dp, parent)) {
            ret.add(otherDP.x).add(otherDP.y)
        } else if (pu.lieOnCorner(otherDP, parent)) {
          // case: dp and otherDP are on the edge of the same circle. dp should
          // have the dimension of otherDP that stretches with the circle's radius.
          // cases:
          if (pu.storeEq(otherDP.x, dp.x)) {

            if (!constrainX)
              ret.add(otherDP.x)
            if (!constrainY)
              ret.add(otherDP.y)

          } else if (pu.storeEq(otherDP.x,parent.x)) {
            ret.add(otherDP.y)
          } else if (pu.storeEq(otherDP.y,parent.y)) {
            ret.add(otherDP.x)
          } else {
            assert(false, "unreachable")
          }

        }
        // case: otherDP is in the middle of the same circle, and dp is on the edge. no sharing.

      } else if (parent instanceof Rectangle) {


        // case: dp on corner, other in middle => other stays if they're in the same shape

        // case: dp on corner, other on corner => other may or may not move.
        if (pu.lieOnCorner(dp, parent)) {
          if (pu.lieOnCenter(otherDP, parent)) {
            // if it's in the center, it shouldnt translate
          } else if (pu.lieOnCorner(otherDP, parent)) {
            // hokay.
            // if dp on far edge, other on far edge, add both
            if (pu.storeEq(otherDP.x, parent.x) && !constrainY) {
              ret.add(otherDP.y)
            }
            if (pu.storeEq(otherDP.y, parent.y) && !constrainX) {
              ret.add(otherDP.x)
            }
          }

          // case: dp in middle, other on corner => other moves
          // case: dp in middle, other in middle => other moves
        } else {
          if (!constrainX)
            ret.add(otherDP.x)
          if (!constrainY)
            ret.add(otherDP.y)
        }
      }
    }

    // console.log('adding: ')
    // console.log(ret)
    return ret
  }

  // limited ELA, specialized for only catching intermediaries.
  // given a set of free variables, a set of equations, and a set of variables to ignore, extend along equations.
  // if an extension is ambiguous, panic. pick variables from eqs until eqs less bads has {0, 2} of frees.
  // return an extension of frees.

  function determinELA(frees: Set<Variable>, eqs: Iterable<Set<Variable>>, bads: Set<Variable>): Set<Variable> {
    let newFrees: Set<Variable> = union(frees, new Set()) // copy frees
    let filtEqs = new Set(map(eqs, es => diff(es, diff(bads, newFrees))))
    // debugger

    // so long as there's a new variable, add to frees
    let finder = () => {
      for (let vs of filtEqs) {
        let [fvs, unfs] = partSet(vs, v => newFrees.has(v))
        if (fvs.size == 1 && unfs.size == 1) {
          return [...unfs.keys()][0]
        } else {
          if (fvs.size == 0 || fvs.size == 2) {
            continue
          } else {
            // console.log(frees)
            // console.log(bads)
            // console.log(fvs)
            // console.log(unfs)
            // debugger
            assert(false, "undetermined equation in determinELA")
          }
        }
        return null
      }
    }

    let nxt = finder()
    while (nxt) {
      // console.log('adding ' + nxt.name)
      newFrees.add(nxt)
      nxt = finder()
    }
    return newFrees
  }

  export function generateMotives(state: State, parents: Map<DragPoint, Shape>): Map<DragPoint, Set<Variable>>{
    // console.log('adding frees')
    // console.log(state.prog.allFrees)
    let pu = new PositionUtil(state.store)
    let ret = new Map<DragPoint, Set<Variable>>()
    for (let [dp] of state.prog.allFrees) {

      let parent = parents.get(dp)

      let frees = generateMotive(state, dp, parents.get(dp))
      let eqs = map(state.store.equations, e => e.vars())

      // aha. restricted variables are those of the parent shape, and also stretch variables of other shapes
      // console.log(parents.get(dp))

      let restricted = union(collectVars(parents.get(dp)), flatMap(state.prog.shapes, stretchVars))

      ret.set(dp, determinELA(frees, eqs, restricted))
    }
    return ret
  }
}
