package EDDIE.synthesis

import EDDIE.syntax._

object Tester extends App {
  //val inp = "x + 3*y + 4 + 8*q + -7 = 7"
  val inp = "Line((a,b), (c,d))"
  println(Parser(inp))
}
