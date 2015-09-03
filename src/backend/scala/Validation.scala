package EDDIE.validation

import EDDIE.syntax._
import EDDIE.semantics._
import EDDIE.errors._

// simple static analysis passes
object Validate {
  // make sure every variable used in the program has a corresponding declaration
  // helper functions to collect variables
  def getVars(s: Shape): Set[Variable] = s match {
    case Circle(Point(x,y), r) ⇒ Set(x,y,r)
    case Triangle(Point(a,b), Point(c,d), Point(e,f)) ⇒ Set(a,b,c,d,e,f)
    case BoxLike(Point(x,y), h, w) ⇒ Set(x,y,h,w)
    case LineSegment(Point(a,b), Point(c,d)) ⇒ Set(a,b,c,d)
    case VecLike(Point(x,y), dx, dy) ⇒ Set(x,y,dx,dy)
  }
  def getVars(ip: IPoint): Set[Variable] = Set(ip.x, ip.y) ++ ip.links
  def getVars(e: Eq): Set[Variable] = e.lhs.vars.keySet ++ e.rhs.vars.keySet
  def checkVarDecls(p:Program) { p match {
    case Program(vars, ips, shapes, eqs) ⇒ {
      val allUses =
        ips.flatMap(getVars(_)) ++ shapes.flatMap(getVars(_)) ++ eqs.flatMap(getVars(_))
      if ((allUses diff vars).nonEmpty) {
        println("error: undefined variables " ++ (allUses diff vars).toString)
        throw IllformedProgram
      }
    }
  }}

  // make sure definitions of variables are consistent with equations
  // evaluator for expressions
  def evalExpr(e: Expr, σ: Store): Double = e.vars.foldLeft(e.constant){
    case (sum, (v, coeff)) ⇒ sum + σ(v) * coeff
  }
  def checkEqValues(p: Program, σ: Store) { p.equations.foreach{ e ⇒
    if (evalExpr(e.lhs, σ) != evalExpr(e.rhs, σ)) {
      println("error: variable declarations " ++ σ.toString)
      println("do not evaluate properly in "  ++ e.toString)
      println("specifically:")
      println(e.lhs.toString ++ " ⇒ " ++ evalExpr(e.lhs, σ).toString)
      println(e.rhs.toString ++ " ⇒ " ++ evalExpr(e.rhs, σ).toString)
      throw IllformedProgram
    }
  }}
  def apply(p: Program, σ: Store) {
    checkVarDecls(p)
    checkEqValues(p, σ)
  }
}
