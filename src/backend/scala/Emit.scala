package EDDIE.emit

import EDDIE.syntax._
import EDDIE.errors._
import org.kiama.output.PrettyPrinter
import scala.collection.immutable.{Seq ⇒ Seq}


// case class Program(
//   vars: Set[Variable], ipoints: Set[IPoint], shapes: Set[Shape], equations : Set[Eq]
// )

object Emit extends PrettyPrinter {
  def TODO = text("TODO")

  // extract values from variable arguments and append style arguments
  def printConstructor(name:String, vargs:Seq[Variable], cargs: Seq[String] ) = {
    name <> parens( space <> nest(fillsep(
      (vargs.map(v ⇒ v.name /*+ ".value"*/).map(text(_)) ++
       cargs.map(s ⇒ dquotes(text(s)))),
      ",")
    ) <> space) <> semi
  }
  def printShape(s: Shape) = s match {
    case LineSegment(Point(a,b), Point(c,d)) ⇒ printConstructor(
      "ClosedLine", Seq(a,b,c,d), Seq("black", "black")
    )
    case Rectangle(Point(a,b), Point(c,d)) ⇒ printConstructor(
      "Rectangle", Seq(a,b,c,d), Seq("black", "black")
    )
    case Circle(Point(a,b), r) ⇒ printConstructor(
      "Circle", Seq(a,b,r), Seq("black", "black")
    )
    case Triangle(Point(a,b), Point(c,d), Point(e,f)) ⇒ printConstructor(
      "Triangle", Seq(a,b,c,d,e,f), Seq("black", "black")
    )
    // case Image(Point(a,b), _, _) ⇒ Set(a,b)
    case _ ⇒ TODO
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
  def apply(p: Program): String = {
    val doc = p match {
      case Program(vs, ps, ss, es) ⇒ {
        vcat(Seq("VARIABLES:" <@> indent(
          fillsep(vs.map(v ⇒ text(v.name))(collection.breakOut), ",")
        ),  "IPOINTS:" <@> indent(
          sep(ps.map(printIP(_))(collection.breakOut))
        ), "SHAPES:" <@> indent(
          sep(ss.map(printShape(_))(collection.breakOut))
        ), "EQUATIONS:" <@> indent(
          sep(es.map(printEquation(_))(collection.breakOut))
        )))
      }
    }
    pretty(doc)
  }
}
