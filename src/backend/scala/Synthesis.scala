package EDDIE.synthesis

import EDDIE.syntax._
import EDDIE.errors._
import EDDIE.Conversions._
import EDDIE.semantics._
import EDDIE.Helpers._

import scala.annotation.tailrec

// interaction point placements: given a shape, return all possible ipoints and
// their respective positional equations. e.g. Circle((a,b), c) => (a,b) + 8 points
// on the circle
object PointGeneration {
  type IPConfig = (IPoint, Set[Eq], Store)
  type VarConfig = (Variable, Set[Eq], Store)

  def VC2IPC(x: VarConfig, y: VarConfig) =
    (IPoint(x._1, y._1), x._2 ++ y._2, x._3 ++ y._3)
  def apply(s: Shape, σ: Store): Set[(IPConfig, IPConfig, IPConfig)] = (s match {
    case LineSegment(s, e) ⇒ line(s,e, σ)
    case BoxLike(c, h, w) ⇒ box(c, h, w, σ)
    case Circle(center, radius) ⇒ circ(center, radius, σ)
    case _ ⇒ throw Incomplete
  }).map(expandDimensions(_))

  // given a configuration, with IP free in both x and y dimensions, returns their
  // same configuration and also versions constrained in x and y dimensions.
  // the ordering is: (x-dim, y-dim, both)
  def expandDimensions(c:IPConfig): (IPConfig, IPConfig, IPConfig) = {
    dprintln("expanding " + c._1.toString)
    val xDim = c.copy(_1 = IPoint(c._1.x, c._1.y, c._1.links - c._1.x))
    val yDim = c.copy(_1 = IPoint(c._1.x, c._1.y, c._1.links - c._1.y))
    (xDim, yDim, c)
  }

  // helper function; link up an IP and a point by equality
  def equality(l: IPoint, r: Point, σ: Store) = {
    (Set(Eq(l.x, r.x), Eq(l.y, r.y)), σ + (l.x → σ(r.x)) + (l.y → σ(r.y)))
  }
  def ident(l: Variable, r: Variable, σ: Store): VarConfig = {
    (l, Set(Eq(l, r)), σ + (l → σ(r)))
  }
  def plus(l: Variable, r: Variable, σ: Store) : VarConfig = {
    val newVar = Variable(l.name ++ "P" ++ r.name)
    (newVar, Set(Eq(newVar, Expr(l) plus Expr(r))), σ + (newVar → (σ(l) + σ(r))))
  }

  def minus(l: Variable, r: Variable, σ: Store) : VarConfig = {
    val newVar = Variable(l.name ++ "M" ++ r.name)
    (newVar, Set(Eq(newVar, Expr(l) minus Expr(r))), σ + (newVar → (σ(l) - σ(r))))
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
  def box(center: Point, hheight: Variable, hwidth: Variable, σ: Store):Set[IPConfig] = {
    for {
      x <- Set(ident(center.toIP().x, center.x, σ),
               plus(center.x, hwidth, σ),
               minus(center.x, hwidth, σ))
      y <- Set(ident(center.toIP().y, center.y, σ),
               plus(center.y, hheight, σ),
               minus(center.y, hheight, σ))
    } yield (VC2IPC(x,y))
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
}

trait SynthesisPass {
  // given a seed set of links and equations, return a set of links which results
  // in a well-defined interaction. we enforce the invariant that every equation
  // contains either 2 free variables, or no free variables.
  def extendLinks(links: Set[Variable], eqs: Set[Eq]): Set[Set[Variable]] = {
    dprintln("for links " ++ links.toString ++ " and eqs " ++ eqs.toString)
    if (eqs.exists(e ⇒ e.count(links) > 2)) {
      Set()
    }
    else {
      dprintln("valid case")
      extendLinkHelper(links,
        eqs.filter(e ⇒ e.count(links) == 0),
        eqs.filter(e ⇒ e.count(links) == 1),
        eqs.filter(e ⇒ e.count(links) == 2))
    }
  }

  // given a set of links, a set of equation containing no free variables,
  // a set of equations containing one free variable, and a set of equations
  // containing two free variables, return all valid collections of links.
  // @OPT: make this function tail-recursive
  //@tailrec
  def extendLinkHelper(links: Set[Variable],
    empties: Set[Eq], semis: Set[Eq], fullfilled: Set[Eq]): Set[Set[Variable]] = {
      if (semis.isEmpty) {
        assert((empties ++ semis ++ fullfilled).forall(e ⇒ e.count(links) <= 2))
        Set(links)
      } else {
        // for each equation e in semis, for each fixed variable x in e, if x
        // respects the invariant, add x to links, adjust the sets, and recurse.
        val candidates = semis.flatMap(e ⇒ e.remove(links)).filter(v ⇒
          fullfilled.forall( e ⇒ e.count(Set(v)) == 0 ))

        dprintln("candidates:" ++ candidates.toString)

        // candidates :: v ∈ Set[Variable] | v can be added to links
        if (candidates.isEmpty) {
          assert((empties ++ semis ++ fullfilled).forall(e ⇒ e.count(links) <= 2))
          Set(links)

        } else {
          candidates.flatMap(v ⇒ {
            // adding v might bump some empties to semis, but not to fullfilleds.
            val (newEmpty, newSemi) = empties.partition(e ⇒ e.count(links + v) == 0)
            assert(newSemi.forall(e ⇒ e.count(links + v) == 1))
            // ditto for semis to fulls
            val (newSemi2, newFull) = semis.partition(e ⇒ e.count(links + v) == 1)
            assert(newFull.forall(e ⇒ e.count(links + v) == 2))
            assert(fullfilled.forall(e ⇒ e.count(links + v) == 2))
            extendLinkHelper( links + v,
              newEmpty, newSemi ++ newSemi2, newFull ++ fullfilled
            )}
          )
        }
      }
    }

  // return new links for a specific interaction, in the form
  // (xdim, ydim, x-and-y-dim)
  def getLinks(s: Shape): (Set[Variable], Set[Variable], Set[Variable])
  // default external interface for simple translations and stretches, which
  // only rely on links.
  // given a shape, return valid configurations s.t. dragging the point results
  // in an interaction.
  def apply(s: Shape, σ: Store) = {
    val candidates = PointGeneration(s, σ)

    // get new links from the client, transitively extend along dependencies
    // results in only well-defined interactions (i.e., every equation has 2/0
    // free variables)
    val (xLinks, yLinks, bothLinks) = getLinks(s)
    // TODO: refactor
    // TODO: seriously, refactor
    val res = candidates.flatMap(v ⇒ Set(
      (v._1._1.copy(links = v._1._1.links ++ xLinks), v._1._2, v._1._3),
      (v._2._1.copy(links = v._2._1.links ++ yLinks), v._2._2, v._2._3),
      (v._3._1.copy(links = v._3._1.links ++ bothLinks), v._3._2, v._3._3)
    )).flatMap( pr ⇒ extendLinks(pr._1.links, pr._2).map( lnks ⇒
        (pr._1.copy(links = lnks), pr._2, pr._3)
      )
    )

    assert(res.forall(v ⇒ v._2.forall( e ⇒ e.count(v._1.links) <= 2)
    ))

    res

  }
}


// synthesis of positional interactions
// in general, take a program as input and produce a set of programs as output

object Positional {
  // simple translations
  object Translate extends SynthesisPass {
    def getLinks(s: Shape) = s match {
      case LineSegment(Point(a,b), Point(c,d)) ⇒ (Set(b,d), Set(a,c), Set(a,b,c,d))
      case BoxLike(Point(a,b), _, _)   ⇒ (Set(b), Set(a), Set(a,b))
      case Circle(Point(a,b), _) ⇒ (Set(b), Set(a), Set(a,b))
      case _ ⇒ throw Incomplete
    }
  }

  // Stretch interaction on shapes
  // given a shape, returns links that result in stretching
  object Stretch extends SynthesisPass {
    def getLinks(s:Shape) = s match {
      //case LineSegment(Point(a,b), Point(c,d)) ⇒ Set(a,b,c,d)
      //case Rectangle(Point(a,b), Point(c,d))   ⇒ Set(a,b,c,d)
      case Circle(_, r) ⇒ (Set(r), Set(r), Set())
      //case Image(Point(a,b), _, _) ⇒ Set(a,b)
      case _ ⇒ throw Incomplete
    }
  }
}
