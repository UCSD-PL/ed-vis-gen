package EDDIE.backend.parser

import EDDIE.backend.syntax._
import EDDIE.backend.semantics._
import scala.collection.immutable.{Map ⇒ Map}


import scala.util.parsing.combinator.JavaTokenParsers
import scala.util.parsing.combinator.PackratParsers

// parsers for AST + initial store
object Parser extends JavaTokenParsers with PackratParsers {
  // ignore c-style comments (doesn't handle nesting properly, i don't think)
  protected override val whiteSpace = """(\s|//.*|(?m)/\*(\*(?!/)|[^*])*\*/)+""".r
  // variables, points, and shapes
  lazy val str = """'([a-zA-Z0-9_-]*)'""".r //single-quote characters, nums
  lazy val vrbl = ident ^^ {Variable(_)}
  lazy val pnt = "(" ~> (vrbl <~ ",") ~ vrbl <~ ")" ^^ {case l ~ r ⇒ Point(l,r)}

  // @TODO: factor out parens into a trait
  // @TODO: other refactoring...
  lazy val crc = "Circle(" ~> ((pnt <~ ",") ~ vrbl) <~ ")" ^^ {case l ~ r ⇒ Circle(l, r)}
  lazy val tri = "Triangle(" ~> ((pnt <~ ",") ~ (pnt <~ ",") ~ pnt) <~ ")" ^^ {
    case p1 ~ p2 ~ p3 ⇒ Triangle(p1, p2, p3)
  }
  lazy val rct = "Rectangle(" ~> ((pnt <~ ",") ~ (vrbl <~ ",") ~ vrbl) <~ ")" ^^ {case c ~ h ~ w ⇒ Rectangle(c, h, w)}
  lazy val img = "Image(" ~> ((pnt <~ ",") ~ (vrbl <~ ",") ~ (vrbl <~ ",") ~ str) <~ ")" ^^ {
    case c ~ h ~ w ~ s ⇒ Image(c, h, w, s)
  }
  lazy val lne = "Line(" ~> ((pnt <~ ",") ~ pnt) <~ ")" ^^ {case l ~ r ⇒ LineSegment(l, r)}
  lazy val spr = "Spring(" ~> ((pnt <~ ",") ~ (vrbl <~ ",") ~ vrbl) <~ ")" ^^ {
    case c ~ h ~ w ⇒ Spring(c, h, w)
  }
  lazy val arr = "Arrow(" ~> ((pnt <~ ",") ~ (vrbl <~ ",") ~ vrbl) <~ ")" ^^ {
    case c ~ h ~ w ⇒ Arrow(c, h, w)
  }
  lazy val shp = crc | tri | rct | img | lne | spr | arr

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
  // parse a sequence of either constants or terms,
  // separated by additions/subtractions
  lazy val expr = term ~ rep( "+" ~ term | "-" ~ term) ^^ {
    case e ~ es ⇒ es.foldLeft(Expr(e)) {
      case (l, "+" ~ r) ⇒ l plus (Expr(r))
      case (l, "-" ~ r) ⇒ l minus (Expr(r))
    }
  }

  lazy val equation = (expr <~ "=") ~ expr ^^ { case l ~ r ⇒ Eq(l,r) }

  // differential equations and expressions
  // standard arithmetic expression grammar + function apps

  // terminal values, unops, and fcalls
  type EP = Parser[Expression]
  lazy val efactor: EP = decimalNumber ^^ {s ⇒ Const(s.toDouble)} |
    "(" ~> expression <~ ")" ^^ {UnOp(_, Paren)} |
    "-" ~> expression ^^ {UnOp(_, ¬)} |
    ident ~ ("(" ~> repsep(expression, ",") <~ ")") ^^ {
      case f ~ args ⇒ App(f, args)
    } |
    vrbl ^^ {Var(_)}

  // products of factors, adapted from regexparser documentation
  lazy val eterm: EP = efactor ~ rep( "*" ~ efactor | "/" ~ efactor | "%" ~ efactor) ^^ {
    case e ~ es ⇒ es.foldLeft(e) {
      case (l, "*" ~ r) ⇒ BinOp(l, r, ⨂)
      case (l, "/" ~ r) ⇒ BinOp(l, r, ⨸)
      case (l, "%" ~ r) ⇒ BinOp(l, r, MOD)
    }
  }

  // sum of products, adapted from regexparser documentation
  lazy val expression: EP = eterm ~ rep( "+" ~ eterm | "-" ~ eterm) ^^ {
    case e ~ es ⇒ es.foldLeft(e) {
      case (l, "+" ~ r) ⇒ BinOp(l, r, ⨁)
      case (l, "-" ~ r) ⇒ BinOp(l, r, ⊖)
    }
  }

  // rec constraint declarations look like:
  // x <- expression
  lazy val rec = (vrbl <~ "<-") ~ expression ^^ {
    case x ~ e ⇒ RecConstraint(x, e)
  }

  // programs look like:
  // VARS(ident (, ident)*);
  // SHAPES(shape (, shape)*);
  // LINEAR(eq (, eq)*);
  // NONLINEAR(rec, (, rec)*);

  type SP[T] = Parser[Set[T]]
  lazy val vars = repsep(ident ~ ("=" ~> decimalNumber), ",") ^^ { is ⇒
    val bndings = is.map(_ match {case v ~ d ⇒ (Variable(v) → d.toDouble)}).toMap
    (bndings.keySet, Store(bndings))
  }
  lazy val shps: SP[Shape]          = repsep(shp, ",") ^^ {_.toSet}
  lazy val eqs: SP[Eq]              = repsep(equation, ",") ^^ {_.toSet}
  lazy val recs: SP[RecConstraint]  = repsep(rec, ",") ^^ {_.toSet}
  lazy val fvs: SP[Variable] = repsep(vrbl, ",") ^^ {_.toSet}

  lazy val program =
    (("VARS(" ~> vars <~ ");") ~ ("SHAPES(" ~> shps <~ ");") ~
    ("LINEAR(" ~> eqs <~ ");") ~ ("NONLINEAR(" ~> recs <~ ")") ~
     ("WITH FREE(" ~> fvs <~ ");")) ^^ {
      case (vs, σ) ~ ss ~ es ~ rcs ~ rfvs ⇒
      (Program(vs, Set(), ss, es, rcs, rfvs), σ)
    }

  def tryParsing[T](start: PackratParser[T])(input: String) = parseAll(start, input) match {
    case Success(p, _) ⇒ Left(p)
    case f: NoSuccess ⇒ Right(f.msg)
  }

  // external parsing interface
  def parseShp(input:String) = tryParsing(shp)(input)
  def parseEq(input:String) = tryParsing(equation)(input)
  def parseExpr(input:String) = tryParsing(expr)(input)
  def parseIP(input:String) = tryParsing(ipoint)(input)
  def parseProg(input:String) = tryParsing(program)(input)
  def apply(input: String) = parseProg(input)

}
