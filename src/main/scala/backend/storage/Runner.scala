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

  def addPhysics(physicsStr: String, freeVarStr: String, onReleaseStr: String, orig: State): State = {
    val recs = Parser.tryParsing(Parser.recs)(physicsStr)
    val freeVars = Parser.tryParsing(Parser.fvs)(freeVarStr)
    val onrecs = Parser.tryParsing(Parser.recs)(onReleaseStr)
    // println((physicsStr, freeVarStr, onReleaseStr))

    (recs, freeVars, onrecs) match {
      case (Left(rcs), Left(frees), Left(onrcs)) =>
        val newVars = (rcs ++ onrcs).map(e => e.lhs) //.filter(v => orig.σ)
        orig.copy( prog = orig.prog.copy(
          vars = orig.prog.vars ++ newVars,
          recConstraints = rcs,
          releaseUpdates = onrcs,
          freeRecVars = frees
        ))
      case _ => println((recs, freeVars, onrecs)); throw ParseError
    }
  }

  def parseJSonFromFile(filename: String): State = {
    val fle = fromURL(getClass.getResource("/" ++ filename))
    Json2Ast(fle.mkString)
  }
}
