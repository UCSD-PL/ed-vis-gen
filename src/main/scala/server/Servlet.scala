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
    var likely: Stream[IPConfig] = Stream()
    // same links, different points
    var similar: Stream[IPConfig] = Stream()
    // all-new points and links
    var different: Set[IPConfig] = Set()



    def reset = {
      ζ = State.empty
      Γ = Set()
      allConfigs = Set()
      allPoints = Set()
      likely = Stream()
      similar = Stream()
      different = Set()
    }
  }

  object Actions {
    import Mutables._

    def generateVariants {
      // populate variant streams with new members
      // TODO: likely and similar
      // take the existing program, try all points + configs that aren't present
      different = allPoints.zip(allConfigs).flatMap{case ((ip, eqs, σ), lnks) ⇒ {
        val newLinks = Positional.extendLinksOne(lnks + ip.x + ip.y, eqs ++ ζ.prog.equations)
        val ret = newLinks.map(l ⇒ (ip.copy(links = l), eqs, σ))
        if (!ret.isEmpty){
          // println("we made it boyz")
          // println(ret)
        }
        ret
        }
      } //.toStream

      //println(different)

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
      ζ = Run.loadSource(src)
      Γ = Set()
      allConfigs = ζ.prog.shapes.flatMap(_.toVars).flatMap{v ⇒
        Positional.extendLinksAll(Set(v), ζ.prog.equations)
      }
      //println(allConfigs.toString())
      allPoints = ζ.prog.shapes.flatMap{PointGeneration(_, ζ.σ)}
      //println(allPoints.toString())
      generateVariants
    }

    // clear calculated ipoints
    def reset = {
      Γ = Set()
      generateVariants
    }

    // return a (concrete) list of variants
    def getDifferents(number: Int): Seq[IPConfig] = {
      //println(different)
      different.take(number).toSeq
    }
    def dropDifferents(number: Int) = {
      different = different.drop(number)
    }

  }





  import Actions._

  // get the current program
  get("/") {
    serveProgram
  }

  // resets the server state
  get("/reset") {
    reset
    serveProgram
  }
  // load a program from file, with height and width
  get("/loadfile/:src/:h/:w") {
    contentType = "text/html"
    loadFile(params("src"))
    serveProgram(params)
  }

  // get the next n different variants
  get("/differents/:n/:h/:w") {
    val diffs = getDifferents(params("n").toInt).zipWithIndex.map{
      case (v, k) ⇒ (k.toString → State.merge(v, Mutables.ζ))
    }.toMap

    assert(diffs.size == params("n").toInt)

    println(diffs.keySet)

    diffs.mapValues{serveProgram(params, _)}
  }
}
