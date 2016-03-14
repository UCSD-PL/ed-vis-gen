package EDDIE.backend.storage.json

// translate from json to ASTs, in direct/file/string format.
import EDDIE.backend.syntax.JSTerms._
import org.json4s._
import org.json4s.jackson.JsonMethods._
import scala.util.Try
import EDDIE.backend.errors._
import EDDIE.backend.semantics._



// json input format:
// { vars:
//     [{name: number}],
//   ipoints: [{x: string, y: string}],
//   shapes: [{type: string, name: string, args: {<shape dependent>}}],
//   equations : [<empty for now>],
//   inequalities: [<empty for now>],
//   recConstraints : [<empty for now>],
//   freeRecVars: [<empty for now>],
//   names: [] (needs to be constructed)
// }
// shape arg jsons look like:
//
// point: {x: string, y: string}
// circle: {center: point, r: string}
// rectangle: {center: point, dx: string, dy: string}
// line: {begin: point, end: point}

object Json2Ast {

  protected implicit val jsonFormats : Formats = DefaultFormats

  // pulls a string field out of a json, fails for nonstring fields
  @inline
  def getSField(json: JValue, name: String): String = (json \ name).extract[String]
  // ditto for lists
  @inline
  def getLField(json: JValue)(name: String): List[JValue] = (json \ name).extract[List[JValue]]

  // convert a {name: value} json to a (Variable -> value) binding
  def getBinding(json: JValue): (Variable, Double) = {
    val (bnd, value) = json.extract[(String, Double)]
    (Variable(bnd), value)
  }

  // convert a {x: name, y: name} json to an IPoint
  def mkIPoint(json: JValue): IPoint = {
    val x = getSField(json, "x")
    val y = getSField(json, "y")
    IPoint(Variable(x),Variable(y))
  }
  // ditto, but a regular point
  def mkPoint(json: JValue): Point = {
    val x = getSField(json, "x")
    val y = getSField(json, "y")
    Point(Variable(x),Variable(y))
  }


  // convert a shape json to a Shape, dependent on the json's type tag
  def mkShape(json: JValue): (String, Shape) = {
    val args = json \ "args"
    val nme = getSField(json, "name")
    getSField(json, "type") match {
      case "circle" ⇒
        val center = mkPoint(args \ "center")
        val r = Variable(getSField(args, "r"))
        nme → Circle(center, r)
      case "rectangle" ⇒
        val center = mkPoint(args \ "center")
        val dx = Variable(getSField(args, "dx"))
        val dy = Variable(getSField(args, "dy"))
        nme → Rectangle(center, dy, dx)
      case _ ⇒ throw Incomplete
    }
  }

  def mkProgram(json: JValue): State = {
    val getter = getLField(json) _
    val σ = getter("vars").map(getBinding).toMap[Variable, Double]
    val shapeNames = getter("shapes").map(mkShape).toMap[String, Shape]
    val names = σ.map{case (v@Variable(nme), _) ⇒ nme → v} ++ shapeNames

    val vars = σ.keySet
    val shps = shapeNames.values.toSet

    val ips = Set[IPoint]() //TODO
    val eqs = Set[Eq]()
    val ineqs = Set[Leq]()
    val rcs = Set[RecConstraint]()
    val frees = Set[Variable]()
    State(Program(vars, ips, shps, eqs, ineqs, rcs, frees, names), Store(σ))

  }

  def shpFromString(input: String) : Shape = mkShape(parse(input))._2

  def apply(input: String) = mkProgram(parse(input))
}
