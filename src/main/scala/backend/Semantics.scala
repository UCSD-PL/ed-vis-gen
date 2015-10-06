package EDDIE.backend.semantics

import EDDIE.backend.syntax.JSTerms._
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

  // given a name map and IP, generate a name for the IP and extend the map
  def nameIP(names: Map[String, Value], p: IPoint) = {
    if (names.exists{ _ match {
      case (nme, v: IPoint) ⇒ v.x == p.x && v.y == p.y
      case _ ⇒ false
    }}) {
      println("warning: added duplicate point " + p.toString())
      names
    } else {
      var prefix = "IP"
      var suffix = 0
      while (names.contains(prefix + suffix.toString)) {
        suffix += 1
      }
      names + ((prefix + suffix.toString) → p)
    }
  }

  def merge(ipc: IPConfig, ζ: State, mergeLinks: Boolean = true): State = ipc match {
    case (ip, eqs, σ) ⇒
      val newLinks = ζ.prog.ipoints.foldLeft(ip.links) { case (acc, oip) ⇒
        if ((oip.links & acc).isEmpty) {
          acc
        } else {
          acc + oip.x + oip.y
        }
      }
      val newIP =
        if (mergeLinks)
          ip.copy(links = newLinks)
        else
          ip
      val oldProg = ζ.prog
      ζ.copy( prog = oldProg.copy(
        vars = oldProg.vars ++ Set(ip.x, ip.y),
        ipoints = oldProg.ipoints + newIP,
        equations = oldProg.equations ++ eqs,
        freeRecVars = oldProg.freeRecVars + ip.x + ip.y, // TODO: be more precise
        names = nameIP(oldProg.names, newIP)
        ),
        σ = ζ.σ ++ σ)
  }
}
