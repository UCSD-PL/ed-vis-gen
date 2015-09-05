package EDDIE.syntax

import EDDIE.Helpers._

import scala.collection.immutable.{Map ⇒ Map, Set ⇒ Set}

// abstract syntax definitions. at the moment, the supported nodes are variables,
// shapes, and constraint expressions/equations.

// TODO: if/when we write the compiler, add in everything else in Library.js,
// Primitives.js, and common.js

// constraint variables
case class Variable(name:String)
// convenience point class, interaction points
case class Point(x: Variable, y: Variable) {
  def toIP(suffix:String = "") = {
    val (newx, newy) = (Variable(x.name ++ "_IX" ++ suffix), Variable(y.name ++ "_IY" ++ suffix) )
    IPoint(newx, newy)
  }
}
case class IPoint(x: Variable, y: Variable, links: Set[Variable])

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
}

object BoxLike {
    // extractor method
    def unapply(b: Boxy) = Some((b.center, b.hheight, b.hwidth))
}

trait Vecty {
  def base: Point
  def dx: Variable
  def dy: Variable
}

object VecLike {
    // extractor method
    def unapply(v: Vecty) = Some((v.base, v.dx, v.dy))
}


sealed abstract class Shape
case class Circle(center: Point, radius: Variable) extends Shape
case class Triangle(p1: Point, p2: Point, p3: Point) extends Shape
case class Rectangle(center: Point, hheight: Variable, hwidth: Variable) extends Shape with Boxy
case class Image(center: Point, hheight: Variable, hwidth: Variable, tagname: String) extends Shape with Boxy
case class LineSegment(begin: Point, end: Point) extends Shape
case class Spring(base: Point, dx: Variable, dy: Variable) extends Shape with Vecty
case class Arrow(base: Point, dx: Variable, dy: Variable) extends Shape with Vecty

// constraint equations and affine expressions
// represent expressions as a constant plus a variable-to-coefficient map
// e.g. 5*x1 + 7*x2 + 3 = Expr(3, {x1 -> 5, x2 -> 7})
case class Expr(constant: Double, vars: Map[Variable, Double]) {
  override def toString(): String = {
    def each(acc: String, nxt: (Variable, String)) = {
      acc ++ " + " ++ nxt._2 ++ "*" ++ nxt._1.name
    }
    val strs = vars.mapValues(_.toString)
    "(" ++ strs.foldLeft(constant.toString())(each) ++ ")"
  }

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
}

object Expr {
  def apply(c: Double): Expr = Expr(c, Map())
  def apply(v: Variable): Expr = Expr(0.0, Map(v → 1.0))
}

// lhs = rhs equation
case class Eq(lhs: Expr, rhs: Expr) {
  override def toString() = prettyPrint(lhs, "≡", rhs)
  def count(vars: Set[Variable]) = {
    val res = ((lhs.vars.keySet ++ rhs.vars.keySet) & vars).size
    dprintln("counting " ++ (lhs.vars.keySet ++ rhs.vars.keySet).toString ++
             " versus " ++ vars.toString ++ " as " ++ res.toString)
    res
  }
  def remove(vars: Set[Variable]) = (lhs.vars.keySet ++ rhs.vars.keySet) diff vars
}

// second order DEs, of the form
// x'' = f(x') + g(x)
// internally represented as an expression for RHS plus variable bindings for
// x'', x', and x, respectively

case class DE(equation: Expression, subject: Variable, derivative: Variable, plain: Variable)

// arithmetic expression grammar, plus function calls. at the moment, only sine/cosine are implemented.
sealed abstract class Expression
case class Const(v: Double) extends Expression
case class Var(v: Variable) extends Expression
case class BinOp(lhs: Expression, rhs: Expression, op: BOP) extends Expression
case class UnOp(inner: Expression, op: UOP) extends Expression
case class App(func: String, arg: Expression) extends Expression

// binary operations
// +,-,*,/
sealed abstract class BOP
object ⨁ extends BOP
object ⊖ extends BOP
object ⨂ extends BOP
object ⨸ extends BOP
// unary operations
// parens and negation
sealed abstract class UOP
object Paren extends UOP
object ¬ extends UOP

// for now, programs are sets of variables, ipoints, primitives, constraint equations,
// differential equations.
case class Program(
  vars: Set[Variable], ipoints: Set[IPoint], shapes: Set[Shape],
  equations : Set[Eq], diffEquations : Set[DE]
)
