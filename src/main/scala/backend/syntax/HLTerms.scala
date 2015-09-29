package EDDIE.backend.syntax.HLTerms
import EDDIE.backend.syntax.{JSTerms ⇒ JST}
import EDDIE.backend.semantics._

object HLTerms {

// references for shapes. TODO: add a map from names to shapes in JSTerms and
// parse named shapes
  type ShapeRef = String

  // NOAH: fill this out
  abstract class Physics
  case class Gravity(mass: ShapeRef, friction: JST.Variable, g: JST.Variable) extends Physics // example

  object Translate {
    def apply(ps: Set[Physics]): State = State.empty // NOAH: implement this
  }

}
