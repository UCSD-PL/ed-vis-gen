package EDDIE.backend.validation

import EDDIE.backend.syntax._
import EDDIE.backend.semantics._
import EDDIE.backend.errors._

// simple static analysis passes
object Validate {
  // make sure every variable used in the program has a corresponding declaration
  // helper functions to collect variables
  type SV = Set[Variable]
  def getVars(s: Shape): SV = s match {
    case Circle(Point(x,y), r) ⇒ Set(x,y,r)
    case Triangle(Point(a,b), Point(c,d), Point(e,f)) ⇒ Set(a,b,c,d,e,f)
    case BoxLike(Point(x,y), h, w) ⇒ Set(x,y,h,w)
    case LineSegment(Point(a,b), Point(c,d)) ⇒ Set(a,b,c,d)
    case VecLike(Point(x,y), dx, dy) ⇒ Set(x,y,dx,dy)
  }
  def getVars(ip: IPoint): SV = Set(ip.x, ip.y) ++ ip.links
  def getVars(e: Eq): SV = e.lhs.vars.keySet ++ e.rhs.vars.keySet
  // @OPT: make tailrec
  def getVars(e: Expression): SV = e match {
    case Const(_) ⇒ Set()
    case Var(v) ⇒ Set(v)
    case BinOp(l, r, _) ⇒ getVars(l) ++ getVars(r)
    case UnOp(i, _) ⇒ getVars(i)
    case App(_, args) ⇒ args.flatMap(getVars _)(collection.breakOut)
  }
  def getVars(e: RecConstraint): SV = getVars(e.rhs) + e.lhs

  def checkVarDecls(p:Program) { p match {
    case Program(vars, ips, shapes, eqs, recs, rfvs) ⇒ {
      val allUses =
        ips.flatMap(getVars(_)) ++ shapes.flatMap(getVars(_)) ++
        eqs.flatMap(getVars(_)) ++ recs.flatMap(getVars(_)) ++ rfvs
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
      val δ = σ.restrict(e.lhs.vars.keySet ++ e.rhs.vars.keySet)
      println("error: variable declarations " ++ δ.toString)
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