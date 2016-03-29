package EDDIE.server

import org.scalatra._
import scalate.ScalateSupport

import org.json4s.JsonDSL._
import org.json4s.{DefaultFormats, Formats}
import org.scalatra.json._

import EDDIE.server.JSONUtil.J2Scala._

// just bring in all the damn things
import EDDIE.backend.runner._
import EDDIE.backend.syntax.JSTerms._
import EDDIE.backend.semantics._
import EDDIE.backend.Types._
import EDDIE.backend.synthesis._
import EDDIE.backend.optimization._
import EDDIE.backend.ranking._
import EDDIE.backend.errors._
import EDDIE.backend.InterOp._

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
    val ranker = Default
    var variants: Poset = Poset.empty(ranker)

    // variants present in the client
    var currVariants: Map[Int, IPConfig] = Map()
    // points given to the client
    var currPoints: Map[Int, IPConfig] = Map()
    // FV configurations given to the client
    var currFVs: Map[Int, Set[Variable]] = Map()

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


    def generateFRVs: Seq[State] = {

      val freeRVs = ζ.prog.freeRecVars ++ ζ.prog.recConstraints.map(_.lhs)
      val validFVConfigs = Positional.extendLinksAll(freeRVs, ζ.prog.equations).toSeq
      currFVs = validFVConfigs.zipWithIndex.map(_.swap).toMap
      validFVConfigs.map{fvs ⇒ ζ.copy(prog = ζ.prog.copy(freeRecVars = fvs))}(collection.breakOut)
    }

    def generatePoints: Seq[String] = {
      val points = allPoints.toSeq

      ζ = points.foldLeft(ζ){case (ξ, ipc) ⇒ State.merge(ipc, ξ)}
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

    def generateVariants(ipc: IPConfig): Seq[State] = {
      val currProg = ℵ.prog
      val (p, es, γ) = ipc

      // TODO: do something smarter than ELA
      val results = Set(Set(p.x), Set(p.y), Set(p.x, p.y)).map{ ls ⇒ // Set[Set[Var]] → (Set[Set[Var]], point)
          Positional.extendLinksAll( ls, currProg.equations ++ es)
        }.flatMap{ _.map{ls ⇒
            val newConfig = (p.copy(links = ls), es, γ)
            (State.merge(newConfig, ℵ), newConfig)
          }
        }.foldLeft((Poset.empty(ranker), Map[State, IPConfig]())) {
        case ((states, configs), (prog, config)) ⇒ (states + prog, configs + (prog → config))
      }

      val ret = results._1.toSeq

      currVariants = ret.zipWithIndex.map{case (state, i) ⇒ (i → results._2(state))}.toMap

      ret

    }

    def acceptVariant(i: Int) {
      ζ = State.merge(currVariants(i), ζ)
      currVariants = Map()
    }

    def acceptFRV(i: Int){
      ζ = ζ.copy(prog = ζ.prog.copy(freeRecVars = currFVs(i)))
      currFVs = Map()
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
        case e: Throwable ⇒ println("exception in compiling"); println(e.printStackTrace()); throw e
      }
      val wParams = params.withDefaultValue("false")
      jade("/empty.jade", "scrpt" → retP,
        "height" → wParams("h"), "width" → wParams("w"),
        "shouldSimInteractions" → wParams("simInteractions"),
        "shouldSimPhysics" → wParams("simPhysics")
      )
    }

    def removeDuplicates(points: Set[IPConfig]) : Set[IPConfig] = points.foldLeft(
      (Store.empty, Set[IPConfig]())
    ){ case ((σ, acc), (p, es, γ)) ⇒
        acc.find{ case (ip, _, _) ⇒
          σ(ip.x) == γ(p.x) && σ(ip.y) == γ(p.y)
        } match {
          case Some(c) ⇒ (σ, acc) // ignore duplicate point
          case _ ⇒ (σ ++ γ, acc + ((p, es, γ)))
        }
    }._2

    // load a new file
    def loadFile(src: String) {
      reset
      // load either a json or a .txt
      // we recall scala's string.split uses regexes...gross
      val splits: Array[String] = src.split("\\.")
      val ext = splits(1) match {
        case "txt" ⇒ true
        case "json" ⇒ false
        case _ ⇒ throw BadFileFormat
      }
      ζ = Run.loadSource(src, ext)
      ℵ = ζ
    }

    // initialize state prior to a round of interaction synthesis
    // TODO: maybe set a state variable and toss around a bunch of asserts?
    def initSynthesis() {
      ζ = processState(ζ)
      ℵ = ζ
      allConfigs = ζ.prog.shapes.flatMap(_.toVars).flatMap{v ⇒
        Positional.extendLinksAll(Set(v), ζ.prog.equations)
      }
      allPoints = removeDuplicates(ζ.prog.shapes.flatMap{PointGeneration(_, ζ.σ)})
    }
    // run the noninteractive steps prior to synthesis in the pipeline (see PIPELINE)
    def processState(s: State): State = {
      val positions = EquationPass(s).head
      val interOped = ShapeConstraints(positions)
      val optimized = OptimizeAll(interOped)
      optimized
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
    serveProgram(params + ("sim" → "false"), ζ)
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

  get("/view-ir") {
    contentType = "text/plain"
    Run.emitIR(ζ)
  }

  get("/points") {
    initSynthesis()
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

    generateVariants(ipc).map{state ⇒ serveProgram(params + ("simInteractions" → "true"), state)}
  }

  // given an index, adds currVariants[i] into the main program and clears currVariants

  get("/accept-variant/:i") {
    acceptVariant(params("i").toInt)
    ()
  }

  get("/free-vars/:h/:w"){
    generateFRVs.map{state ⇒ serveProgram(params, state)}
  }

  get("/accept-fv/:i"){
    acceptFRV(params("i").toInt)
    ()
  }

}
