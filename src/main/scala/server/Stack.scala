package EDDIE.server

import org.scalatra._
import scalate.ScalateSupport
import org.fusesource.scalate.{ TemplateEngine, Binding }
import org.fusesource.scalate.layout.DefaultLayoutStrategy
import javax.servlet.http.HttpServletRequest

import org.scalatra.CorsSupport

import collection.mutable

import org.json4s.JsonDSL._
import org.json4s.{DefaultFormats, Formats}
import org.scalatra.json._
import org.scalatra.CorsSupport


trait Stack extends ScalatraServlet with ScalatraBase with ScalateSupport with JacksonJsonSupport with CorsSupport {
  // options("/*"){
  //   // response.setHeader("Access-Control-Allow-Headers", request.getHeader("Access-Control-Request-Headers"))
  //   // response.setHeader("Access-Control-Allow-Headers", "x-requested-with, content-type")
  //   // response.setHeader("Access-Control-Allow-Methods", "POST, GET")
  //   // response.setHeader("Access-Control-Allow-Origin", "*")
  // }
  before() {
    contentType = formats("json")
    // println(request.getHeader("Access-Control-Request-Headers"))

    // response.setHeader("Access-Control-Allow-Headers", "x-requested-with, content-type")
    // response.setHeader("Access-Control-Allow-Methods", "POST, GET")
    response.setHeader("Access-Control-Allow-Origin", "*")
  }


  // options("/*") {
  //   response.setHeader("Access-Control-Allow-Headers", request.getHeader("Access-Control-Request-Headers"))
  // }

  protected implicit val jsonFormats : Formats = DefaultFormats

  error {
    case e: Throwable ⇒ {
      println(e.toString())
      InternalServerError(Unit, Map.empty, e.toString())
    }
  }


  notFound {
    // remove content type in case it was set through an action
    contentType = null
    // Try to render a ScalateTemplate if no route matched
    findTemplate(requestPath) map { path ⇒
      contentType = "text/html"
      layoutTemplate(path)
    } orElse serveStaticResource() getOrElse resourceNotFound()
  }

}
