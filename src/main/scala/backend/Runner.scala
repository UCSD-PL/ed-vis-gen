package EDDIE.backend.runner

import EDDIE.backend.syntax._
import EDDIE.backend.semantics._
import EDDIE.backend.parser._
import EDDIE.backend.synthesis._
import EDDIE.backend.emit._
import EDDIE.backend.errors._
import EDDIE.backend.ranking._
import EDDIE.backend.validation._

import scala.io.Source._

object Run {
  // TODO: command line parsing
  // public api for backend
  // given a source file, compile the file to a string
  def loadSource(name: String) : State = {
    val fle = fromURL(getClass.getResource("/" ++ name))
    val (prog: Program, initσ: Store) = Parser(fle.mkString) match {
      case Left(p) ⇒ p
      case Right(msg) ⇒ println(msg); throw ParseError
    }
    State(prog, initσ)
  }

  def compileState(ζ: State, validate: Boolean = false) : String = {
    if (validate) {
      Validate(ζ.prog, ζ.σ)
    }
    LowLevel(ζ.prog, ζ.σ)
  }
  def compileSource(name: String): String = {

    compileState(loadSource(name), true)
    // println("interactive variants:")
    // // Set[Configuration]
    // val newProgs = LinkLength(Positional(prog, initσ))
    //
    // var pcounter = 0
    // newProgs.foreach{ case (prog, σ) ⇒ {
    //   println("// prog" ++ pcounter.toString)
    //   pcounter += 1
    //   println(LowLevel(prog, σ) ++ "\n")}
    // }
  }


  def main(args: Array[String]) {

    // println("original:")
    //println(HighLevel(prog, initσ))
    //println("// compiled version:")
    println(compileSource(args(0)))
  }

  def usage() = {
    throw Usage
  }


}