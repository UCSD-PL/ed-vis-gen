package EDDIE.backend.storage.parser

// Parsers for everything under the sun, except...:
// TODO: parse inequalities, links

import EDDIE.backend.syntax.JSTerms._
import EDDIE.backend.semantics._
import scala.collection.immutable.{Map ⇒ Map}
import EDDIE.backend.Helpers.DEBUG


import scala.util.parsing.combinator.JavaTokenParsers
import scala.util.parsing.combinator.PackratParsers

// parsers for AST + initial store
object Parser extends JavaTokenParsers with PackratParsers {
  type P[A] = PackratParser[A]
  type SP[A] = P[Set[A]]
  // ignore c-style comments (doesn't handle nesting properly, i don't think)
  protected override val whiteSpace = """(\s|//.*|(?m)/\*(\*(?!/)|[^*])*\*/)*""".r
  // allow numbers to be proceeded by a sign.
  override def decimalNumber = """-?(\d+(\.\d*)?|\d*\.\d+)""".r

  // logging helper
  @inline
  def mylog[A](parser: P[A])(msg: String): P[A] = if (DEBUG) {
    log(parser)(msg)
  } else {
    parser
  }

  @inline
  def parens[A](p: P[A]): P[A] = mylog("(" ~> (p <~ ")"))("parsing parens")
  @inline
  def brackets[A](p: P[A]): P[A] = mylog("[" ~> (p <~ "]"))("parsing brackets")
  // helper for constructors
  @inline
  def constructor[A](name: String, body: P[A]): P[A] = name ~> parens(body)
  @inline
  def commad[A](thing: P[A]): P[A] = thing <~ ","

  @inline
  def decl[T](rhs: P[T]) = ident ~ ("=" ~> rhs)
  @inline
  def commas[T](thing: P[T]) = repsep(thing, ",")
  @inline
  def collect[T](thing: P[T]) = commas(thing) ^^ {_.toSet}

  // unary, 2-arg, 3-arg, and 4-arg constructors
  @inline
  def unary[A](name: String, thing: P[A]) = constructor(name, thing)
  @inline
  def twoArg[A, B](name: String, fst: P[A], snd: P[B]) = constructor(name, commad(fst) ~ snd )
  @inline
  def threeArg[A, B, C](name: String, fst: P[A], snd: P[B], thrd: P[C]) =
    constructor(name, commad(fst) ~ commad(snd) ~ thrd)
  @inline
  def fourArg[A, B, C, D](name: String, fst: P[A], snd: P[B], thrd: P[C], last: P[D]) =
    constructor(name, commad(fst) ~ commad(snd) ~ commad(thrd) ~ last)




  // variables, points, and shapes
  lazy val str: P[String] = mylog(parser2packrat("""\'([a-zA-Z0-9_-]*)\'""".r))("parsing string") //single-quote characters, nums
  lazy val vrbl: P[Variable] = mylog(ident ^^ {Variable(_)})("parsing variable")
  lazy val pnt: P[Point] = mylog(parens( commad(vrbl) ~ vrbl ) ^^ {case l ~ r ⇒ Point(l,r)})("parsing point")

  lazy val crc: P[Circle] = twoArg("Circle", pnt, vrbl) ^^ {case l ~ r ⇒ Circle(l, r)}
  lazy val tri: P[Triangle] = threeArg("Triangle", pnt, pnt, pnt) ^^ {
    case p1 ~ p2 ~ p3 ⇒ Triangle(p1, p2, p3)
  }
  lazy val rct: P[Rectangle] =
    threeArg("Rectangle", pnt, vrbl, vrbl) ^^ {case c ~ h ~ w ⇒ Rectangle(c, h, w)}
  lazy val img: P[Image] = fourArg("Image", pnt, vrbl, vrbl, str) ^^ {
    case c ~ h ~ w ~ s ⇒ Image(c, h, w, s)
  }
  lazy val lne: P[LineSegment] = twoArg("Line", pnt, pnt) ^^ {case l ~ r ⇒ LineSegment(l, r)}
  lazy val spr: P[Spring] = threeArg("Spring", pnt, vrbl, vrbl) ^^ {
    case c ~ h ~ w ⇒ Spring(c, h, w)
  }
  lazy val arr: P[Arrow] = threeArg("Arrow", pnt, vrbl, vrbl) ^^ {
    case c ~ h ~ w ⇒ Arrow(c, h, w)
  }
  lazy val shp: P[Shape] = crc | tri | rct | img | lne | spr | arr

  // IPoints
  lazy val links = brackets(commas(vrbl))
  lazy val ipoint = threeArg("IPoint", vrbl, vrbl, links) ^^ {case l ~ r ~ ls ⇒ IPoint(l,r, ls.toSet)}
  // expressions and equations
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
  type EP = P[Expression]
  lazy val efactor: EP = decimalNumber ^^ {s ⇒ Const(s.toDouble)} |
    parens(expression) ^^ {UnOp(_, Paren)} |
    "-" ~> expression ^^ {UnOp(_, ¬)} |
    ident ~ parens( commas(expression)) ^^ {
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

  // e <= e
  lazy val leq = expr ~ ("<=" ~> expr) ^^ {
    case l ~ r ⇒ Leq(l, r)
  }

  // rec constraint declarations look like:
  // x <- expression
  lazy val rec = (vrbl <~ "<-") ~ expression ^^ {
    case x ~ e ⇒ RecConstraint(x, e)
  }

  // programs look like:
  // VARS (ident = num (, ident = num)*);
  // IPOINTS (ident = ipoint (, ident = ipoint)*);
  // SHAPES (ident = shape (, ident = shape)*);
  // LINEAR (eq (, eq)*);
  // LEQS (leq (, leq)*);
  // NONLINEAR (rec, (, rec)*);
  // WITH FREE (ident (, ident)*);

  // TODO: refactor

  lazy val vars = commas(decl(decimalNumber)) ^^ { is ⇒
    val bndings = is.map(_ match {case v ~ d ⇒ (Variable(v) → d.toDouble)}).toMap
    (bndings.keySet, Store(bndings))
  }

  lazy val ipoints = commas(decl(ipoint)) ^^ {is ⇒
    val bndings: Map[String, IPoint] = is.map{_ match {case v ~ p ⇒ (v → p)}}.toMap
    (bndings.map(_._2).toSet, bndings)
  }


  lazy val shps: P[(Set[Shape], Map[String, Value])] = commas(decl(shp)) ^^ {ss ⇒
    val bndings: Map[String, Shape] = ss.map{_ match {case v ~ s ⇒ (v → s)}}.toMap
    (bndings.map(_._2).toSet, bndings)
  }

  lazy val eqs: SP[Eq]              = collect(equation)
  lazy val leqs: SP[Leq]            = collect(leq)
  lazy val recs: SP[RecConstraint]  = collect(rec)
  lazy val fvs: SP[Variable] = collect(vrbl)


  lazy val program =
    (unary("VARS", vars) <~ ';')  ~ (unary("POINTS", ipoints) <~ ';') ~
    (unary("SHAPES", shps) <~ ';') ~ (unary("LINEAR", eqs) <~ ';') ~ (unary("LEQS", leqs) <~ ';') ~ (unary("NONLINEAR", recs) <~ ';') ~
    (unary("WITH FREE", fvs) <~ ';') ^^ {
      case (vs, σ) ~ ips ~ ss ~ es ~ les ~ rcs ~ rfvs ⇒
      (Program(vs, ips._1, ss._1, es, les, rcs, rfvs, ss._2 ++ ips._2 ++ vs.map(v ⇒ v.name → v).toMap), σ)
    }

  def tryParsing[T](start: P[T])(input: String) = parseAll(start, input) match {
    case Success(p, _) ⇒ Left(p)
    case f: NoSuccess ⇒ Right(f.toString())
  }

  // external parsing interface
  def parseShp(input:String) = tryParsing(shp)(input)
  def parseEq(input:String) = tryParsing(equation)(input)
  def parseExpr(input:String) = tryParsing(expr)(input)
  def parseIP(input:String) = tryParsing(ipoint)(input)
  def parseProg(input:String) = tryParsing(program)(input)
  def apply(input: String) = parseProg(input)

}
