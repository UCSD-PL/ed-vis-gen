"use strict";
const Shapes_1 = require('./Shapes');
const Util_1 = require('../util/Util');
function FreeVars([p, s]) {
    return [...p.shapes.entries()].map(([s, _]) => {
        if (s instanceof Shapes_1.DragPoint) {
            return p.allFrees.get(s).size;
        }
        else {
            return 0;
        }
    }).reduce((sum, next) => sum + next);
}
exports.FreeVars = FreeVars;
// weighted sum of input rankings
function WeightedSum(rs) {
    return (a) => [...rs].map(([weight, ranker]) => weight * ranker(a)).reduce((sum, next) => sum + next);
}
exports.WeightedSum = WeightedSum;
// thesis: stationary shapes are ideal. foreach shape that changes as a function
// of input, penalize the configuration.
function ShapeMotion([p, s]) {
    let [drags, shapes] = Util_1.partSet(p.shapes, shp => shp instanceof Shapes_1.DragPoint);
    let ret = 0;
    for (let s of shapes) {
        for (let ip of drags) {
            let dragFrees = p.allFrees.get(ip);
            let shapeVars = Shapes_1.collectVars(s);
            ret += Util_1.intersect(dragFrees, shapeVars).size;
        }
    }
    return ret;
}
exports.ShapeMotion = ShapeMotion;
/*
// thesis: ipoints with unrestricted motion are ideal. foreach ipoint that *doesn't*
// move itself, add one. add 10 if the ipoint doesn't move *at all* (???)
object PointMotion extends Ranker {
  def eval(c: Configuration) = c.prog.ipoints.foldLeft(0){ case (acc, ip) ⇒
    (Set(ip.x, ip.y) & ip.links).size match {
      case 2 ⇒ acc // no penalty
      case 1 ⇒ acc+1
      case 0 ⇒ println("immobile IP: " + ip.toString); acc + 10 // big penalty
      case _ ⇒ throw Inconceivable // WAT
    }
  }
}


object ShapeCoordination extends Ranker {
  // springs and arrows generally don't translate
  object VecLikeTranslation extends Ranker {
    def toVars(s: Shape): Set[Variable] = s match {
      case VecLike(Point(x, y), _, _) ⇒ Set(x,y)
      case _ ⇒ Set[Variable]()
    }
    def eval(c: Configuration) = (for {
      s <- c.prog.shapes
      ip <- c.prog.ipoints
      if toVars(s).subsetOf(ip.links)
    } yield (s, ip)).size
  }

  // rectangles and images generally don't stretch
  object BoxStretching extends Ranker {
    def toVars(s: Shape): Set[Variable] = s match {
      case BoxLike(_, dx, dy) ⇒ Set(dx, dy)
      case _ ⇒ Set[Variable]()
    }
    def eval(c: Configuration) = (for {
      s <- c.prog.shapes
      ip <- c.prog.ipoints
      if toVars(s).subsetOf(ip.links)
    } yield (s, ip)).size
  }


  // objects generally don't stretch in one dimension and translate in the other,
  // in the same motive
  object MixedMotives extends Ranker {
    def toVars(s: Shape) = s match {
      case VecLike(Point(x, y), dx, dy) ⇒ Set(Set(x, dy), Set(y, dx))
      case BoxLike(Point(x, y), dy, dx) ⇒ Set(Set(x, dy), Set(y, dx))
      case Circle(Point(x, y), r) ⇒ Set(Set(x, r), Set(y, r))
      case _ ⇒ Set[Set[Variable]]()
    }
    def eval(c: Configuration) = (for {
      s <- c.prog.shapes
      ip <- c.prog.ipoints
      vars <- toVars(s)
      if vars.subsetOf(ip.links)
      // package vars up with ip to count multiple bad interactions
    } yield (s, ip, vars)).size
  }

  val inner = WeightedSum(Set(
    (0 → VecLikeTranslation),
    (1 → BoxStretching),
    (2 → MixedMotives)
  ))

  def eval(c: Configuration) = inner eval(c)
}

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
