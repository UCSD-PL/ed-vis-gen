package EDDIE

import EDDIE.syntax._

// with great power, comes great responsibility
// or alternatively, results in compiler warnings
import scala.language.implicitConversions


object Conversions {
  implicit def Var2Expr(v:Variable) = Expr(v)
  implicit def Const2Expr(c:Double) = Expr(c, Map())
  implicit def Tup2Point(vs: Tuple2[Variable, Variable]) = Point(vs._1, vs._2)
  implicit def TS2Point(vs: Tuple2[String, String]) = Point(Variable(vs._1), Variable(vs._2))
  implicit def Str2Var(name:String) = Variable(name)
}
