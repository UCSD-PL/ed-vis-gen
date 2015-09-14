package frontend

import org.scalatra._
import scalate.ScalateSupport
import EDDIE.syntax._

class FrontendServlet extends FrontendStack {

  get("/") {
    <html>
      <body>
        <h1>Hello, world!</h1>
        Say <a href="hello-scalate">hello to Scalate</a>.
      </body>
    </html>
  }

}
