package EDDIE.backend.semantics

import EDDIE.backend.syntax.JSTerms._
import EDDIE.backend.Types._
import scala.collection.immutable.{Map ⇒ Map}
import scala.annotation.tailrec

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
    names.find{ _ match {
      case (nme, v: IPoint) ⇒ v.x == p.x && v.y == p.y
      case _ ⇒ false
    }} match {
      case Some(oldp) ⇒
        println("warning: added duplicate point " + p.toString())
        println("old point: " + oldp.toString())
        names
      case _ ⇒
        var prefix = "IP"
        var suffix = 0
        while (names.contains(prefix + suffix.toString)) {
          suffix += 1
        }
        names.map{ kv ⇒ kv match {
          case (nme, IPoint(x, y, lnks)) ⇒ (nme, IPoint(x, y, lnks + p.x + p.y))
          case _ ⇒ kv
        }} + ((prefix + suffix.toString) → p)
      }

  }

  // @tailrec
  def growLinks(links: Set[Variable], points: Set[IPoint]): Set[Variable] = {
    // val newLinks = points.filter{
    //   ip ⇒ !(ip.links & links).isEmpty
    // }.flatMap{ip ⇒
    //   Set(ip.x, ip.y)
    // }
    // val ret = links ++ newLinks
    // if (links == ret)
    //   ret
    // else
    //   growLinks(ret, points)
    links ++ points.flatMap{ip ⇒ Set(ip.x, ip.y)}
  }

  def merge(ipc: IPConfig, ζ: State, mergeLinks: Boolean = true): State = ipc match {
    case (ip, eqs, σ) ⇒
      val newLinks = growLinks(ip.links, ζ.prog.ipoints)
      val newIP =
        if (mergeLinks)
          ip.copy(links = newLinks)
        else
          ip
      val oldProg = ζ.prog
      ζ.copy( prog = oldProg.copy(
        vars = oldProg.vars ++ Set(newIP.x, newIP.y),
        // TODO: be more precise
        ipoints = oldProg.ipoints.map(point ⇒ point.copy(links = point.links + newIP.x + newIP.y)) + newIP,
        equations = oldProg.equations ++ eqs,
        freeRecVars = oldProg.freeRecVars + newIP.x + newIP.y, // TODO: be more precise
        names = nameIP(oldProg.names, newIP)
        ),
        σ = ζ.σ ++ σ)
  }
}
