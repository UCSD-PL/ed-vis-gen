
import EDDIE.backend.syntax.JSTerms._
import EDDIE.backend.synthesis.Positional

import generators.EdGens._

import org.scalacheck._
import org.scalatest._
import org.scalacheck.Prop._

import Prop.forAll

trait ELATester {
  val ela = Positional.extendLinksAll _
}


class ELAFuzzSuite extends Properties("ExtendLinksAll") with ELATester {

  def avgLength(eqs: Set[Eq]) = {
    eqs.foldLeft(0.0){case (acc, Eq(l, r)) ⇒ l.size + r.size + acc} / eqs.size
  }


  // every equation has either two FVs or none
  property("ELA correctness") = forAll(genVars, genEqs) { (vars: Set[Variable], eqs: Set[Eq]) ⇒
    //classify(eqs.size > 5, "many eqs", "few eqs") {
      //classify(avgLength(eqs) > 5, "long eqs", "short eqs") {
          !eqs.isEmpty ==> (
            ela(vars, eqs).forall{ vars ⇒ eqs.forall { eq ⇒
            eq.count(vars) == 2 || eq.count(vars) == 0
          }})

  //    }
  //  }
  }

}

class ELAUnitSuite extends FlatSpec with Matchers with ELATester {
  val variables = List("A", "B", "C", "D", "E", "F").map(v ⇒ (v → Variable(v))).toMap
  // fst = snd + thrd
  def eBuilder(fst: String, snd: String, thrd: String) =
    Eq(Expr(variables(fst)), Expr(variables(snd)).plus(Expr(variables(thrd))))

  "ELA" should "extend links transitively" in {
    val eqs = Set(
      // A = B + C
      eBuilder("A", "B", "C"),
      // D = E + A
      eBuilder("D", "E", "A"),
      // F = E + A
      eBuilder("F", "E", "A")
    )
    val init = Set(variables("A"))
    val res = ela(init, eqs)

    res.isEmpty should be (false) // TODO: factor into separate test

    def included(foo: String, bar: String) = res.forall{vars ⇒
      vars.contains(variables(foo)) || vars.contains(variables(bar))
    }

    included("B", "C") should be (true)
    included("D", "E") should be (true)
    included("F", "E") should be (true)

  }

  "ELA" should "only extend along proper candidates" in {
    val eqs = Set(
      // A = B + C
      eBuilder("A", "B", "C"),
      // A = B - D
      Eq(Expr(variables("A")), Expr(variables("B")).minus(Expr(variables("D"))))
    )
    val init = Set(variables("A"))
    val res = ela(init, eqs)
    println(res)

    res.forall{vars ⇒ !vars.contains(variables("B"))} should be (true)

  }
}
