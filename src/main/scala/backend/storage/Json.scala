package EDDIE.backend.storage.json

// translate from json to ASTs, in direct/file/string format.
// basically wrappers around the json4s library.

import EDDIE.backend.syntax.JSTerms._
import org.json4s._
import org.json4s.jackson.JsonMethods._
import scala.util.Try


object Json2Ast {

  protected implicit val jsonFormats : Formats = DefaultFormats


  // """{"center": {"x": {"name": "X"}, "y": {"name": "Y"}}, "radius": {"name": "R"}}"""

  def mkShape(json: JValue): Shape = Set(
      Try(json.extract[Circle]).toOption
    ).flatten.head

  def shpFromString(input: String) : Shape = mkShape(parse(input))
}
