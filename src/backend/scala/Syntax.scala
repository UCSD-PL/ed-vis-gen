package EDDIE.syntax

import EDDIE.Helpers

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

// trait for fancy pattern matching
trait Boxy {
  def center: Point
  def height: Variable
  def width: Variable
}

object BoxLike {
    // extractor method
    def unapply(b: Boxy) = Some((b.center, b.height, b.width))
}


sealed abstract class Shape
case class Circle(center: Point, radius: Variable) extends Shape
case class Triangle(p1: Point, p2: Point, p3: Point) extends Shape
case class Rectangle(center: Point, height: Variable, width: Variable) extends Shape with Boxy
case class Image(center: Point, height: Variable, width: Variable) extends Shape with Boxy
case class LineSegment(begin: Point, end: Point) extends Shape

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

// lhs = rhs equation
case class Eq(lhs: Expr, rhs: Expr) {
  override def toString() = Helpers.prettyPrint(lhs, "≡", rhs)
  def count(vars: Set[Variable]) =
    ((lhs.vars.keySet ++ rhs.vars.keySet) & vars).size
  def remove(vars: Set[Variable]) = (lhs.vars.keySet ++ rhs.vars.keySet) diff vars
}

// for now, programs are sets of variables, ipoints, primitives, and equations.
case class Program(
  vars: Set[Variable], ipoints: Set[IPoint], shapes: Set[Shape], equations : Set[Eq]
)
