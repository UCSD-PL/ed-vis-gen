package EDDIE.backend

import EDDIE.backend.syntax.JSTerms._
import EDDIE.backend.semantics._
import scala.collection.immutable._

// various helper functions and definitions
object Helpers {
  // given a bunch of objects, convert to strings and separate by single-spaces
  def prettyPrint(args:Any*) = args.map(_.toString()).mkString(" ")

  def DEBUG = false
  def dprintln(s:String) = if (DEBUG) println(s)

  // map with default value
  def mapWD[A, B](default: B) : Map[A, B] = Map().withDefaultValue(default)
}

// type aliases

object Types {
  type Configuration = State
  type IPConfig = (IPoint, Set[Eq], Store)
  type VarConfig = (Variable, Set[Eq], Store)
}
