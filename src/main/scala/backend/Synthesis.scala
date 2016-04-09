package EDDIE.backend.synthesis

import EDDIE.backend.syntax.JSTerms._
import EDDIE.backend.Conversions._
import EDDIE.backend.semantics._
import EDDIE.backend.Helpers._
import EDDIE.backend.Types._


// interaction point placements: given a shape, return all possible ipoints and
// their respective positional equations. e.g. Circle((a,b), c) => (a,b) + 8 points
// on the circle
// TODO: maybe also add inequalities for enforcing orientation?
object PointGeneration {
  def VC2IPC(x: VarConfig, y: VarConfig) =
    (IPoint(x._1, y._1), x._2 ++ y._2, x._3 ++ y._3)
  def apply(s: Shape, σ: Store): Set[IPConfig] = (s match {
    case LineSegment(s, e) ⇒ line(s,e, σ)
    case BoxLike(c, h, w) ⇒ box(c, h, w, σ)
    case VecLike(c, dx, dy) ⇒ vec(c, dx, dy, σ)
    case Circle(center, radius) ⇒ circ(center, radius, σ)
    case Triangle(p1, p2, p3) ⇒ tri(p1, p2, p3, σ)
  })

  // helper function; link up an IP and a point by equality
  def equality(l: IPoint, r: Point, σ: Store) = {
    (Set(Eq(l.x, r.x), Eq(l.y, r.y)), σ + (l.x → σ(r.x)) + (l.y → σ(r.y)))
  }
  def ident(l: Variable, r: Variable, σ: Store): VarConfig = {
    (l, Set(Eq(l, r)), σ + (l → σ(r)))
  }
  def plus(l: Variable, r: Variable, σ: Store, coeff: Double = 1) : VarConfig = {
    val newVar = Variable(l.name + "_P_" + coeff.toString.replace('.', '$') + "_T_" + r.name)
    (newVar, Set(Eq(newVar, Expr(l) plus (Expr(r) times coeff))), σ + (newVar → (σ(l) + coeff * σ(r))))
  }

  def minus(l: Variable, r: Variable, σ: Store, coeff: Double = 1) : VarConfig = {
    val newVar = Variable(l.name + "_M_" + coeff.toString.replace('.', '$') + "_T_" + r.name)
    (newVar, Set(Eq(newVar, Expr(l) minus (Expr(r) times coeff))), σ + (newVar → (σ(l) - coeff*σ(r))))
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

  // endpoints, midpoints of each line, and overall midpoint
  def tri(p1: Point, p2: Point, p3: Point, σ: Store):Set[IPConfig] = {
    val midPoint = Set() // TODO
    line(p1, p2, σ) ++ line(p2, p3, σ) ++ line(p1, p3, σ) ++ midPoint
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

  // center and both ends
  // * - * - *>
  def vec(base: Point, dx: Variable, dy: Variable, σ: Store):Set[IPConfig] = {
    Set(
      (ident(base.toIP().x, base.x, σ), ident(base.toIP().y, base.y, σ)),
      (plus(base.x, dx, σ), plus(base.y, dy, σ)),
      (plus(base.x, dx, σ, 0.5), plus(base.y, dy, σ, 0.5))
    ).map{case (x,y) ⇒ VC2IPC(x,y)}
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
  def circ(c: Point, r: Variable, σ: Store): Set[IPConfig] = {
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

  // given a program and store, return all configurations (i.e., programs
  // and stores)
  def apply(orig: Configuration): Set[Configuration]
}


// synthesis of positional interactions
object Positional extends SynthesisPass {


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

  sealed abstract class Color
  case object Empty extends Color
  case class Half(src: Variable) extends Color
  case class Full(src: Variable, snk: Variable) extends Color

  type Coloring = Map[Eq, Color]
  def extendLinksAll(links: Set[Variable], eqs: Set[Eq]): Set[Set[Variable]] = {
    dprintln("for links " ++ links.toString ++ " and eqs " ++ eqs.toString)
    if (eqs.exists(e ⇒ e.count(links) >= 2)) {
      dprintln("degenerate case")
      Set()
    }
    else {
      val initColor = eqs.map{ e ⇒ links.find(v ⇒ e.contains(v)) match {
          case Some(v) ⇒ (e → Half(v))
          case _ ⇒ (e → Empty)
      }}.toMap

      dprintln("seed equations: " + initColor.toString)
      val validColors = elaHelper(initColor)


      validColors.map{ coloring ⇒ coloring.foldLeft(Set[Variable]()){ case (acc, (_, color)) ⇒ color match {
          case Full(s, k) ⇒ acc + s + k
          case Empty ⇒ acc
          case _ ⇒ assert(false); acc
      }}}(collection.breakOut)

    }
  }

  // helper function for ELA: given a coloring, compute all possible colorings

  //   * associate configurations with colorings (a map from equation to empty/Source/Source + Sink).



  def elaHelper(init: Coloring): Set[Coloring] = {
    //   * a configuration is **consistent** if every equation has either one source + sink
    //     OR no sources or sinks
    val done = init.forall{case (_, color) ⇒ color match {
        case Half(_) ⇒ false
        case _ ⇒ true
    }}

    if (done) {
      dprintln("finished with " + init.toString)
      Set(init)
    } else {
      dprintln("recursive input: " + init.toString)
      // we map equations to a set of candidate colorings because we need to consider
      // the remaining equations modulo the seed equation

      //     a candidate:
      //       ** lives in a equation with a Source
      // TODO: broken
      val candidates = init.flatMap{ case (eq, color) ⇒ color match {
          case Half(src) ⇒ eq.remove(src).map(v ⇒ eq → Full(src, v))
          case _ ⇒ Map[Eq, Full]()
      }}(collection.breakOut)

  //       ** is not a Source/Sink in another equation, and doesn't break the
  //          Source/Sink abstraction (i.e. isn't a Sink twice, each equation
  //          has one Source + Sink

      // TODO: probably have to add this check at the end
      val newCands = candidates.filter{ case (eq, Full(oldSrc, newSink)) ⇒ (init - eq).forall{ case (eq, color) ⇒ color match {
          case Empty ⇒ true
          case Half(src) ⇒ !eq.contains(newSink)
          case Full(src, snk) ⇒ (! eq.contains(newSink)) && (src != newSink) && (snk != newSink)
      }}}

      dprintln("recursing with candidates: " + newCands.toString)
      //     foreach candidate:
      //       ** add the candidate to the configuration

      newCands.flatMap{ case (seedEq, cand) ⇒ {
        //       ** color the candidate as a Sink in the other equations
        dprintln("recoloring based on " + cand.toString)

        val inter = (init-seedEq).toSet
        val res = inter.map{
          case (eq:Eq, color:Color) ⇒ color match {
            case Empty ⇒ if (eq.contains(cand.snk)) {
                dprintln("adding " + cand.snk.toString + " in " + eq.toString)
                (eq → Half(cand.snk))
              } else {
                dprintln("not adding " + cand.snk.toString + " in " + eq.toString)
                (eq → Empty)
              }

            case _ ⇒
                dprintln("not adding " + cand.snk.toString + " in " + eq.toString)
                (eq → color)

          }
        }(collection.breakOut)

        elaHelper((res :+ (seedEq → cand)).toMap)

    }}(collection.breakOut)
  }}

  // given an IP, return valid seed configurations for extendLinks:
  def validSeeds(i:IPoint): Set[Set[Variable]] = Set(Set(i.x), Set(i.y), Set(i.x, i.y))

  // given a program and store, return all configurations (i.e., programs
  // and stores) implementing positional interactions in one IPoint
  def apply(orig: Configuration): Set[Configuration] = orig match {
    case State(p@Program(vars, ips, _, shapes, eqs, _, _, _, _, names), σ) ⇒ shapes.flatMap { s ⇒ {
      val candidates = PointGeneration(s, σ)

      val res = candidates.flatMap { case (ip, es, δ) ⇒ {
        validSeeds(ip).flatMap(
          extendLinksAll(_, eqs ++ es).map( lnks ⇒ (ip.copy(links = lnks), eqs ++ es, δ))
        )
      }}

      assert(
        res.forall{ case (ip, eqs, _) ⇒ eqs.forall( e ⇒ e.count(ip.links) <= 2)
      })

      res
    }}.map{ case(ip, es, δ) ⇒
      State(p.copy(
        vars = vars ++ Set(ip.x, ip.y),
        ipoints = ips + ip,
        equations = eqs ++ es,
        names = State.nameIP(names, ip)
      ), δ)
    }
  }
}

// synthesis of equations
// * fuzzy snapping: for all generated points within some threshold of each other:
//   ** add in equality between original variables

object EquationPass extends SynthesisPass {

  val DIST_THRESH = 4

  def eval(c: IPConfig) : (Double, Double) = c match {
    case (IPoint(x, y, _), _, σ) ⇒ (σ(x), σ(y))
  }
  def strictEq(lhs: IPConfig, rhs: IPConfig): Boolean = {
    val (lip, rip) = (lhs._1, rhs._1)
    lip.x.name == rip.x.name && lip.y.name == rip.y.name
  }
  def fuzzEq(lhs: IPConfig, rhs: IPConfig): Boolean = {
    val (lx, ly) = eval(lhs)
    val (rx, ry) = eval(rhs)

    // scala library function for √(lhs^2 + rhs^2)
    math.hypot(lx - rx, ly - ry) < DIST_THRESH
  }

  // given two ipconfigs, produce a "configuration" s.t. the new configuration
  // acts like the union of the input configs.
  // for now, take the contents of both sides and add an additional equality
  // constraint between the lhs and rhs variables

  // TODO: use only one intermediate variable, substitute in both LHS and RHS
  def mergeConfigs(lhs: IPConfig, rhs: IPConfig) : (Set[Variable], Set[Eq], Store) = (lhs, rhs) match {
    case ((lip, leqs, σ), (rip, reqs, γ)) ⇒ {
      val newXVar = Variable(lip.x.name + "$" + rip.x.name)
      val newYVar = Variable(lip.y.name + "$" + rip.y.name)
      val newEqs =  leqs.map(e ⇒ e.substitute(Map(lip.x → newXVar, lip.y → newYVar))) ++
                    reqs.map(e ⇒ e.substitute(Map(rip.x → newXVar, rip.y → newYVar)))
      val newσ = Store(Set(newXVar → σ(lip.x), newYVar → σ(lip.y)))
      (Set(newXVar, newYVar), newEqs, newσ)
    }
  }


  // zip up all configs, filter out identical points, and keep configs that are
  // equal w.r.t fuzzEq
  def apply(orig: Configuration): Set[Configuration] = orig match {
    case State(Program(vars, ips, _, shapes, eqs, _, _, _, _, names), σ) ⇒ {
      val allPoints = shapes.flatMap(s ⇒ PointGeneration(s, σ))
      val candidates = (for {
        l <- allPoints
        r <- allPoints
        if (! strictEq(l, r)) // filter out strict equality
        if (fuzzEq(l, r)) // select positionally equal points
      } yield {
        (l, r)
      }).foldLeft(Set[(IPConfig, IPConfig)]()){ case (acc, pr) ⇒ // filter out symmetries
        if (acc.contains(pr.swap))
          acc
        else
          acc + pr
      }

      //println("inter: " + intermezzo.toString)
      //println("candidates: " + candidates.toString())

      // take all the candidate equations, variables, and stores
      val res = Set() + candidates.map{(mergeConfigs _).tupled}.foldLeft(orig) { case (State(prog, α), (vars, newEqs, γ)) ⇒
        State(prog.copy(
          vars = prog.vars ++ vars,
          equations = prog.equations ++ newEqs,
          names = prog.names ++ vars.map{v ⇒ (v.name → v)}
        ), α ++ γ)
      }


      //println("done with equations")
      res
    }
  }
}
