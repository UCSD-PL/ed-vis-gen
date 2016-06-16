package EDDIE.backend.optimization

import EDDIE.backend.semantics._
import EDDIE.backend.validation._ // for usedVars
import EDDIE.backend.syntax.JSTerms._
import EDDIE.backend.Conversions._
import scala.annotation.tailrec

trait OptimizationPass {
  def apply(s: State): State
}

// run all opts
object OptimizeAll extends OptimizationPass {
  def apply(s: State): State = EquationOpts(s)
}

// optimizations centered around cassowary equations
object EquationOpts extends OptimizationPass {

  // removed unused variables
  def pruneVars(s: State): State = {
    val used = Validate.getUsedVars(s.prog)
    State(s.prog.copy(vars = s.prog.vars & used), s.σ.restrict(used))
  }

  def shapeMap(s: Shape, f: Variable ⇒ Variable): Shape = s match {
    case LineSegment(Point(sx, sy), Point(ex, ey)) ⇒ LineSegment((f(sx), f(sy)), (f(ex), f(ey)))
    case Rectangle(Point(a,b), h, w) ⇒ Rectangle((f(a), f(b)), f(h), f(w))
    case Image(Point(a,b), h, w, src) ⇒ Image((f(a), f(b)), f(h), f(w), src)
    case Circle(Point(a,b), r) ⇒ Circle((f(a), f(b)), f(r))
    case Triangle(Point(a,b), Point(c,d), Point(e,g)) ⇒ //lolg
      Triangle((f(a), f(b)), (f(c), f(d)), (f(e), f(g)))
    case Spring(Point(a,b), dx, dy) ⇒ Spring((f(a), f(b)), f(dx), f(dy))
    case Arrow(Point(a,b), dx, dy) ⇒ Arrow((f(a), f(b)), f(dx), f(dy))
  }
  // given a pair of equal variables, inline one of the variables everywhere
  // in the state.
  // arbitrarily pick r as the remaining variable
  def inlineOnce(l: Variable, r: Variable, s: State): State = s match {
    case State(Program(vars, ips, rups, shps, eqs, leqs, recs, freeRVs, chrts, nms, snaps), σ) ⇒ {
      def subst(v: Variable) = {
        if (v == l)
          r
        else
          v
      }
      val newVars = vars - l
      val newIPs = ips.map{ case IPoint(x, y, lnks) ⇒
        val newx = subst(x)
        val newy = subst(y)
        IPoint(newx, newy, lnks.map(subst _))
      }
      val newSnaps = snaps.map{ case IPoint(x, y, lnks) ⇒
        val newx = subst(x)
        val newy = subst(y)
        IPoint(newx, newy, lnks.map(subst _))
      }
      val mapper = Map(l → r)
      val newShps = shps.map{shapeMap(_, subst)}
      val newEqs = eqs.map{e ⇒ e.substitute(mapper)}.filterNot(trivialEq)
      val newLeqs = leqs.map{e ⇒ e.substitute(mapper)}.filterNot(trivialEq)
      val newRecs = recs.map{decl ⇒ decl.substitute(mapper)}
      val newRups = rups.map{decl ⇒ decl.substitute(mapper)}
      val newFrees = (
        if (freeRVs.contains(l))
          freeRVs - l + r
        else
          freeRVs
      )
      val newNames = nms.mapValues{ v ⇒ v match {
        case s:Shape ⇒ shapeMap(s, subst)
        case vrble:Variable ⇒ subst(vrble)
        case Point(x, y) ⇒ Point(subst(x), subst(y))
        case IPoint(x, y, lnks) ⇒ IPoint(subst(x), subst(y), lnks.map(subst))
        case Chart(e, lo, hi) ⇒ Chart(Expression.substitute(e, l → r), lo, hi)
      }}

      val newChrts = chrts.map{c ⇒ c.copy(expr = Expression.substitute(c.expr, l → r))}
      val γ = σ - l
      State(Program(newVars, newIPs, newRups, newShps, newEqs, newLeqs, newRecs, newFrees, newChrts, newNames, newSnaps), γ)
  }}

  // helper to check if an equation looks like a + x = a + y, where x and y are variables.
  // i think it misses stuff like 0 = y - x, unfortunately...
  def simpEq(e: Eq): Boolean = {
    (e.lhs.constant == e.rhs.constant)  &&
    (e.lhs.vars.size == 1) && (e.rhs.vars.size == 1) &&
    (e.lhs.vars.head._2 == 1.0) && (e.rhs.vars.head._2 == 1.0)
  }
  def trivialEq[A <: EqLike](e: A): Boolean = e.lhs == e.rhs
  @tailrec
  def inlineAll(s: State) : State = s match { case State(prog, _) ⇒ {
    prog.equations.find(simpEq) match {
      case Some(se) ⇒ inlineAll(inlineOnce(se.lhs.vars.head._1, se.rhs.vars.head._1, s))
      case _ ⇒ s
    }}}
  def apply(s: State): State = pruneVars(inlineAll(s))
}
