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

  // helper builders
  def plus(that: Expr) = Expr(constant + that.constant, vars ++ that.vars)
  def minus(that: Expr) = Expr(constant - that.constant,
    vars ++ that.vars.mapValues(-1 * _))
  def times(that: Double) = Expr(constant * that, vars.mapValues(that * _))
  def div(that: Double) = times(1/that)
}

// lhs = rhs equation
case class Eq(lhs: Expr, rhs: Expr) {
  override def toString() = Helpers.prettyPrint(lhs, "≡", rhs)
}

// for now, programs are sets of variables, ipoints, primitives, and equations.
case class Program(
  vars: Set[Variable], ipoints: Set[IPoint], shapes: Set[Shape], equations : Set[Eq]
)



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

  // IPoints
  // @TODO: parse links
  lazy val ipoint = "IPoint(" ~> (vrbl <~ ",") ~ vrbl <~ ")" ^^ {case l ~ r ⇒ IPoint(l,r, Set())}
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

  // programs look like:
  // VARS(ident (, ident)*);
  // SHAPES(shape (, shape)*);
  // EQUATIONS(eq (, eq)*);

  type SP[T] = Parser[Set[T]]
  lazy val vars: SP[Variable] = rep1sep(ident, ",") ^^ {
    is ⇒ is.map(Variable(_)).toSet
  }
  lazy val shps: SP[Shape] = rep1sep(shp, ",") ^^ {_.toSet}
  lazy val eqs: SP[Eq]     = rep1sep(equation, ",") ^^ {_.toSet}

  lazy val program =
    (("VARS(" ~> vars <~ ");") ~ ("SHAPES(" ~> shps <~ ");") ~
    ("EQUATIONS(" ~> eqs <~ ");")) ^^ {
      case vs ~ ss ~ es ⇒ Program(vs, Set(), ss, es)
    }

  def tryParsing[T](start: PackratParser[T])(input: String) = parseAll(start, input) match {
    case Success(p, _) ⇒ Some(p)
    case failure: NoSuccess ⇒ None
  }

  // external parsing interface
  def parseShp(input:String) = tryParsing(shp)(input)
  def parseEq(input:String) = tryParsing(equation)(input)
  def parseExpr(input:String) = tryParsing(expr)(input)
  def parseIP(input:String) = tryParsing(ipoint)(input)
  def parseProg(input:String) = tryParsing(program)(input)
  def apply(input: String) = parseProg(input)

}
