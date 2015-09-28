package EDDIE.backend.semantics

import EDDIE.backend.syntax._
import EDDIE.backend.Types._
import scala.collection.immutable.{Map ⇒ Map}

// default value of 0
case class Store(vars: Map[Variable, Double]) extends Iterable[(Variable, Double)] {
  def iterator = vars.iterator
  def default(v: Variable) = 0.0
  def apply(v : Variable) = get(v)
  def get(v: Variable) = vars.applyOrElse(v, default)
  def put(v : Variable, d: Double) = this.+(v → d)
  def +(kv: (Variable, Double)) = Store(vars + kv)
  def ++(that: Iterable[(Variable, Double)]) = that./:(this){case (σ, kv) ⇒ σ + kv}
  def -(k: Variable) = Store(vars - k)
  def --(that: Iterable[Variable]) = that./:(this){case (σ, k) ⇒ σ - k}
  def restrict(vs: Set[Variable]) = Store(vars.filter{case (k, v) ⇒ vs.contains(k)})

  override def toString = "{" ++ vars.foldLeft(""){ case (str, (v, coeff)) ⇒
    str ++ (if (str.isEmpty) "" else ", ") ++ v.name ++ " → " ++ coeff.toString
  } ++ "}"
}

object Store {
  def empty = new Store(Map())
  def apply(vars: Iterable[(Variable, Double)]): Store = empty ++ vars
}

// state is defined as a program and a store
case class State(prog: Program, σ: Store)

object State {
  def empty = State(Program.empty, Store.empty)
  def merge(ipc: IPConfig, ζ: State): State = ipc match {
    case (ip, eqs, σ) ⇒
      val newLinks = ζ.prog.ipoints.foldLeft(ip.links) { case (acc, oip) ⇒
        if ((oip.links & acc).isEmpty) {
          acc
        } else {
          acc + oip.x + oip.y
        }
      }
      ζ.copy( prog = ζ.prog.copy(
        vars = ζ.prog.vars ++ Set(ip.x, ip.y),
        ipoints = ζ.prog.ipoints + ip.copy(links = newLinks),
        equations = ζ.prog.equations ++ eqs,
        freeRecVars = ζ.prog.freeRecVars + ip.x + ip.y // TODO: be more precise
        ),
        σ = ζ.σ ++ σ)
  }
}
