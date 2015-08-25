package EDDIE.syntax

import EDDIE.Helpers

import scala.util.parsing.combinator.JavaTokenParsers
import scala.util.parsing.combinator.PackratParsers

import scala.collection.immutable.{Map ⇒ Map, Set ⇒ Set}

// abstract syntax definitions. at the moment, the supported nodes are variables,
// shapes, and constraint expressions/equations.

// TODO: if/when we write the compiler, add in everything else in Library.js,
// Primitives.js, and common.js

// constraint variables
case class Variable(name:String)
// convenience point class
case class Point(x: Variable, y: Variable)

// primitive shapes
sealed abstract class Shape
case class Circle(center: Point, radius: Variable) extends Shape
case class Triangle(p1: Point, p2: Point, p3: Point) extends Shape
case class Rectangle(topLeft: Point, botRight: Point) extends Shape
case class Image(center: Point, height: Variable, width: Variable) extends Shape
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
}

// lhs = rhs equation
case class Eq(lhs: Expr, rhs: Expr) {
  override def toString() = Helpers.prettyPrint(lhs, "≡", rhs)
}


// parsers for AST
object Parser extends JavaTokenParsers with PackratParsers {
  // variables, points, and shapes
  lazy val vrbl = ident ^^ {Variable(_)}
  lazy val pnt = "(" ~> (vrbl <~ ",") ~ vrbl <~ ")" ^^ {case l ~ r ⇒ Point(l,r)}

  // @TODO: factor out parens into a trait
  lazy val crc = "Circle(" ~> ((pnt <~ ",") ~ vrbl) <~ ")" ^^ {case l ~ r ⇒ Circle(l, r)}
  lazy val tri = "Triangle(" ~> ((pnt <~ ",") ~ (pnt <~ ",") ~ pnt) <~ ")" ^^ {
    case p1 ~ p2 ~ p3 ⇒ Triangle(p1, p2, p3)
  }
  lazy val rct = "Rectangle(" ~> ((pnt <~ ",") ~ pnt) <~ ")" ^^ {case l ~ r ⇒ Rectangle(l, r)}
  lazy val img = "Image(" ~> ((pnt <~ ",") ~ (vrbl <~ ",") ~ vrbl) <~ ")" ^^ {
    case c ~ h ~ w ⇒ Image(c, h, w)
  }
  lazy val lne = "Line(" ~> ((pnt <~ ",") ~ pnt) <~ ")" ^^ {case l ~ r ⇒ LineSegment(l, r)}


  lazy val shp = crc | tri | rct | img | lne

  // expressions and equations
  // allow numbers to be proceeded by a sign.
  override def decimalNumber = """-?(\d+(\.\d*)?|\d*\.\d+)""".r
  // variable, either with an implicit coefficient of 1 or an explicit coefficient
  lazy val term =
    (decimalNumber <~ "*") ~ vrbl ^^ {case n ~ v ⇒ (v → n.toDouble)} |
    vrbl ^^ {_ → 1.0}

  // holy one-liners batman. parse a sequence of either constants or terms,
  // separated by additions
  lazy val expr = rep1sep(
    term ^^ {Left(_)} | decimalNumber ^^ {s ⇒ Right(s.toDouble)}, "+"
    ).^^ {
    lst ⇒ { val (c, mp) =
      // keep a running sum of constants and a running map from variables to
      // coefficients.
      lst.foldLeft((0.0, Map[Variable, Double]()))(
        // foreach constant/term, either add in the constant or extend the map
        (acc, nxt) ⇒ nxt match {
          case Left(kv) => (acc._1, acc._2 + kv)
          case Right(n) => (acc._1 + n, acc._2)
        }
      )
      // package the resultant sum and variable map in an expression
      Expr(c, mp)
    }
  }
  lazy val equation = (expr <~ "=") ~ expr ^^ { case l ~ r ⇒ Eq(l,r) }

  // external parsing interface
  def tryParsing[T](start: PackratParser[T])(input: String) : T =
    parseAll(start, input) match {
      case Success(res, _) ⇒ res
      case failure: NoSuccess ⇒ scala.sys.error(failure.msg)
    }
  def parseShp(input:String) = tryParsing(shp)(input)
  def parseEq(input:String) = tryParsing(equation)(input)
  def parseExpr(input:String) = tryParsing(expr)(input)
  def apply(input: String) = parseShp(input)

}
