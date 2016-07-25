import {Program, Store} from './Model'
import {DragPoint, collectVars, Shape, Spring, Arrow, Rectangle, Image, Circle} from './Shapes'
import {Tup, partSet, intersect, fold, map, subset, uniqify, flatMap} from '../util/Util'
import {Ranker} from '../util/Poset'
import {Variable} from './Variable'


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

export function Invert(rs: ProgRanker): ProgRanker {
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
        //  .add([1, ShapeHeuristics])
         .add([1, ShapeCoordination])
         .add([1, PointMotion])
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
      ret += intersect(dragFrees, shapeVars).size
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


/*
object ShapeHeuristics extends Ranker {


  // helper: determine if a particular equation uses both an ipoint and a shape.
  def usesMotive(ip: IPoint, s: Shape, e: Eq) =
    e.contains(Set(ip.x, ip.y)) && e.contains(s.toVars)

  // helper functions to select corner points, centered points
  def cornerPoint(c: Configuration, ip: IPoint) = {
    c.prog.shapes.exists{ shape ⇒ c.prog.equations.exists{e ⇒ usesMotive(ip, shape, e)} && // variable uses shape
    (shape match {
      case VecLike(Point(x, y), dx, dy) ⇒
        (c.σ(x) == c.σ(ip.x) && c.σ(y) == c.σ(ip.y)) ||
        (c.σ(x) + 2*c.σ(dx) == c.σ(ip.x) && c.σ(y) + 2*c.σ(dy) == c.σ(ip.y))
      case BoxLike(Point(x, y), _, _) ⇒
        c.σ(x) != c.σ(ip.x) || c.σ(y) != c.σ(ip.y)
      // TODO: add line segments, triangles
      case Circle(Point(x, y), _) ⇒
        c.σ(x) != c.σ(ip.x) || c.σ(y) != c.σ(ip.y)
      case _ ⇒ false
    })
  }}

  def centerPoint(c: Configuration, ip: IPoint) = {
    c.prog.shapes.exists{ shape ⇒ c.prog.equations.exists{e ⇒ usesMotive(ip, shape, e)} && // variable uses shape
    (shape match {
        case VecLike(Point(x, y), dx, dy) ⇒
          (c.σ(x) + 0.5*c.σ(dx) == c.σ(ip.x) && c.σ(y) + 0.5*c.σ(dy) == c.σ(ip.y))
        case BoxLike(Point(x, y), _, _) ⇒
          c.σ(x) == c.σ(ip.x) && c.σ(y) == c.σ(ip.y)
        case Circle(Point(x, y), _) ⇒
          c.σ(x) == c.σ(ip.x) && c.σ(y) == c.σ(ip.y)
        // TODO: add line segments, triangles
        case _ ⇒ false
    })
  }}

  // thesis: IPs in the center of a shape should not stretch a shape, and IPs in
  // the corner of a shape should not translate the shape.
  def placementPenalty(c: Configuration, ip: IPoint) = {
    (if (centerPoint(c, ip)) { // if the point is in the center of a shape and manages to stretch it, penalize the point
      c.prog.shapes.find{ shape ⇒
        c.prog.equations.exists{e ⇒ usesMotive(ip, shape, e)} && !(ip.links & (shape match {
          case BoxLike(_, dy, dx) ⇒ Set(dx, dy)
          case Circle(_, r) ⇒ Set(r)
          case _ ⇒ Set ()
        })).isEmpty
      }.size
    } else if (cornerPoint(c, ip)) { // ditto, but for corners and translations
      c.prog.shapes.find{ shape ⇒
        c.prog.equations.exists{e ⇒ usesMotive(ip, shape, e)} && !(ip.links & (shape match {
          case BoxLike(Point(x,y), _, _) ⇒ Set(x, y)
          case Circle(Point(x,y), _) ⇒ Set(x, y)
          case _ ⇒ Set ()
        })).isEmpty
      }.size
    } else 0) * 4
  }

  def eval(c: Configuration) = c.prog.shapes.foldLeft(0){ case (sum, shp) ⇒
    sum + c.prog.ipoints.foldLeft(0) { case (sum, ip) ⇒
      sum + placementPenalty(c, ip)
    }
  }
}

object Default extends Ranker {
  val inner = WeightedSum(Set(
    (0 → LinkLength),
    (1 → ShapeMotion),
    (1 → ShapeHeuristics),
    (1 → ShapeCoordination),
    (1 → PointMotion)
  ))

  def eval(c: Configuration) = inner eval(c)
} */
