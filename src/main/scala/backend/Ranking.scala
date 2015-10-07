package EDDIE.backend.ranking

import EDDIE.backend.syntax.JSTerms._
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

// weighted sum of input rankings
case class WeightedSum(rankings: Set[(Int, Ranker)]) extends Ranker {
  def eval(c: Configuration) = rankings.foldLeft(0){case (sum, (coeff, rnker)) ⇒
    sum + coeff * rnker.eval(c)
  }
}

object ShapeHeuristics extends Ranker {
  // given a motive and shape, penalize the motive for adjusting the shape in an odd manner
  def motivePenalty(motive: Set[Variable], s: Shape): Int = {
    // springs and arrows generally don't translate
    def scoreSet(s: Set[_]) = s.size * 2
    val translationPenalty = scoreSet ((s match {
      case VecLike(Point(x, y), _, _) ⇒ Set(x,y)
      case _ ⇒ Set[Variable]()
    }) & motive)

    // rectangles and images generally don't stretch
    val stretchPenalty = scoreSet (( s match {
      case BoxLike(_, dx, dy) ⇒ Set(dx, dy)
      case _ ⇒ Set[Variable]()
    }) & motive)

    // objects generally don't stretch in one dimension and translate in the other,
    // in the same motive
    val uncoordinatedPenalty = (s match {
      case VecLike(Point(x, y), dx, dy) ⇒ Set(Set(x, dy), Set(y, dx))
      case BoxLike(Point(x, y), dy, dx) ⇒ Set(Set(x, dy), Set(y, dx))
      case Circle(Point(x, y), r) ⇒ Set(Set(x, r), Set(y, r))
      case _ ⇒ Set[Set[Variable]]()
    }).foldLeft(0) {case (sum, vars) ⇒
      if (vars.subsetOf(motive))
        sum + 5
      else
        sum
    }

    translationPenalty + stretchPenalty + uncoordinatedPenalty
  }

  def eval(c: Configuration) = c.prog.shapes.foldLeft(0){ case (sum, shp) ⇒
    sum + c.prog.ipoints.foldLeft(0) { case (sum, ip) ⇒
      sum + motivePenalty(ip.links, shp)
    }
  }
}

object Default extends Ranker {
  val inner = WeightedSum(Set(
    (1 → LinkLength),
    (2 → ShapeHeuristics)
  ))

  def eval(c: Configuration) = inner eval(c)
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
