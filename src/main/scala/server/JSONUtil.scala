package EDDIE.server.JSONUtil

import org.json4s.JsonDSL._
import org.json4s.{DefaultFormats, Formats}
import org.json4s._
import org.scalatra.json._
import EDDIE.backend.syntax.JSTerms._
import EDDIE.backend.semantics._

// helper conversions from JValue to collections
object J2Scala {
  protected implicit val jsonFormats : Formats = DefaultFormats


  def vars2Store(bod: JValue) = Store(
    bod.extract[Map[String, Double]].toSeq.map{
      case (nme, v)⇒ (Variable(nme), v)
    }
  )
}
