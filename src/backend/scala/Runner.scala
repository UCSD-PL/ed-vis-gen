package EDDIE.runner

import EDDIE.syntax._
import EDDIE.synthesis._
import EDDIE.emit._
import EDDIE.errors._

import scala.io.Source._

object Run {
  // TODO: command line parsing
  def main(args: Array[String]) {
    val fle = fromURL(getClass.getResource("/" + args(0)))
    val prog: Program = Parser(fle.mkString) match {
      case Some(p) ⇒ p
      case _ ⇒ println("cant parse file:" ++ args(0)); usage()
    }
    println("original:")
    println(Emit(prog))
    println("interactive variants:")
    // Set[(IPoint, Set[Eq])]
    val newProgs = prog.shapes.flatMap(Positional.Translate(_)).map( pr ⇒
      prog.copy(
        vars = prog.vars ++ Set(pr._1.x, pr._1.y),
        ipoints = prog.ipoints + pr._1,
        equations = prog.equations ++ pr._2
      )
    )

    newProgs.foreach(p ⇒ println(Emit(p)))
    //println(Positional.Translate(shp))
  }

  def usage() = {
    throw Usage
  }


}
