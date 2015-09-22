package EDDIE.backend.ranking

import EDDIE.backend.syntax._
import EDDIE.backend.semantics._
import EDDIE.backend.errors._
import EDDIE.backend.synthesis._
import EDDIE.backend.Types._
import EDDIE.backend.Helpers._
import scala.collection.Set

// ranking functions for synthesis outputs
// implements an ordering over configurations
trait Ranker {
  // injection function for ranking, convert a configuration to an integer
  def eval(c: Configuration): Int
  def apply(vals: Set[Configuration]) = Poset(mapWD(Set()), this) ++ vals
}

// rank by aggregate length of links
object LinkLength extends Ranker {
  def eval(c: Configuration) = c.prog.ipoints.foldLeft(0){case (sum, ip) ⇒ sum + ip.links.size}
}

// partially ordered set (poset) class over configurations
// group elements into equivalence classes, iterating according to input order
case class Poset(vals: Map[Int, Set[Configuration]], order: Ranker) extends Set[Configuration] {
  def contains(key: Configuration): Boolean = vals.foldLeft(false){case (acc, (k, vs)) ⇒
    acc || vs.contains(key)
  }
  def +(c: Configuration) = {
    val key = order.eval(c)
    val newBucket = vals(key) + c
    Poset(vals + (key → newBucket), order)
  }
  def -(c: Configuration) = {
    val key = order.eval(c)
    val newBucket = vals(key) - c
    Poset(vals + (key → newBucket), order)
  }
  override def empty = Poset.empty(order)

  // convert the contents into a seq, respecting the ordering of the keys
  // (and thus the ranker)
  override def iterator: Iterator[Configuration] = {
    vals.toSeq.sortWith{case (l, r) ⇒ l._1 <= r._1}.flatMap(_._2).toIterator
  }
}

object Poset {
  def empty(order: Ranker): Poset = Poset(mapWD(Set()), order)
}
