package EDDIE.semantics

import EDDIE.syntax.Variable
import scala.collection.immutable.{Map ⇒ Map}

// default value of 0
case class Store(vars: Map[Variable, Double]) {
  def default(v: Variable) = 0.0
  def apply(v : Variable) = get(v)
  def get(v: Variable) = vars.applyOrElse(v, default)
  def put(v : Variable, d: Double) = this.+(v → d)
  def +(kv: (Variable, Double)) = Store(vars + kv)
}

object Store {
  def apply(): Store = Store(Map())
}
