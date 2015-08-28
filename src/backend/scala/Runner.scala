package EDDIE.runner

import EDDIE.syntax._
import EDDIE.semantics._
import EDDIE.parser._
import EDDIE.synthesis._
import EDDIE.emit._
import EDDIE.errors._

import scala.io.Source._

object Run {
  // TODO: command line parsing
  def main(args: Array[String]) {
    val fle = fromURL(getClass.getResource("/" + args(0)))
    val (prog: Program, initσ: Store) = Parser(fle.mkString) match {
      case Some(p) ⇒ p
      case _ ⇒ println("cant parse file:" ++ args(0)); usage()
    }
    println("original:")
    println(HighLevel(prog, initσ))
    println("interactive variants:")
    // Set[(IPoint, Set[Eq])]
    val newProgs = prog.shapes.flatMap(Positional.Translate(_, initσ)).map( tup ⇒
      (prog.copy(
        vars = prog.vars ++ Set(tup._1.x, tup._1.y),
        ipoints = prog.ipoints + tup._1,
        equations = prog.equations ++ tup._2
      ), tup._3)
    )

    var pcounter = 0
    newProgs.foreach(pr ⇒ {
      println("//prog" ++ pcounter.toString)
      pcounter += 1
      println(LowLevel(pr._1, pr._2) ++ "\n")}
    )
    //println(Positional.Translate(shp))
  }

  def usage() = {
    throw Usage
  }


}
