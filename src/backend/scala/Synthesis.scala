package EDDIE.synthesis

import EDDIE.syntax._
import EDDIE.errors._
import EDDIE.Conversions._
import EDDIE.semantics._

// interaction point placements: given a shape, return all possible ipoints and
// their respective positional equations. e.g. Circle((a,b), c) => (a,b) + 8 points
// on the circle
object PointGeneration {
  def apply(s: Shape, σ: Store): Set[(IPoint, Set[Eq], Store)] = s match {
    case LineSegment(s, e) ⇒ line(s,e, σ)
    case Rectangle(tl, br) ⇒ rect(tl, br, σ)
    case Circle(center, radius) ⇒ circ(center, radius, σ)
    case Image(center, height, width) ⇒ img(center, height, width, σ)
    case _ ⇒ throw Incomplete
  }

  // helper function; link up an IP and a point by equality
  def equality(l: IPoint, r: Point, σ: Store) = {
    (Set(Eq(l.x, r.x), Eq(l.y, r.y)), σ + (l.x → σ(r.x)) + (l.y → σ(r.y)))
  }
  // helper function; link up an IP to the midpoint of two points
  def midPoint(ip: IPoint, l: Point, r: Point, σ: Store) = {
    (Set[Eq]() + Eq(ip.x, (l.x plus r.x) div 2.0) + Eq(ip.y, (l.y plus r.y) div 2.0),
     σ + (ip.x → ((σ(l.x) + σ(r.x))/2)) + (ip.y → ((σ(l.y) + σ(r.y))/2)))
   }

  // given two points, build an IP for the midpoint and relevant equations
  def makeMP(l: Point, r: Point, σ: Store) = {
    val ip = IPoint(
      l.x.name ++ "_" ++ r.x.name ++ "_MPX",
      l.y.name ++ "_" ++ r.y.name ++ "_MPY")
    val (eqs, newσ) = midPoint(ip, l, r, σ)
    (ip, eqs, newσ)
  }

  // the beginning, the end, and the midpoint
  // assumes start and end are points defined in the program
  def line(start: Point, end: Point, σ: Store)  = {
    val sip = start.toIP()
    val eip = end.toIP()
    val (startEqs, sσ) = equality(sip, start, σ)
    val (endEqs, eσ) = equality(eip, end, σ)

    val (mip, midEqs, mσ) = makeMP(start, end, σ)

    // wrap everything up in tuples and return
    Set((sip, startEqs, sσ), (eip, endEqs, eσ), (mip, midEqs, mσ))
  }

  // 3 lines, including midpoints: tL -> tR, mL -> mR, bL -> bR
  // visually:
  // * - * - *
  // |       |
  // *   *   *
  // |       |
  // * - * - *
  def rect(topLeft: Point, botRight: Point, σ: Store) = {
    // phantom points, valid because topLeft and botRight are already points
    val topRight = Point(botRight.x, topLeft.y)
    val botLeft  = Point(topLeft.x, botRight.y)

    line(topLeft, topRight, σ) ++ line(botLeft, botRight, σ) ++
      Set(makeMP(topLeft, botLeft, σ), makeMP(topRight, botRight, σ), makeMP(topLeft, botRight, σ))
  }

  // center, 4 points on radius. circle version of the rectangle projection.
  // visually (ascii is hard...):
          //     =  *  =
          //   =         =
          //  =           =
          //  *     *     *
          //  =           =
          //   =         =
          //     =  *  =
          //
  def circ(c: Point, r: Variable, σ: Store) = {
    val midPoint = c.toIP()
    val (midPointEqs, midPointσ) = equality(midPoint, c, σ)

    // @TODO: refactor...
    val leftPoint = c.toIP("L")
    val leftPointEqs = Set(Eq(leftPoint.x, c.x minus r), Eq(leftPoint.y, c.y))
    val leftPointσ = σ + (leftPoint.x → (σ(c.x) - σ(r))) + (leftPoint.y → σ(c.y))

    val rightPoint = c.toIP("R")
    val rightPointEqs = Set(Eq(rightPoint.x, c.x plus r), Eq(rightPoint.y, c.y))
    val rightPointσ = σ + (rightPoint.x → (σ(c.x) + σ(r))) + (rightPoint.y → σ(c.y))

    val topPoint = c.toIP("T")
    val topPointEqs = Set(Eq(topPoint.y, c.y minus r), Eq(topPoint.x, c.x))
    val topPointσ = σ + (topPoint.x → σ(c.x)) + (topPoint.y → (σ(c.y) - σ(r)))

    val botPoint = c.toIP("B")
    val botPointEqs = Set(Eq(botPoint.y, c.y plus r), Eq(botPoint.x, c.x))
    val botPointσ = σ + (botPoint.x → σ(c.x)) + (botPoint.y → (σ(c.y) + σ(r)))

    Set((midPoint, midPointEqs, midPointσ), (leftPoint, leftPointEqs, leftPointσ),
        (rightPoint, rightPointEqs, rightPointσ), (topPoint, topPointEqs, topPointσ),
        (botPoint, botPointEqs, botPointσ))
  }

  // for now, just the center
  def img(c: Point, h: Variable, w: Variable, σ: Store) = {
    val ret = c.toIP()
    val (retEq, retσ) = equality(ret, c, σ)
    Set((ret, retEq, retσ))
  }
}

// synthesis of positional interactions
// in general, take a program as input and produce a set of programs as output

object Positional {
  // simple translations
  // given a shape, return points s.t. dragging the point results in a translation.
  object Translate {
    def apply(s: Shape, σ: Store) = {
      // get mesh points for shape
      val candidates = PointGeneration(s, σ)
      // get translation links
      val newLinks = s match {
        case LineSegment(Point(a,b), Point(c,d)) ⇒ Set(a,b,c,d)
        case Rectangle(Point(a,b), Point(c,d))   ⇒ Set(a,b,c,d)
        case Circle(Point(a,b), _) ⇒ Set(a,b)
        case Image(Point(a,b), _, _) ⇒ Set(a,b)
        case _ ⇒ throw Incomplete
      }

      // add translation links to each candidate IPoint. candidates has type
      // Set[(IPoint, Set[Eq], Store)]
      candidates.map(v ⇒ (v._1.copy(links = v._1.links ++ newLinks), v._2, v._3))
    }
  }
  
  // Stretch interaction on shapes
  // given a shape, returns links that result in stretching
  // can cause poorly definied operations
  object Stretch {
    def apply(s: Shape, σ: Store) = {
      // get mesh points for shape
      val candidates = PointGeneration(s, σ)
      // get translation links
      val newLinks = s match {
        //case LineSegment(Point(a,b), Point(c,d)) ⇒ Set(a,b,c,d)
        //case Rectangle(Point(a,b), Point(c,d))   ⇒ Set(a,b,c,d)
        case Circle(_, c) ⇒ Set(c)
        //case Image(Point(a,b), _, _) ⇒ Set(a,b)
        case _ ⇒ throw Incomplete
      }

      // add translation links to each candidate IPoint. candidates has type
      // Set[(IPoint, Set[Eq], Store)]
      candidates.map(v ⇒ (v._1.copy(links = v._1.links ++ newLinks), v._2, v._3))
    }
  }
}
