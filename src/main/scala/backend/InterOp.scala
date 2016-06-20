package EDDIE.backend.InterOp
import EDDIE.backend.syntax.JSTerms._
import EDDIE.backend.Conversions._
import EDDIE.backend.semantics._

object ShapeConstraints {
  // given a set of shapes, return a set of inequalities representing valid
  // dimensions.
  // I.e., most geometric things should be non-negative
  // helper: given a variable, return a constraint encoding the variable is positive.
  def pos(v:Variable): Leq = Leq(5.0, v)
  def generateDimensionChecks(shapes: Set[Shape]) : Set[Leq] = shapes.flatMap{
    s ⇒ s match {
      // circles should have positive radiuses
      case Circle(Point(x,y), r) ⇒ Set(r)
      case BoxLike(Point(x,y), h, w) ⇒ Set(h, w)
      // no restraints on vectors, triangles, or lines
      case _ ⇒ Set[Variable]()
    }
  }.map(pos _)

  // given a state, extend the state with inequality constraints
  def apply(s: State): State = s.copy(prog = s.prog.copy (
    inequalities =
      s.prog.inequalities ++ generateDimensionChecks(s.prog.shapes)
  ))
}
