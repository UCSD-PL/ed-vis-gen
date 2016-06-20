package EDDIE.backend.semantics

import EDDIE.backend.syntax.JSTerms._
import EDDIE.backend.Types._
import scala.collection.immutable.{Map ⇒ Map}
import scala.annotation.tailrec
import EDDIE.backend.errors._


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
  def nameIP(names: Map[String, Value], p: IPoint): Map[String, Value] = {
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
        // println("named " + prefix + suffix.toString +  " -> "+ p.toString())
        names + ((prefix + suffix.toString) → p)
      }

  }

  // given a new point and a program, integrate the new point into the program
  def mergePoints(newConfig: IPConfig, oldProg: Program): (IPoint, Set[IPoint], Map[String, Value]) = {
    val oldNames: Map[Value, String] = oldProg.names.filter(Program.takePoints).map(_.swap)
    // update old point's links if necessary
    def mergeNP(cand: IPoint, eqs: Set[Eq], dst: IPoint): IPoint = cand.copy(links = cand.links ++
      Set(dst.x, dst.y).filter(v ⇒ eqs.exists(e ⇒
        e.count(cand.links) == 1 && e.count(v) == 1)
      )
    )
    val newPoint = oldProg.ipoints.foldLeft(newConfig._1)((vnew, vold) ⇒ mergeNP(vnew, oldProg.equations, vold))
    val newPoints = oldProg.ipoints.map(v ⇒ mergeNP(v, newConfig._2, newPoint))
    val newNames = newPoints.map(p ⇒ oldNames.find{
      case (IPoint(x, y, _), nme) ⇒ (x == p.x && y == p.y)
      } match {
          case Some((_, nme)) ⇒ (nme → p)
          case _ ⇒ println("can't find point", p, "in map", oldNames); throw Inconceivable
    }).toMap ++ oldProg.names.filter(! Program.takePoints(_))
    (
      newPoint,
      newPoints + newPoint,
      nameIP(newNames, newPoint)
    )
    // foreach old point, detect if the oldPoint's coordinates should be sinks

    // links ++ points.flatMap{ip ⇒ Set(ip.x, ip.y)}
  }

  def merge(ipc: IPConfig, ζ: State, mergeLinks: Boolean = true, toIPoints: Boolean = true): State = ipc match {
    case (ip, eqs, σ) ⇒

      // foreach point in the new state, if
      val (newPoint, newPoints, newNames) =
        if (toIPoints) {
          if (mergeLinks)
            mergePoints(ipc, ζ.prog)
          else
            (ip, ζ.prog.ipoints + ip, nameIP(ζ.prog.names, ip))
        } else {
          (ip, ζ.prog.snaps + ip, nameIP(ζ.prog.names, ip))
        }



      val oldProg = ζ.prog
    //  println("new point:" + newPoint.toString)
    //  println("old names:" + oldProg.names)
  //    println("new names:" + nameIP(oldProg.names, newPoint))
      val newProg = oldProg.copy(
        vars = oldProg.vars ++ Set(newPoint.x, newPoint.y),
        equations = oldProg.equations ++ eqs,
        names = newNames
        // notice, free rec vars is not updated (and should be). however, it's unclear
        // at this stage whether both dimensions of the point should be added,
        // so we rely on a later synthesis pass to add in correct FVs.
        )

        ζ.copy(prog = (if (toIPoints) {
          newProg.copy(ipoints = newPoints)
        } else {
          newProg.copy(snaps = newPoints)
        }),
        σ = ζ.σ ++ σ)
  }
}
