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
import EDDIE.backend.errors._

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

    def generatePoints: Seq[String] = {
      val points = allPoints.toSeq

      ζ = points.foldLeft(ζ){case (ξ, ipc) ⇒ State.merge(ipc, ξ, false)}
      currPoints = points.zipWithIndex.map(_.swap)(collection.breakOut)
      val ret = points.map{ case (p, _, _) ⇒
        ζ.prog.names.filter(Program.takePoints).find{
          case (name, IPoint(x, y, _)) ⇒ (x == p.x && y == p.y) // find identical point
        } match { // extract name
          case Some((nme, _)) ⇒ nme
          case _ ⇒ println("error: couldn't find name for " + p.toString()); throw IllformedProgram
        }
      }

      ret.foreach{ name ⇒
        ζ.prog.names(name) match {
          case IPoint(x, y, _) ⇒
            if (!ζ.prog.ipoints.exists{ p ⇒ p.x == x && p.y == y}) {
              println("error: point named " + name + " not in program")
              throw InconsistentServerState
            }
          case _ ⇒ Unit
        }
      }
      ret
    }

    // TODO: make function pure, return seq of variants w.r.t. ipc
    def generateVariants(ipc: IPConfig): Seq[State] = {
      // likely: given the existing points, try all variants on configurations.
      val currProg = ℵ.prog
      val σ = ℵ.σ
      val (p, es, γ) = ipc

      // TODO: do something smarter than ELA
      Set(Set(p.x), Set(p.y), Set(p.x, p.y)).map{ ls ⇒ // Set[Set[Var]] → (Set[Set[Var]], point)
          (Positional.extendLinksAll( ls, currProg.equations ++ es), p)
        }.flatMap{ case (links, p) ⇒ { // (Set[Set[Var]], point) → Set[program]
          links.map{ls ⇒
            val newPoint = p.copy(links = ls)
            currProg.copy(
              ipoints = currProg.ipoints + newPoint,
              names = State.nameIP(currProg.names, newPoint)
            )
          }
        }
      }.map{p ⇒ // p → state
          ℵ.copy(prog = p, σ = σ ++ γ)
      }.foldLeft(Poset.empty(ranker)) {
        case (acc, prog) ⇒ acc + prog
      }.toSeq

    }


    // serve the current state, either with default parameters...
    def serveProgram = {
      jade("/empty.jade", "scrpt" → Run.compileState(ζ))
    }
    // ...or with supplied parameters
    def serveProgram(params: Map[String, String], s: State = ζ) = {
      val retP = try {
        Run.compileState(s)
      } catch {
        case e: Throwable ⇒ println("exception in compiling"); println(e); throw e
      }
      jade("/empty.jade", "scrpt" → retP,
        "height" → params("h"), "width" → params("w")
      )
    }

    def removeDuplicates(points: Set[IPConfig]) : Set[IPConfig] = points.foldLeft(
      (Store.empty, Set[IPConfig]())
    ){
      case ((σ, acc), (p, es, γ)) ⇒
        if (acc.exists{ case (ip, _, _) ⇒
          σ(ip.x) == γ(p.x) && σ(ip.y) == γ(p.y)}
        ) {
          (σ, acc)
        } else {
          (σ ++ γ, acc + ((p, es, γ)))
        }
    }._2

    // load a new file
    def loadFile(src: String) {
      reset
      ζ = Run.loadSource(src)
      ℵ = ζ
      allConfigs = ζ.prog.shapes.flatMap(_.toVars).flatMap{v ⇒
        Positional.extendLinksAll(Set(v), ζ.prog.equations)
      }
      allPoints = removeDuplicates(ζ.prog.shapes.flatMap{PointGeneration(_, ζ.σ)})
    }

    def reset = {
      ζ = ℵ
      updateConfig
    }

  }

  import Actions._
  import Mutables._

  // get the current program
  get("/main/:h/:w") {
    contentType = "text/html"
    println(ζ.prog.names("IP1"))
    serveProgram(params, ζ)
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

  post("/accept-points") {
    val incIndices = parsedBody.extract[Set[Int]]

    currPoints = currPoints.filterKeys(incIndices.contains(_))
    Actions.reset
    ()
  }

  // for a particular index into currPoints, return a list of all variants wrt
  // the ith IPoint
  get("/variants/:i/:h/:w") {

    val ipc = currPoints.get(params("i").toInt) match {
      case Some(ip) ⇒ ip
      case _ ⇒ println("couldn't get ipoint for index " + params("i")); throw InconsistentServerState
    }

    generateVariants(ipc).map{state ⇒ serveProgram(params, state)}
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
