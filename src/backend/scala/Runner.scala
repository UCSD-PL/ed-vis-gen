package EDDIE.runner

import EDDIE.syntax._
import EDDIE.semantics._
import EDDIE.parser._
import EDDIE.synthesis._
import EDDIE.emit._
import EDDIE.errors._
import EDDIE.ranking._
import EDDIE.validation._

import scala.io.Source._

object Run {
  // TODO: command line parsing
  def main(args: Array[String]) {
    val fle = fromURL(getClass.getResource("/" + args(0)))
    val (prog: Program, initσ: Store) = Parser(fle.mkString) match {
      case Left(p) ⇒ p
      case Right(msg) ⇒ println(msg); throw ParseError
      //case _ ⇒ println("can't parse file " ++ simple.txt); usage
    }
    Validate(prog, initσ)
    println("original:")
    println(HighLevel(prog, initσ))
    println("compiled version:")
    println(LowLevel(prog, initσ))
    println("interactive variants:")
    // Set[Configuration]
    val newProgs = LinkLength(Positional(prog, initσ))

    var pcounter = 0
    newProgs.foreach{ case (prog, σ) ⇒ {
      println("//prog" ++ pcounter.toString)
      pcounter += 1
      println(LowLevel(prog, σ) ++ "\n")}
    }
  }

  def usage() = {
    throw Usage
  }


}
