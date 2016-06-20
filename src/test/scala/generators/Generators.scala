package generators

import org.scalacheck.Gen
import org.scalacheck.Arbitrary._
import EDDIE.backend.syntax.JSTerms._

import org.scalacheck.Test

// custom generators for using scalacheck with eddie

object EdGens {

  // helper shortcuts for picking strings and doubles
  private def getNum = for {
    num <- Gen.choose(-5, 5)
  } yield (num.toDouble)
  private def getStr = for {
    id <- Gen.choose(0, 5)
  } yield "V_" ++ id.toString

  // to build a variable, pick a string and wrap it up
  val genVar: Gen[Variable] = for {
    name <- getStr
  } yield Variable(name)





  // to build an expression, pick the components naturally

  val genExpr: Gen[Expr] = {
    val tupler = for {
      coeff <- getNum
      variable <- genVar
    } yield (variable, coeff)

    for {
      const <- getNum
      terms <- Gen.mapOf[Variable, Double](tupler)
    } yield Expr(const, terms)
  }

  // to build an equation, generate exprs for both sides
  val genEq: Gen[Eq] = for {
    lhs <- genExpr
    rhs <- genExpr
  } yield Eq(lhs, rhs)


  val genEqs: Gen[Set[Eq]] = Gen.containerOf[Set, Eq](genEq)
  val genVars: Gen[Set[Variable]] = Gen.containerOf[Set, Variable](genVar)

  val genBoth = for {
    eqs <- genEqs
    vars <- genVars
  } yield (vars, eqs)



}
