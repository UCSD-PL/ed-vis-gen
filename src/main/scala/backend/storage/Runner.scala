// Storage utilites, an API for loading in programs. Currently, we can:
// parse from file/string using an internal DSL
// parse from json, in direct/file/string format

package EDDIE.backend.storage.runner
// for the data structures and internal API
import EDDIE.backend.syntax.JSTerms._
import EDDIE.backend.semantics._
import EDDIE.backend.storage.parser._
import EDDIE.backend.storage.json._

import EDDIE.backend.errors._ // parse error
import scala.io.Source._ // fromURL


object Run {

  def parseFromSource(filename: String): State = {
    val fle = fromURL(getClass.getResource("/" ++ filename))
    val (prog: Program, initσ: Store) = Parser(fle.mkString) match {
      case Left(p) ⇒ p
      case Right(msg) ⇒ println(msg); throw ParseError
    }
    State(prog, initσ)
  }

  def parseJSonFromFile(filename: String): State = {
    val fle = fromURL(getClass.getResource("/" ++ filename))
    Json2Ast(fle.mkString)
  }
}
