package EDDIE.emit

import EDDIE.syntax._
import EDDIE.errors._
import EDDIE.semantics._
import org.kiama.output.PrettyPrinter
import scala.collection.immutable.{Seq ⇒ Seq}
import scala.collection.mutable.{HashMap ⇒ MMap}

// allocator for javascript global variable names. maps objects which will be
// stored in variables (Variables, IPoints, and Shapes) to names.

// usage is through apply; apply extends the map if necessary and returns
// an object's name.
object Allocator {
  // union type hack
  sealed class VorIPorShp[T]
  implicit object VWitness extends VorIPorShp[Variable]
  implicit object IPWitness extends VorIPorShp[IPoint]
  implicit object ShpWitness extends VorIPorShp[Shape]
  trait Inner[T] extends MMap[T, String] {
    var alloc = -1
    override def default(key: T) = {
      alloc += 1
      val prefix = key match {
        case Variable(nme) ⇒ nme
        case v:IPoint ⇒ "IP"
        case v:Shape ⇒ "S"
      }
      this.+=(key → (prefix ++ alloc.toString))
      prefix ++ alloc.toString
    }
  }

  object Variables extends Inner[Variable]
  object IPoints extends Inner[IPoint]
  object Shapes extends Inner[Shape]
  def apply[T: VorIPorShp](v: T): String = v match {
    case v@Variable(_) ⇒ Variables(v)
    case v@IPoint(_, _, _) ⇒ IPoints(v)
    case v: Shape ⇒ Shapes(v)
  }
}

trait Emitter extends PrettyPrinter {
  // for some reason, the library doesn't define it...
  def sep(ds: Seq[Doc], sep: Doc) = group(vsep(ds, sep))

  def TODO: Doc = "TODO"
  def varPreamble: Doc
  def ipPreamble: Doc
  def shpPreamble: Doc
  def eqPreamble: Doc

  def printVar(v: Variable, initσ: Store): Doc
  def printIP(p: IPoint): Doc
  def printShape(s: Shape): Doc
  def printEquation(e: Eq): Doc

  // extract values from variable arguments and append style arguments
  def printConstructor(name:String, args:Seq[Doc] ) = {
    name <> parens( nest(sep( args ,
      ",")
    )) <> semi
  }

  def emitProg(p: Program, σ: Store): Doc = p match {
    case Program(vs, ps, ss, es) ⇒ {
      vsep(Seq(varPreamble <@> sep(vs.map(printVar(_, σ))(collection.breakOut))
      , ipPreamble <@> sep(ps.map(printIP(_))(collection.breakOut))
      , shpPreamble <@>
        sep(ss.map(printShape(_))(collection.breakOut))
      , eqPreamble <@>
        sep(es.map(printEquation(_))(collection.breakOut))
      ), line)
    }
  }

  def apply(p: Program, σ: Store): String = {
    val doc = emitProg(p, σ)
    pretty(doc)
  }
}

// print out a high-level specification of the program
object HighLevel extends Emitter {
  def varPreamble = "VARIABLES:"
  def ipPreamble = "IPOINTS:"
  def shpPreamble = "SHAPES:"
  def eqPreamble = "EQUATIONS:"

  def printVar(v: Variable, σ: Store) = v.name <> semi

  def printShape(s: Shape) = {
    val (cname: String, args) = s match {
      case LineSegment(Point(a,b), Point(c,d)) ⇒ ("Line", Seq(a,b,c,d))
      case Rectangle(Point(a,b), h, w) ⇒ ("Rectangle", Seq(a,b,h,w))
      case Image(Point(a,b), h, w, _) ⇒ ("Image", Seq(a,b,h,w))
      case Circle(Point(a,b), r) ⇒ ("Circle", Seq(a,b,r))
      case Triangle(Point(a,b), Point(c,d), Point(e,f)) ⇒ ("Triangle", Seq(a,b,c,d,e,f))
      case Spring(Point(a,b), dx, dy) ⇒ ("Spring", Seq(a,b,dx,dy))
      case Arrow(Point(a,b), dx, dy) ⇒ ("Arrow", Seq(a,b,dx,dy))
    }
    printConstructor(cname, args.map(v ⇒ text(v.name)))
  }

  def printEquation(e: Eq) = {
    text(e.lhs + " = " +  e.rhs)
  }

  def printIP(p:IPoint) = p match {
    case IPoint(x, y, links) ⇒ {
      parens( space <>
        nest( text(x.name) <> comma <+> text(y.name) <> comma <+> braces(
              fillsep(links.map(v ⇒ text(v.name))(collection.breakOut), ",")
        )) <> space
      )
    }
  }
}

// print out a low-level javascript version of the program
object LowLevel extends Emitter {
  override def TODO = "//@TODO"
  def initPreamble =
    vsep(Seq("all_objects", "drag_points", "inc_objects").map(s ⇒ text(s ++ " = [];")))
  def timestep = text("20")
  def initEpilogue = {
    val timerEnd = emitFCall("update_constraints") <@> emitFCall("global_redraw")
    "tau =" <+> printConstructor("Timer", Seq(timestep, // update frequency
      emitFunc("", timerEnd, Seq(text("t"))), // onTick
      emitFunc("", emitFCall("resetCVs")) <@> timerEnd)) // onReset
  }


  def varPreamble = "//VARIABLES:"
  def ipPreamble = "//IPOINTS:"
  def shpPreamble = "//SHAPES:"
  def eqPreamble = "init_stays(); // SUPER IMPORTANT NEED THIS CALL" <@> line <> "//EQUATIONS:"

  def emitFunc(name: String, body: Doc = empty, args: Seq[Doc] = Seq()): Doc = {
    "function" <> ( if (name.length > 0) {space <> name} else empty) <+>
      parens(sep(args, ",")) <+> "{" <>
        ( if (pretty(body) == "") {
          "}"
        } else {
          line <> nest(indent(body)) <@> "}"
        })

  }

  def emitFCall(name: String, args: Seq[Doc] = Seq()) = printConstructor(name, args)


  def printVar(v: Variable, σ:Store) =  {
    text(v.name) <+> "=" <+>
      emitFCall("makeVariable", Seq(dquotes(text(v.name)), text(σ(v).toString)))
  }
  def printShape(s: Shape) = Allocator(s) <+> "=" <+> {
    val (ctor:String, symbArgs) = s match {
      case LineSegment(Point(a,b), Point(c,d)) ⇒ ("ClosedLine", Seq(a,b,c,d))
      case Circle(Point(a,b), r) ⇒ ("Circle", Seq(a,b,r))
      case Triangle(Point(a,b), Point(c,d), Point(e,f)) ⇒ ("Triangle", Seq(a,b,c,d,e,f))
      case Image(Point(a,b), h, w, _) ⇒ ("Image", Seq(a,b,h,w))
      case Spring(Point(a,b), dx, dy) ⇒ ("Spring", Seq(a,b,dx,dy))
      case Arrow(Point(a,b), dx, dy) ⇒ ("Arrow", Seq(a,b,dx,dy))
      // ugh. this is hackish as hell for rectangles, but it works...
      case Rectangle(Point(a,b), h, w) ⇒ ("Rectangle", Seq(a,b,w,h))
    }

    // transform centered args from (x, y, dx, dy) to (x-dx, y-dy, x+dx, y+dy)
    // @TODO: disgusting...needs better design
    val inter = symbArgs.map(v ⇒ (v.name ++ ".value"))
    val strArgs = s match {
      // first, add "-" to the first two elements and "+" to the second two.
      // then, add "w"/"h" to the first two and "x"/"y" to the second two
      case _:Rectangle ⇒ inter.zipWithIndex.map{ case (v, i) ⇒ if (i < 2) {
        v ++ "-" ++ inter(i+2)
      } else {
        v ++ "+" ++ inter(i-2)
      }}
      case _ ⇒ inter
    }

    // add style options and image filename (if necessary)
    val docArgs = strArgs.map(text(_)) ++ (s match {
      case i: Image ⇒ Seq(text(i.tagname))
      case _        ⇒ Seq()
    }) ++ Seq( "black", "rgba(0,0,0,0)").map(s ⇒ dquotes(text(s)))
    printConstructor(ctor, docArgs)
  }

  def printEquation(e: Eq) = {
    emitFCall("addEquation", Seq(
      printExpr(e.lhs), printExpr(e.rhs)
    ))
  }

  def printExpr(e: Expr) = e match { case Expr(c, vars) ⇒ {
    "fromConst" <> parens(text(c.toString)) <>
      (if (! vars.isEmpty) {
          ".plus" <> parens({
        // first, convert var → coeff mappings to coeff*var expressions
        val var2CoeffE  = vars.mapValues(coeff ⇒ text(coeff.toString))
        val varE2CoeffE = var2CoeffE.map(
          pr ⇒ "fromVar" <> parens(text(pr._1.name)) <> ".times" <> parens(pr._2)
        )(collection.breakOut)
        // finally, build a sum of coeff*var terms
        folddoc( varE2CoeffE, (acc, nxt) ⇒ acc <> ".plus" <> parens(nxt))
      })
    } else {
      empty
    })
  }}
  def printIP(p:IPoint) = p match {
    case IPoint(x, y, links) ⇒ {
      val iname = Allocator(p)
      iname <+> "=" <+> printConstructor(
        "InteractionPoint", Seq(x, y).map(v ⇒ text(v.name))
      ) <@> iname <> ".links" <+> "=" <+> brackets(
        fillsep( links.map(v ⇒ dquotes(text(v.name)))(collection.breakOut), comma)
      ) <> semi
    }
  }


  // helper function: convert a shape into a set of tuples of the form (field, value) :: (Doc, Doc)
  def fieldsAndVars(s: Shape): Set[(Doc, Doc)] = {
    val inter = (s match {
      case LineSegment(Point(a,b), Point(c,d)) ⇒
        Seq(("x1", a), ("y1", b), ("x2", c), ("y2", d))
      case Circle(Point(x,y), r) ⇒ Seq(("x", x), ("y", y), ("r", r))
      case Triangle(Point(a,b), Point(c,d), Point(e,f)) ⇒
        Seq(("x1", a), ("y1", b), ("x2", c), ("y2", d), ("x3", e), ("y3", f))
      // assumes filename field should never be changed
      case Image(Point(x,y), h, w, _) ⇒
        Seq(("x", x), ("y", y), ("h", h), ("w", w))
      // and it remains gross. this is why we can't have nice things -.-
      case VecLike(Point(x,y), dx, dy) ⇒
        Seq(("x", x), ("y", y), ("dx", dx), ("dy", dy))
      case Rectangle(Point(x,y), h, w) ⇒
        Seq(("x1", x), ("y1", y), ("x2", w), ("y2", h))
    }).map{
      case (f, v) ⇒ (f, v.name ++ ".value")
    }.map {
      case (f, v) ⇒ s match {
        case _:Image ⇒ (f, "2*" ++ v)
        case _ ⇒ (f, v)
      }
    }

    val strArgs = s match {
      // first, add "-" to the first two elements and "+" to the second two.
      // then, add "w"/"h" to the first two and "x"/"y" to the second two
      case _:Rectangle ⇒ inter.zipWithIndex.map{ case ((f, v), i) ⇒ if (i < 2) {
        (f, v ++ "-" ++ inter(i+2)._2)
      } else {
        (f, v ++ "+" ++ inter(i-2)._2)
      }}
      case _ ⇒ inter
    }

    strArgs.map{case (f, v) ⇒ (text(f), text(v))}(collection.breakOut)

  }
  // assumes the rest of the program has been emitted (i.e., that Allocator constraints
  // the correct variable names)
  def emitDrawUpdates(shapes: Set[Shape]): Doc = {
    sep(
      shapes.map(s ⇒
        sep(fieldsAndVars(s).map{case (f, v) ⇒
          Allocator(s) <> "." <> f <+> "=" <+> v <> semi
        }(collection.breakOut))
      )(collection.breakOut)
    )
  }

  def emitInit(body: Doc): Doc = {
    emitFunc("init", vsep(Seq(
      initPreamble, body, initEpilogue), line)
    )
  }

  override def emitProg(p: Program, σ: Store): Doc = {


    // emit init
    // rely on superclass for most of the gruntwork. in addition to variable declarations,
    // foreach shape + ip, we need to emit a call to push(all_objects, s)
    // and foreach ip, we need to emit a call to push(drag_objects, ip)
    val ipoints = p.ipoints.map(Allocator(_))
    val objects = Seq("all_objects") ++ p.shapes.map(Allocator(_)) ++ ipoints
    val initBody =
      super.emitProg(p, σ) <@> line <>
      emitFCall("push", objects.map(text(_))) <@>
      emitFCall("push", (Seq("drag_points") ++ ipoints).map(text _))
    vsep(Seq(
      emitInit(initBody),
      // emit update_constraints
      emitFunc("update_constraints", emitDrawUpdates(p.shapes)),
      // emit remaining stubs
      emitFunc("drag_update", emitFCall("update_constraints", Seq())),
      emitFunc("start", text("tau.start();")),
      emitFunc("stop", text("tau.stop();")),
      emitFunc("reset", text("tau.reset();")),
      emitFunc("on_release", empty),
      emitFunc("on_click", empty)
    ), line)

  }
}
