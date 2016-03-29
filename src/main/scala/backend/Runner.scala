package EDDIE.backend.runner

import EDDIE.backend.storage.runner.{Run ⇒ SRun}
import EDDIE.backend.semantics._
import EDDIE.backend.synthesis._
import EDDIE.backend.emit._
import EDDIE.backend.errors._
import EDDIE.backend.ranking._
import EDDIE.backend.validation._
import EDDIE.backend.optimization._

object Run {
  // TODO: command line parsing
  // public api for backend
  // given a source file and file type, load the file into an AST
  def loadSource(name: String, textFile: Boolean) : State = textFile match {
    case true ⇒ SRun.parseFromSource(name)
    case false ⇒ SRun.parseJSonFromFile(name)
  }

  // compile a state to lowlevel javascript code
  def compileState(ζ: State, validate: Boolean = false) : String = {
    if (validate) {
      Validate(ζ.prog, ζ.σ)
    }
    LowLevel(ζ.prog, ζ.σ)
  }

  // compile a source file to code and perform validation
  def compileSource(name: String, highLevel: Boolean = false): String = {
    val ζ = loadSource(name, true)

    if (highLevel) {
      HighLevel(ζ.prog, ζ.σ)
    } else {
      compileState(ζ, true)
    }
  }

  def emitIR(ζ: State): String = Pretty(ζ.prog, ζ.σ)


  def main(args: Array[String]) {
    println(compileSource(args(0), true))
  }

  def usage() = {
    throw Usage
  }


}
