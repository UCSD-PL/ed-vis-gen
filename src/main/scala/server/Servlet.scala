package EDDIE.server

import org.scalatra._
import scalate.ScalateSupport

import org.json4s.JsonDSL._
import org.json4s.{DefaultFormats, Formats}
import org.scalatra.json._

import EDDIE.server.JSONUtil.J2Scala._

import EDDIE.backend.runner._
import EDDIE.backend.syntax._
import EDDIE.backend.semantics._
import EDDIE.backend.Types._
import EDDIE.backend.synthesis._
import EDDIE.backend.ranking._

class Servlet extends Stack {
  object Mutables {
    // current program
    var ζ = State.empty
    // current interaction points, governing equations, and IP variable bindings
    var Γ: Set[IPConfig] = Set()

    // all possible link configurations, independent of an IPoint
    var allConfigs: Set[Set[Variable]] = Set()
    // all possible IPoints, independent of links
    var allPoints: Set[IPConfig] = Set()

    // current variants:
    // same points, different link configurations
    val ranker = LinkLength
    var likely: Poset = Poset.empty(ranker)
    // same links, different points
    var similar: Poset = Poset.empty(ranker)
    // all-new points and links
    var different: Poset = Poset.empty(ranker)

    // variants present in the client
    var currVariants: Map[Int, State] = Map()

    def reset = {
      ζ = State.empty
      Γ = Set()
      allConfigs = Set()
      allPoints = Set()
      likely = Poset.empty(ranker)
      similar = Poset.empty(ranker)
      different = Poset.empty(ranker)
      currVariants = Map()
    }
  }

  object Actions {
    import Mutables._

    def generateVariants {
      // populate variant streams with new members
      // likely: given the existing points, try all variants on configurations.
      val currProg = ζ.prog
      val σ = ζ.σ

      // extend configs with current ipoints in program
      currProg.ipoints.foreach{ p ⇒
        val (unchanged, outdated) = allConfigs.partition{c ⇒ (c & p.links).isEmpty}
        allConfigs = unchanged ++ (outdated.map{c ⇒ c + p.x + p.y})
      }


      likely = currProg.ipoints.flatMap{p ⇒ // point → Set[(Set[Set[Var]], point)]
        Set(Set(p.x), Set(p.y), Set(p.x, p.y)).map{ ls ⇒ // Set[Set[Var]] → (Set[Set[Var]], point)
          (Positional.extendLinksAll( ls, ζ.prog.equations), p)
        }}.flatMap{ case (links, p) ⇒ { // (Set[Set[Var]], point) → Set[program]
          val newPoints = currProg.ipoints - p
          links.map(ls ⇒ currProg.copy(ipoints = newPoints + (p.copy(links = ls))))
        }
      }.map{p ⇒ // p → state
          ζ.copy(prog = p)
      }.foldLeft(Poset.empty(ranker)) {
        case (acc, prog) ⇒ acc + prog
      }

      // for each existing point, try moving the point with the same configuration

      similar = currProg.ipoints.flatMap { p ⇒
        allPoints.filter{ case (np, eqs, γ) ⇒
          val valid = eqs.exists(_.count(p.links) > 0) // new point is linked to old config
          // TODO
          lazy val wellDefnd = true //Positional.wellDefined(np.links, eqs ++ currProg.equations)
          lazy val unique = (γ(np.x) != σ(p.x)) || (γ(np.y) != σ(p.y)) // new point is in new position
          valid && wellDefnd && unique
        }.map { case (np, eqs, σ) ⇒ // add links to new point
          (np.copy(links = (p.links - p.x - p.y + np.x + np.y)), eqs, σ)
        }.map { case (np, eqs, σ) ⇒ // remove p from the currProg, add np in
          // remove references to p in variables, points
          val newVars =
            (currProg.vars - p.x - p.y) + np.x + np.y
          val newPoints = (currProg.ipoints - p) + np
          // take out p's positional equations
          val newEqs =
            currProg.equations.filter{e ⇒ e.count(Set(p.x, p.y)) == 0} ++ eqs
          // remove reference to p in freevars
          val newRVs = currProg.freeRecVars - p.x - p.y + np.x + np.y
          State(Program(newVars, newPoints, currProg.shapes, newEqs,
            currProg.recConstraints, newRVs), ζ.σ - p.x - p.y ++ σ)
        }}.foldLeft(Poset.empty(ranker)) {
          case (acc, prog) ⇒ acc + prog
        }



      // take the existing program, try all points + configs that aren't present
      different = allPoints.zip(allConfigs).filter{
        case ((_, eqs, _), lnks) ⇒
          eqs.exists(_.contains(lnks)) // filter out spurious point/config combinations
      }.flatMap{
        case ((ip, eqs, σ), lnks) ⇒ {
          Set(Set(ip.x), Set(ip.y), Set(ip.x, ip.y)).flatMap{ls ⇒
            Positional.extendLinksOne(lnks ++ ls, eqs ++ currProg.equations).toSet
          }.map(l ⇒
            (ip.copy(links = l), eqs, σ)
          )
      }}.map{
        State.merge(_, ζ)}.foldLeft(
        Poset.empty(ranker)){case (acc, prog) ⇒ acc + prog
      }

    }


    // serve the current state, either with default parameters...
    def serveProgram = {
      jade("/empty.jade", "scrpt" → Run.compileState(ζ))
    }
    // ...or with supplied parameters
    def serveProgram(params: Map[String, String], s: State = ζ) = {
      jade("/empty.jade", "scrpt" → Run.compileState(s),
        "height" → params("h"), "width" → params("w")
      )
    }

    // load a new file
    def loadFile(src: String) {
      reset
      ζ = Run.loadSource(src)
      allConfigs = ζ.prog.shapes.flatMap(_.toVars).flatMap{v ⇒
        Positional.extendLinksAll(Set(v), ζ.prog.equations)
      }
      //println(allConfigs.toString())
      allPoints = ζ.prog.shapes.flatMap{PointGeneration(_, ζ.σ)}
      //println(allPoints.toString())
      generateVariants
    }

    def getNext(typ: String) = typ match {
      case "near" ⇒ likely.headOption match {
        case Some(s) ⇒ {likely = likely - s; s}
        case _ ⇒ ζ
      }
      case "medium" ⇒ similar.headOption match {
        case Some(s) ⇒ {similar = similar - s; s}
        case _ ⇒ ζ
      }
      case "far" ⇒ different.headOption match {
        case Some(s) ⇒ {different = different - s; s}
        case _ ⇒ ζ
      }
    }

    // for now, just clear the entry in currVariants
    def rejectVar(i: Int) {
      currVariants = currVariants - i

    }

    // clear calculated ipoints
    def reset = {
      Γ = Set()
      generateVariants
    }

  }

  import Actions._
  import Mutables._

  // get the current program
  get("/") {
    serveProgram
  }

  // resets the server state
  get("/reset") {
    Actions.reset
    serveProgram
  }
  // load a program from file, with height and width
  get("/loadfile/:src/:h/:w") {
    contentType = "text/html"
    loadFile(params("src"))
    serveProgram(params)
  }

  // get the next different variant and give it the index n
  get("/variants/:diff/:n/:h/:w") {

    val nextVar = getNext(params("diff"))

    currVariants = currVariants + (params("n").toInt → nextVar)
    serveProgram(params, nextVar)
  }

  // given an index, make the specified variant the main program and regenerate
  // variants
  get("/accept-variant/:n") {
    if (currVariants(params("n").toInt) != ζ) {
      ζ = currVariants(params("n").toInt)
      generateVariants
    }
    serveProgram
  }
  // given an index, clear the variant at that index and serve...nothing...
  // assumes the client will ask for a new variant
  get("/reject-variant/:n") {
    rejectVar(params("n").toInt)
    ()
  }
}
