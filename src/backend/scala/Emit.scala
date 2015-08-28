package EDDIE.emit

import EDDIE.syntax._
import EDDIE.errors._
import EDDIE.semantics._
import org.kiama.output.PrettyPrinter
import scala.collection.immutable.{Seq ⇒ Seq}


trait Emitter extends PrettyPrinter {
  def TODO: Doc = "TODO"
  def varPreamble: Doc
  def ipPreamble: Doc
  def shpPreamble: Doc
  def eqPreamble: Doc

  def printVar(v: Variable, initσ: Store): Doc
  def printIP(p: IPoint): Doc
  def printShape(s: Shape): Doc
  def printEquation(e: Eq): Doc

  // extract values from variable arguments and append style arguments
  def printConstructor(name:String, args:Seq[Doc] ) = {
    name <> parens( space <> nest(fillsep( args ,
      ",")
    ) <> space) <> semi
  }

  def apply(p: Program, initσ: Store): String = {
    val doc = p match {
      case Program(vs, ps, ss, es) ⇒ {
        vcat(Seq(varPreamble <@> indent(
          sep(vs.map(printVar(_, initσ))(collection.breakOut))
        ), ipPreamble <@> indent(
          sep(ps.map(printIP(_))(collection.breakOut))
        ), shpPreamble <@> indent(
          sep(ss.map(printShape(_))(collection.breakOut))
        ), eqPreamble <@> indent(
          sep(es.map(printEquation(_))(collection.breakOut))
        )))
      }
    }
    pretty(doc)
  }
}

// print out a high-level specification of the program
object HighLevel extends Emitter {
  def varPreamble = "VARIABLES:"
  def ipPreamble = "IPOINTS:"
  def shpPreamble = "SHAPES:"
  def eqPreamble = "EQUATIONS:"

  def printVar(v: Variable, σ: Store) = v.name <> semi

  def printShape(s: Shape) = {
    val (cname: String, args) = s match {
      case LineSegment(Point(a,b), Point(c,d)) ⇒ ("Line", Seq(a,b,c,d))
      case Rectangle(Point(a,b), Point(c,d)) ⇒ ("Rectangle", Seq(a,b,c,d))
      case Circle(Point(a,b), r) ⇒ ("Circle", Seq(a,b,r))
      case Triangle(Point(a,b), Point(c,d), Point(e,f)) ⇒ ("Triangle", Seq(a,b,c,d,e,f))
      case _ ⇒ (TODO, Seq())
    }
    printConstructor(cname, args.map(v ⇒ text(v.name)))
  }

  def printEquation(e: Eq) = {
    text(e.lhs + " = " +  e.rhs)
  }

  def printIP(p:IPoint) = p match {
    case IPoint(x, y, links) ⇒ {
      parens( space <>
        nest( text(x.name) <> comma <+> text(y.name) <> comma <+> braces(
              fillsep(links.map(v ⇒ text(v.name))(collection.breakOut), ",")
        )) <> space
      )
    }
  }
}

// print out a low-level javascript version of the program
object LowLevel extends Emitter {
  override def TODO = "//@TODO"
  def varPreamble = "//VARIABLES:"
  def ipPreamble = "//IPOINTS:"
  def shpPreamble = "//SHAPES:"
  def eqPreamble = "init_stays(); // SUPER IMPORTANT NEED THIS CALL" <@> "//EQUATIONS:"

  var varAlloc = -1;

  def printVar(v: Variable, σ:Store) =  {
    v.name <+> "=" <+> "makeVariable" <> parens(
      dquotes(text(v.name)) <> comma <+> σ(v).toString) <> semi
  }
  def printShape(s: Shape) = {
    // ugh mutable state
    varAlloc += 1
    "S" <> varAlloc.toString <+> "=" <+> {
      val (ctor:String, args) = s match {
        case LineSegment(Point(a,b), Point(c,d)) ⇒ ("ClosedLine", Seq(a,b,c,d))
        case Rectangle(Point(a,b), Point(c,d)) ⇒ ("Rectangle", Seq(a,b,c,d))
        case Circle(Point(a,b), r) ⇒ ("Circle", Seq(a,b,r))
        case Triangle(Point(a,b), Point(c,d), Point(e,f)) ⇒ ("Triangle", Seq(a,b,c,d,e,f))
        case _ ⇒ (TODO, Seq())
      }

      // fetch values from variables and append style options
      printConstructor(ctor, args.map(v ⇒ text(v.name ++ ".value")) ++
        Seq("rgba(0,0,0,0)", "black").map(s ⇒ dquotes(text(s)))
      )
    }
  }

  def printEquation(e: Eq) = {
    "addEquation" <> parens (
      indent( vsep(
        Seq(printExpr(e.lhs), printExpr(e.rhs)), comma
      ))
    ) <> semi
  }

  def printExpr(e: Expr) = e match { case Expr(c, vars) ⇒ {
    "fromConst" <> parens(text(c.toString)) <>
      (if (! vars.isEmpty) {
          ".plus" <> parens({
        // first, convert var → coeff mappings to coeff*var expressions
        val var2CoeffE  = vars.mapValues(coeff ⇒ text(coeff.toString))
        val varE2CoeffE = var2CoeffE.map(
          pr ⇒ "fromVar" <> parens(text(pr._1.name)) <> ".times" <> parens(pr._2)
        )(collection.breakOut)
        // finally, build a sum of coeff*var terms
        folddoc( varE2CoeffE, (acc, nxt) ⇒ acc <> ".plus" <> parens(nxt))
      })
    } else {
      empty
    })
  }}
  def printIP(p:IPoint) = p match {
    case IPoint(x, y, links) ⇒ {
      varAlloc += 1
      val vname = "IP" <> varAlloc.toString
      vname <+> "=" <+> printConstructor(
        "InteractionPoint", Seq(x, y).map(v ⇒ text(v.name))
      ) <@> vname <> ".links" <+> "=" <+> brackets(
        fillsep( links.map(v ⇒ dquotes(text(v.name)))(collection.breakOut), comma)
      ) <> semi
    }
  }
}
