package EDDIE.server

import org.scalatra._
import scalate.ScalateSupport

import org.json4s.JsonDSL._
import org.json4s.{DefaultFormats, Formats}
import org.scalatra.json._

import EDDIE.server.JSONUtil.J2Scala._

import EDDIE.backend.runner._
import EDDIE.backend.syntax.JSTerms._
import EDDIE.backend.semantics._
import EDDIE.backend.Types._
import EDDIE.backend.synthesis._
import EDDIE.backend.ranking._

class Servlet extends Stack {
  object Mutables {
    // current program
    var ζ = State.empty
    // initial program
    var ℵ = State.empty

    // all possible link configurations, independent of an IPoint
    var allConfigs: Set[Set[Variable]] = Set()
    // all possible IPoints, independent of links
    var allPoints: Set[IPConfig] = Set()

    // current variants:
    // same points, different link configurations
    val ranker = LinkLength
    var variants: Poset = Poset.empty(ranker)

    // variants present in the client
    var currVariants: Map[Int, State] = Map()
    // points given to the client
    var currPoints: Map[Int, IPConfig] = Map()

    def reset = {
      ζ = State.empty
      ℵ = State.empty
      allConfigs = Set()
      allPoints = Set()
      variants = Poset.empty(ranker)
    }
  }

  object Actions {
    import Mutables._

    def updateConfig {
      // extend configs with current ipoints in program
      ζ.prog.ipoints.foreach{ p ⇒
        val (unchanged, outdated) = allConfigs.partition{c ⇒ (c & p.links).isEmpty}
        allConfigs = unchanged ++ (outdated.map{c ⇒ c + p.x + p.y})
      }
    }

    def generatePoints: Seq[Map[String, String]] = {
      def flatten(p: IPoint): Map[String, String] = {
        Map("x" → p.x.name, "y" → p.y.name)
      }
      currPoints = allPoints.zipWithIndex.map(_.swap)(collection.breakOut)
      currPoints.map{case (_, ipc) ⇒ flatten(ipc._1)}.toSeq
    }

    def generateVariants(ipc: IPConfig) {
      // likely: given the existing points, try all variants on configurations.
      val currProg = ℵ.prog
      val σ = ℵ.σ
      val (p, es, γ) = ipc match {case (a, b, c) ⇒ (a, b, c)}

      // TODO: do something smarter than ELA
      variants = Set(Set(p.x), Set(p.y), Set(p.x, p.y)).map{ ls ⇒ // Set[Set[Var]] → (Set[Set[Var]], point)
          (Positional.extendLinksAll( ls, currProg.equations ++ es), p)
        }.flatMap{ case (links, p) ⇒ { // (Set[Set[Var]], point) → Set[program]
          val newPoints = currProg.ipoints - p
          links.map(ls ⇒ currProg.copy(ipoints = newPoints + (p.copy(links = ls))))
        }
      }.map{p ⇒ // p → state
          ℵ.copy(prog = p, σ = σ ++ γ)
      }.foldLeft(Poset.empty(ranker)) {
        case (acc, prog) ⇒ acc + prog
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
      ℵ = ζ
      allConfigs = ζ.prog.shapes.flatMap(_.toVars).flatMap{v ⇒
        Positional.extendLinksAll(Set(v), ζ.prog.equations)
      }
      allPoints = ζ.prog.shapes.flatMap{PointGeneration(_, ζ.σ)}
    }

    def reset = {
      ζ = ℵ
      updateConfig
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

  get("/points") {
    generatePoints
  }

  // get the next different variants
  // TODO
  get("/variants/:h/:w") {


    //currVariants = currVariants + (params("n").toInt → nextVar)
    serveProgram(params)
  }

  // given an index, make the specified variant the main program and regenerate
  // variants
  // TODO

  // get("/accept-variant/:n") {
  //   if (currVariants(params("n").toInt) != ζ) {
  //     ζ = currVariants(params("n").toInt)
  //     generateVariants
  //   }
  //   serveProgram
  // }

}
