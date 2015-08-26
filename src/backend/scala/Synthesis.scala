package EDDIE.synthesis

import EDDIE.syntax._
import EDDIE.errors._
import EDDIE.Conversions._

// interaction point placements: given a shape, return all possible ipoints and
// their respective positional equations. e.g. Circle((a,b), c) => (a,b) + 8 points
// on the circle
object PointGeneration {
  def apply(s: Shape): Set[(IPoint, Set[Eq])] = s match {
    case LineSegment(s, e) ⇒ line(s,e)
    case Rectangle(tl, br) ⇒ rect(tl, br)
    case Circle(center, radius) ⇒ circ(center, radius)
    case Image(center, height, width) ⇒ img(center, height, width)
    case _ ⇒ throw Incomplete
  }

  // helper function; link up an IP and a point by equality
  def equalityEqs(l: IPoint, r: Point) = Set(Eq(l.x, r.x), Eq(l.y, r.y))
  // helper function; link up an IP to the midpoint of two points
  def midPointEqs(ip: IPoint, l: Point, r: Point) = Set[Eq]() +
    Eq(ip.x, (l.x plus r.x) div 2.0) +
    Eq(ip.y, (l.y plus r.y) div 2.0)

  // given two points, build an IP for the midpoint and relevant equations
  def makeMP(l: Point, r: Point) = {
    val ip = IPoint(
      l.x.name ++ "_" ++ r.x.name ++ "_MPX",
      l.y.name ++ "_" ++ r.y.name ++ "_MPY")
    (ip, midPointEqs(ip, l, r))
  }

  // the beginning, the end, and the midpoint
  // assumes start and end are points defined in the program
  def line(start: Point, end: Point) = {
    val sip = start.toIP()
    val eip = end.toIP()
    val startEqs = equalityEqs(sip, start)
    val endEqs = equalityEqs(eip, end)

    val (mip, midEqs) = makeMP(start, end)

    // wrap everything up in tuples and return
    Set((sip → startEqs), (eip → endEqs), (mip → midEqs))
  }

  // 3 lines, including midpoints: tL -> tR, mL -> mR, bL -> bR
  // visually:
  // * - * - *
  // |       |
  // *   *   *
  // |       |
  // * - * - *
  def rect(topLeft: Point, botRight: Point) = {
    // phantom points, valid because topLeft and botRight are already points
    val topRight = Point(botRight.x, topLeft.y)
    val botLeft  = Point(topLeft.x, botRight.y)

    line(topLeft, topRight) ++ line(botLeft, botRight) ++
      Set(makeMP(topLeft, botLeft), makeMP(topRight, botRight), makeMP(topLeft, botRight))
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
  def circ(c: Point, r: Variable) = {
    val midPoint = c.toIP()
    val midPointEqs = equalityEqs(midPoint, c)

    // @TODO: refactor...
    val leftPoint = c.toIP("L")
    val leftPointEqs = Set(Eq(leftPoint.x, c.x minus r), Eq(leftPoint.y, c.y))

    val rightPoint = c.toIP("R")
    val rightPointEqs = Set(Eq(rightPoint.x, c.x plus r), Eq(rightPoint.y, c.y))

    val topPoint = c.toIP("T")
    val topPointEqs = Set(Eq(topPoint.y, c.y minus r), Eq(topPoint.x, c.x))

    val botPoint = c.toIP("B")
    val botPointEqs = Set(Eq(botPoint.y, c.y plus r), Eq(botPoint.x, c.x))

    Set((midPoint → midPointEqs), (leftPoint → leftPointEqs),
        (topPoint → topPointEqs), (rightPoint → rightPointEqs),
        (botPoint → botPointEqs))
  }

  // for now, just the center
  def img(c: Point, h: Variable, w: Variable) = {
    val ret = c.toIP()
    Set((ret → equalityEqs(ret, c)))
  }
}

// synthesis of positional interactions
// in general, take a program as input and produce a set of programs as output
//
object Positional {
  // simple translations
  // given a shape, return points s.t. dragging the point results in a translation.
  object Translate {
    def apply(s: Shape) = {
      // get mesh points for shape
      val candidates = PointGeneration(s)
      // get translation links
      val newLinks = s match {
        case LineSegment(Point(a,b), Point(c,d)) ⇒ Set(a,b,c,d)
        case Rectangle(Point(a,b), Point(c,d))   ⇒ Set(a,b,c,d)
        case Circle(Point(a,b), _) ⇒ Set(a,b)
        case Image(Point(a,b), _, _) ⇒ Set(a,b)
        case _ ⇒ throw Incomplete
      }

      // add translation links to each candidate IPoint. candidates has type
      // Set[(IPoint, Set[Eq])]
      candidates.map(v ⇒ (v._1.copy(links = v._1.links ++ newLinks), v._2))
    }
  }
}

object Tester extends App {
  // the magic of implicit conversions :)
  val p1 = ("foo", "bar")
  val p2 = ("baz", "boo")
  val shp = Circle(p1, "radius")
  println(Positional.Translate(shp))
}
