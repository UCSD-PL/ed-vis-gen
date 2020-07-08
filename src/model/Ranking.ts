import {Program, Store} from './Model'
import {DragPoint, collectVars, Shape, Spring, Arrow, Rectangle, Image, Circle, Line} from './Shapes'
import {Tup, partSet, intersect, fold, map, subset, uniqify, flatMap, exists, filter, cat, assert, len} from '../util/Util'
import {Ranker} from '../util/Poset'
import {Variable} from './Variable'
import {Eq} from './Expr'


// rank by aggregate number of free variables
type ProgRanker = Ranker<Tup<Program, Store>>
export function FreeVars([p, s]: Tup<Program, Store>): number {
  return [... p.shapes.entries()].map(([s, _]) => {
    if (s instanceof DragPoint) {
      return p.allFrees.get(s).size
    } else {
      return 0
    }
  }).reduce((sum, next) => sum + next)
}

export function Invert<A>(rs: (a:A) => number): (a:A) => number {
  return (a) => -1 * rs(a)
}

// weighted sum of input rankings

export function WeightedSum(rs: Set<Tup<number, ProgRanker>>) : ProgRanker {
  return (a) => [... rs].map(
    ([weight, ranker]) => weight*ranker(a)
  ).reduce((sum, next) => sum + next)
}

export function Default([p, s]: Tup<Program, Store>) {
  let weights = new Set<Tup<number, ProgRanker>>()
  weights.add([0, FreeVars])
         .add([1, ShapeMotion])
         .add([2, ShapeHeuristics])
         .add([5, ShapeCoordination])
         .add([5, PointMotion])
  let ranker = WeightedSum(weights)
  return ranker([p, s])
}

export function ConstrainedEditing([p, s]: Tup<Program, Store>) {
  let weights = new Set<Tup<number, ProgRanker>>()
  weights.add([1000, ShapeHeuristics])
         .add([100, PointMotion])
         .add([1, TranslationFavored])
  let ranker = WeightedSum(weights)
  return ranker([p, s])
}


// thesis: stationary shapes are ideal. foreach shape that changes as a function
// of input, penalize the configuration.

export function ShapeMotion([p, s]: Tup<Program, Store>): number {
  let [drags, shapes] = partSet(p.shapes, shp => shp instanceof DragPoint)
  let ret = 0

  for (let s of shapes) {
    for (let ip of drags) {
      let dragFrees = p.allFrees.get(ip as DragPoint)
      let shapeVars = collectVars(s)
      ret += intersect(dragFrees, shapeVars).size > 0 ? 1 : 0
    }
  }
  return ret
}

// thesis: ipoints with unrestricted motion are ideal. foreach ipoint that *doesn't*
// move itself, add one. add 10 if the ipoint doesn't move *at all* (???)
export function PointMotion([p, s]: Tup<Program, Store>): number {
  let [drags] = partSet(p.shapes, shp => shp instanceof DragPoint)

  let ranker = (dp: DragPoint) => {
    let dpVars = (new Set<Variable>()).add(dp.x).add(dp.y)
    let movement = intersect(dpVars, p.allFrees.get(dp)).size
    if (movement == 0) {
      return 10 // big penalty
    } else if (movement == 1) {
      return 1 // small penalty
    } else if (movement == 2) {
      // no penalty
      return 0
    } else {
      // ??? inconceivable
      assert(false)
    }
  }

  return fold(map(drags, ranker), (acc, nxt) => acc + nxt, 0)

}

// springs and arrows generally don't translate
export function VecLikeTranslation([p, s]: Tup<Program, Store>): number {
  let emp = new Set<Variable>()
  let makeVars = (s: Shape) => {
    if (s instanceof Arrow || s instanceof Spring) {
      return (new Set<Variable>()).add(s.x).add(s.y)
    } else {
      return emp
    }
  }

  let [drags, shapes] = partSet(p.shapes, shp => shp instanceof DragPoint)

  let posVars = uniqify(new Set<Set<Variable>>(map(shapes, makeVars)))

  let ret = 0
  for (let dp of drags) {
    let dpFrees = p.allFrees.get(dp as DragPoint)
    ret += fold(posVars, (sum, vars) => sum + (subset(vars, dpFrees) ? 1:0), 0)
  }

  return ret
}

// rectangles and images generally don't stretch
export function BoxStretching([p, s]: Tup<Program, Store>): number {
  let emp = new Set<Variable>()
  let makeVars = (s: Shape) => {
    if (s instanceof Rectangle || s instanceof Image) {
      return (new Set<Variable>()).add(s.dx).add(s.dy)
    } else {
      return emp
    }
  }

  let [drags, shapes] = partSet(p.shapes, shp => shp instanceof DragPoint)

  let posVars = uniqify(new Set<Set<Variable>>(map(shapes, makeVars)))

  let ret = 0
  for (let dp of drags) {
    let dpFrees = p.allFrees.get(dp as DragPoint)
    ret += fold(posVars, (sum, vars) => sum + (subset(vars, dpFrees) ? 1:0), 0)
  }

  return ret
}

// objects generally don't stretch in one dimension and translate in the other,
// in the same motive
export function MixedMotives([p, s]: Tup<Program, Store>): number {

  let emp = new Set<Set<Variable>>()
  let St = (v1: Variable, v2: Variable) => (new Set<Variable>()).add(v1).add(v2)
  let makeVars = (s: Shape) => {
    if (s instanceof Rectangle || s instanceof Image || s instanceof Spring || s instanceof Arrow) {
      return uniqify((new Set<Set<Variable>>()).add(St(s.x, s.dy)).add(St(s.y, s.dx)))
    } else if (s instanceof Circle) {
      return uniqify((new Set<Set<Variable>>()).add(St(s.x, s.r)).add(St(s.y, s.r)))
    } else {
      return emp
    }
  }

  let [drags, shapes] = partSet(p.shapes, shp => shp instanceof DragPoint)

  let shapeVars = uniqify(flatMap(shapes, makeVars))

  let ret = 0
  for (let dp of drags) {
    let dpFrees = p.allFrees.get(dp as DragPoint)
    ret += fold(shapeVars, (sum, vars) => sum + (subset(vars, dpFrees) ? 1:0), 0)
  }

  return ret
}


// overall coordination score: MixedMotives is a big deal, box stretching matters,
// and springs/arrows moving doesn't matter.

export function ShapeCoordination([p, s]: Tup<Program, Store>) {
  let weights = new Set<Tup<number, ProgRanker>>()
  weights.add([0, VecLikeTranslation])
         .add([1, BoxStretching])
         .add([2, MixedMotives])
  let ranker = WeightedSum(weights)
  return ranker([p, s])
}

export class PositionUtil {
  private _vals: Map<Variable, number>
  constructor(public store: Store) {
    this._vals = store.eval()
  }

  public storeEq(v1: Variable, v2: Variable): boolean {
    let store = this._vals
    assert(store.has(v1) && store.has(v2), "pu store missing: " + v1.name + ", " + v2.name)
    return this._vals.get(v1) == this._vals.get(v2)
  }

  public lieOnCorner(dp: DragPoint, s: Shape): boolean {
    let get = (v: Variable) => this._vals.get(v)
    if (s instanceof Arrow || s instanceof Spring) {
      let base = this.storeEq(s.x, dp.x) && this.storeEq(s.y, dp.y)
      let end = (get(s.x) + get(s.dx) == get(dp.x)) &&
                (get(s.y) + get(s.dy) == get(dp.y))
      return base || end
    } else if (s instanceof Rectangle || s instanceof Image) {
      // console.log("xs, dx:" + get(s.x) + ", " + get(dp.x) + ", " + get(s.dx))
      // console.log("ys, dy:" + get(s.x) + ", " + get(dp.x) + ", " + get(s.dx))
      // console.log('xdelta: ' + (Math.abs(get(dp.x) - get(s.x)) == get(s.dx)))

      let onY = this.storeEq(s.x, dp.x) && (Math.abs(get(dp.y) - get(s.y)) == get(s.dy))
      let onX = this.storeEq(s.y, dp.y) && (Math.abs(get(dp.x) - get(s.x)) == get(s.dx))
      let corner = (Math.abs(get(dp.y) - get(s.y)) == get(s.dy)) && (Math.abs(get(dp.x) - get(s.x)) == get(s.dx))
      // debugger
      // console.log(dp.x.name)
      // if (Math.abs(get(dp.y) - get(s.y)) == get(s.dy))
      //   debugger
      // console.log('corner? ' + onX || onY || corner)
      return onX || onY || corner
    } else if (s instanceof Circle) {
      //  dp.y == s.y && dp.x == s.x +- s.r
      let onY = this.storeEq(s.x, dp.x) && Math.abs(get(dp.y) - get(s.y)) == get(s.r)
      let onX = this.storeEq(s.y, dp.y) && Math.abs(get(dp.x) - get(s.x)) == get(s.r)

      return onX || onY
    } else {
      // lines, triangles TODO
      // console.log('???')
      // console.log(s)
      return false
    }
  }

  public lieOnCenter(dp: DragPoint, s: Shape): boolean {
    if (s instanceof Arrow || s instanceof Spring) {
      let base = this.storeEq(s.x, dp.x) && this.storeEq(s.y, dp.y)
      let end = (this._vals.get(s.x) + this._vals.get(s.dx) == this._vals.get(dp.x)) &&
                (this._vals.get(s.y) + this._vals.get(s.dy) == this._vals.get(dp.y))
      return !base && !end
    } else if (s instanceof Rectangle || s instanceof Image || s instanceof Circle || s instanceof DragPoint) {
      return this.storeEq(s.x, dp.x) && this.storeEq(s.y, dp.y) // center in both dimensions
    } else {
      // lines, triangles TODO
    }

    return false
  }
}

export function ShapeHeuristics([p, s]: Tup<Program, Store>): number {
  let store = s.eval()
  let pu = new PositionUtil(s)

  let debug = (s: Shape) => console.log(store.get((s as any).x).toString() + ", " + store.get((s as any).y).toString())

  let storeEq = (v1: Variable, v2: Variable) => store.get(v1) == store.get(v2)
  let St = (v1: Variable, v2: Variable) => (new Set<Variable>()).add(v1).add(v2)


  // helper functions to select corner points, centered points
  let isCorner = (dp: DragPoint, shape: Shape) => {
    for (let eq of s.equations) {
      if (eq.usesMotive(dp, shape) && pu.lieOnCorner(dp, shape)) {
        return true
      }
    }
    return false
  }
    // exists(s.equations, eq => eq.usesMotive(dp, shape) && cornerEval(dp, s))


  let isCenter = (dp: DragPoint, shape: Shape) => {
    for (let eq of s.equations) {
      if (eq.usesMotive(dp, shape) && pu.lieOnCenter(dp, shape))
        return true
    }
    return false
  }



  // thesis: IPs in the center of a shape should not stretch a shape, and IPs in
  // the corner of a shape should not translate the shape.

  let [drags, nonDrags] = partSet(p.shapes, s => s instanceof DragPoint) //filter(p.shapes, s => s instanceof DragPoint) as Iterable<DragPoint>
  //let nonDrags = filter(p.shapes, s => ! (s instanceof DragPoint))

  let ret = 0
  for (let drag of (drags as Set<DragPoint>)) {
    let corners = filter(nonDrags, s => isCorner(drag, s))
    let centers = filter(nonDrags, s => isCenter(drag, s))
    let frees = p.allFrees.get(drag)

    // console.log('corners: ' + len(corners).toString())
    // console.log('centers: ' + len(centers).toString())
    // console.log('frees: ' + map(frees, v => v.name).toString())


    // let vars = map(corners, s => {
    //   if (! (s instanceof Line)) {
    //     assert('x' in s && 'y' in s, 'expected x and y to shape: ' + s.toString())
    //     return St((s as any).x, (s as any).y)
    //   } else {
    //     return new Set<Variable>()
    //   }
    // })

    // console.log('corner vars: ' + map(vars, vs => map(vs, v => v.name)).toString())
    // map corner penalty onto corners, center penalty onto centers, concat the results
    // and sum using fold
    let cornPen = map(corners, s => {
      if (! (s instanceof Line)) {
        assert('x' in s && 'y' in s, 'expected x and y to shape: ' + s.toString())
        return intersect(St((s as any).x, (s as any).y), frees).size
      } else {
        return 0
      }
    })



    let centPen = map(centers, s => {
      if (s instanceof Rectangle || s instanceof Image) {
        return intersect(St(s.dx, s.dy), frees).size
      } else if (s instanceof Circle) {
        return frees.has(s.r)? 1 : 0
      } else {
        return 0
      }
    })

    ret += fold(cat(centPen, cornPen), (sum, nxt) => sum + nxt, 0)
  }

  // console.log('shape heuristic: ' + ret.toString())

  return ret
}

// heuristic for spring simulation -- every motive that *isn't* a translation is a penalty
export function TranslationSprings([freeVars, p, s]: [Set<Variable>, Program, Store] ): number {
  let emp = new Set<Variable>()
  let makeVars = (s: Shape) => {
    if (! (s instanceof Line || s instanceof Spring)) {
      assert('x' in s && 'y' in s, 'expected x and y in shape: ' + s.toString())
      return new Set<Variable>().add((s as any).x).add((s as any).y)
    } else if (s instanceof Spring) {
      // springs should still compress
      return new Set<Variable>().add(s.dx).add(s.dy)
    } else {
      return emp
    }
  }

  // let [drags, shapes] = partSet(p.shapes, shp => shp instanceof DragPoint)

  let translationFrees = uniqify(new Set<Set<Variable>>(map(map(p.shapes, makeVars), vars => intersect(vars, freeVars))))

  return fold(map(translationFrees, s => s.size), (sum, nxt) => sum + nxt, 0)
}

export function TransSpringFavored([freeVars, p, s]: [Set<Variable>, Program, Store] ): number {
  return Invert(TranslationSprings)([freeVars, p, s])
}

export function TranslationPenalty([p, s]: [Program, Store] ): number {
  let emp = new Set<Variable>()
  let makeVars = (s: Shape) => {
    if (! (s instanceof Line )) {
      assert('x' in s && 'y' in s, 'expected x and y in shape: ' + s.toString())
      return new Set<Variable>().add((s as any).x).add((s as any).y)
    } else {
      return emp
    }
  }

  // foreach interaction in the program, penalize if it translates
  let frees = p.allFrees
  let shapeTranslationVars = map(p.shapes, makeVars)

  let foo = flatMap(frees, ([dp, dpFrees]) => {
    return uniqify(new Set<Set<Variable>>(map(shapeTranslationVars, vars => intersect(dpFrees, vars))))
  })

  return fold(map(foo, vs => vs.size), (sum, nxt) => sum + nxt, 0)



  // let [drags, shapes] = partSet(p.shapes, shp => shp instanceof DragPoint)

  // let translationFrees = uniqify(new Set<Set<Variable>>(map(map(p.shapes, makeVars), vars => intersect(vars, freeVars))))
  //
  // return fold(map(translationFrees, s => s.size), (sum, nxt) => sum + nxt, 0)
}

export function TranslationFavored([p, s]: [Program, Store] ): number {
  return Invert(TranslationPenalty)([p, s])
}
