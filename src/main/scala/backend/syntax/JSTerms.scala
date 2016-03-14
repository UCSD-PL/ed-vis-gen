package EDDIE.backend.syntax.JSTerms

import EDDIE.backend.Helpers._

import scala.collection.immutable.{Map ⇒ Map, Set ⇒ Set}

trait Value // named javascript objects

// constraint variables
case class Variable(name:String) extends Value {
  override def toString = name
}
// convenience point class, interaction points. extends value for parsing.
case class Point(x: Variable, y: Variable) extends Value {
  def toIP(suffix:String = "") = {
    val (newx, newy) = (Variable(x.name ++ "_IX" ++ suffix), Variable(y.name ++ "_IY" ++ suffix) )
    IPoint(newx, newy)
  }
}
case class IPoint(x: Variable, y: Variable, links: Set[Variable]) extends Value {
  def toShrtString() = "(" + x.name + "," + y.name + ")"
  override def toString = "(" + x.toString + ", " +  y.toString +
    ",{" ++ (links.foldLeft(""){case (acc, v) ⇒ acc + ", " + v.toString()}).drop(2) + "}"
}

object IPoint {
  // constructor when just given variables
  def apply(x: Variable, y: Variable):IPoint = IPoint(x, y, Set(x,y))
}

// primitive shapes

// traits for fancy pattern matching
trait Boxy {
  def center: Point
  // for ease of helper functions, store half the height/width
  def hheight: Variable
  def hwidth: Variable

  def toVars = Set(center.x, center.y, hheight, hwidth)
}

object BoxLike {
    // extractor method
    def unapply(b: Boxy) = Some((b.center, b.hheight, b.hwidth))
}

trait Vecty {
  def base: Point
  def dx: Variable
  def dy: Variable

  def toVars = Set(base.x, base.y, dx, dy)
}

object VecLike {
    // extractor method
    def unapply(v: Vecty) = Some((v.base, v.dx, v.dy))
}


sealed abstract class Shape extends Value {
  def toVars: Set[Variable]
}

// """{"center": {"x": {"name": "X"}, "y": {"name": "Y"}, "radius": {"name": "R"}}}"""
case class Circle(center: Point, radius: Variable) extends Shape {
  def toVars = Set(center.x, center.y, radius)
}
case class Triangle(p1: Point, p2: Point, p3: Point) extends Shape {
  def toVars = Set(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y)
}
case class Rectangle(center: Point, hheight: Variable, hwidth: Variable) extends Shape with Boxy
case class Image(center: Point, hheight: Variable, hwidth: Variable, tagname: String) extends Shape with Boxy
case class LineSegment(begin: Point, end: Point) extends Shape {
  def toVars = Set(begin.x, begin.y, end.x, end.y)
}
case class Spring(base: Point, dx: Variable, dy: Variable) extends Shape with Vecty
case class Arrow(base: Point, dx: Variable, dy: Variable) extends Shape with Vecty

// constraint equations and affine expressions
// represent expressions as a constant plus a variable-to-coefficient map
// e.g. 5*x1 + 7*x2 + 3 = Expr(3, {x1 -> 5, x2 -> 7})
case class Expr(constant: Double, vars: Map[Variable, Double]) {
  override def toString(): String = {
    def each(nxt: (Variable, Double)): String = {
      (if (nxt._2 == 1.0)
          ""
       else if (nxt._2 == -1.0)
         "-"
        else
          nxt._2.toString ++ "*"
      ) ++ nxt._1.name
    }
    val intermezzo = Seq(constant.toString) ++ vars.map(each)
    if (intermezzo.size == 1) {
      constant.toString
    } else {
      (
        if (constant == 0.0)
          intermezzo.drop(1)
        else
          intermezzo
      ).addString(new StringBuilder(), " + ").replaceAllLiterally("+ -", "- ")
    }
  }

  // replace each instance of oldVal with newVal
  def substitute(subst: Map[Variable, Variable]): Expr = Expr(constant, subst.foldLeft(vars) {
    case (mp, (oldVal, newVal)) ⇒ {
      val restricted = mp.filterKeys(_ == oldVal)
      if (restricted.size == 0) {
        // if the key isn't present, ignore it
        mp
      } else {
        assert(restricted.size == 1, "multiple instances of " + oldVal + " in " + mp)
        mp - oldVal + (newVal → mp(oldVal))
      }
  }})

  // helper builders
  // if the rhs contains a variable, sum the cofficients
  def plus(that: Expr) = Expr(constant + that.constant,
    vars.foldLeft(that.vars)((acc, nxt) ⇒ {
      if (acc.contains(nxt._1))
        acc + (nxt._1 → (acc(nxt._1) + nxt._2))
      else
        acc + nxt
    }))
  def minus(that: Expr) = Expr(constant - that.constant,
    vars ++ that.vars.mapValues(-1 * _))
  def times(that: Double) = Expr(constant * that, vars.mapValues(that * _))
  def div(that: Double) = times(1/that)
  def size = vars.size
}

object Expr {
  def apply(c: Double): Expr = Expr(c, Map())
  def apply(v: Variable): Expr = Expr((v → 1.0))
  def apply(binding:(Variable, Double)): Expr = Expr(0.0, Map(binding))
}



trait EqLike {
  val lhs: Expr
  val rhs: Expr
  def count(vars: Set[Variable]) =
    ((lhs.vars.keySet ++ rhs.vars.keySet) & vars).size
  def contains(vars: Set[Variable]): Boolean =
    vars.exists((lhs.vars.keySet ++ rhs.vars.keySet).contains(_))
  def contains(v: Variable): Boolean = contains(Set(v))
  def remove(vars: Set[Variable]): Set[Variable] =
    (lhs.vars.keySet ++ rhs.vars.keySet) -- vars
  def remove(v: Variable):Set[Variable] = remove(Set(v))
  def vars = remove(Set[Variable]())

}
// lhs = rhs equation
case class Eq(lhs: Expr, rhs: Expr) extends EqLike {
  override def toString() = prettyPrint(lhs, "≡", rhs)
  def substitute(subst: Map[Variable, Variable]) =
    Eq(lhs.substitute(subst), rhs.substitute(subst))
}

// lhs <= rhs equation
case class Leq(lhs: Expr, rhs:Expr) extends EqLike {
  override def toString() = prettyPrint(lhs, "≤", rhs)
  def substitute(subst: Map[Variable, Variable]) =
    Leq(lhs.substitute(subst), rhs.substitute(subst))
}

// recursive one-way constraints of the form
// x <- e
case class RecConstraint(lhs: Variable, rhs: Expression) {
  def substitute(subst: Map[Variable, Variable]) = subst.foldLeft(this){
    case (RecConstraint(l, r), (oldV, newV)) ⇒ {
      val newL = (
        if (l == oldV)
          newV
        else
          l
      )
      val newR = Expression.substitute(rhs, oldV → newV) // TODO: do all substitutions at once
      RecConstraint(newL, newR)
    }
  }
}

// arithmetic expression grammar, plus function calls.
sealed abstract class Expression
case class Const(v: Double) extends Expression
case class Var(v: Variable) extends Expression with Value
case class BinOp(lhs: Expression, rhs: Expression, op: BOP) extends Expression
case class UnOp(inner: Expression, op: UOP) extends Expression
case class App(func: String, args: Seq[Expression]) extends Expression

object Expression {
  def substitute(e: Expression, bnding: (Variable, Variable)): Expression = e match {
    case Const(_) ⇒ e
    case Var(v) ⇒ {
      if (v == bnding._1)
        Var(bnding._2)
      else
        e
    }
    case BinOp(l, r, op) ⇒ BinOp(substitute(l, bnding), substitute(r, bnding), op)
    case UnOp(i, o) ⇒ UnOp(substitute(i, bnding), o)
    case App(f, args) ⇒ App(f, args.map{substitute(_, bnding)})
  }
}

// binary operations
// +,-,*,/,%
sealed abstract class BOP
object ⨁ extends BOP
object ⊖ extends BOP
object ⨂ extends BOP
object ⨸ extends BOP
object MOD extends BOP
// unary operations
// parens and negation
sealed abstract class UOP
object Paren extends UOP
object ¬ extends UOP

// programs are sets of variables, ipoints, primitives, constraint equations,
// recursive constraints, free variables in the recursive constraints, and a mapping of
// names to values
case class Program(
  vars: Set[Variable], ipoints: Set[IPoint], shapes: Set[Shape],
  equations : Set[Eq], inequalities: Set[Leq],
  recConstraints : Set[RecConstraint], freeRecVars: Set[Variable],
  names: Map[String, Value]
)

object Program {
  def empty = Program(Set(), Set(), Set(), Set(), Set(), Set(), Set(), Map())
  def takePoints(kv: (String, Value)) = kv._2 match {
    case _:IPoint ⇒ true
    case _ ⇒ false
  }
}
