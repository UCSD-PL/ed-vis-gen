package EDDIE.backend.emit

import EDDIE.backend.syntax.JSTerms._
import EDDIE.backend.errors._
import EDDIE.backend.semantics._
import org.kiama.output.PrettyPrinter
import scala.collection.immutable.{Seq ⇒ Seq}
import scala.collection.mutable.{HashMap ⇒ MMap}
import EDDIE.backend.validation._ // for getVars

trait Emitter extends PrettyPrinter {
  // for some reason, the library doesn't define it...
  def sep(ds: Seq[Doc], sep: Doc) = group(vsep(ds, sep))
  override def sep(ds: Seq[Doc]) = sep(ds, primSep)

  def TODO: Doc = "TODO"
  def varPreamble: Doc
  def ipPreamble: Doc
  def shpPreamble: Doc
  def eqPreamble: Doc
  def leqPreamble: Doc
  def recPreamble: Doc
  def fvPreamble: Doc
  def chrtPreamble(charts: Set[Chart]): Doc
  def closer: Doc = empty
  def primSep: Doc = empty

  def printVar(v: Variable, initσ: Store): Doc
  def printIP(p: IPoint, names: Map[String, Value]): Doc
  def printShape(s: Shape, names: Map[String, Value]): Doc
  def printLinear(e: Eq): Doc
  def printLeq(e: Leq): Doc
  def printNonlinear(e: RecConstraint): Doc
  def printChrt(c: Chart, names: Map[String, Value]): Doc

  def emitExpr(e: Expression): Doc = e match {
    case Const(c) ⇒ text(c.toString)
    case Var(v) ⇒ text(v.name)
    case BinOp(l, r, op) ⇒ {
      val opStr = op match {
        case ⨁ ⇒ " +"
        case ⊖ ⇒ " -"
        case ⨂ ⇒ " *"
        case ⨸ ⇒ " /"
        case MOD ⇒ " %"
      }

      sep(Seq(emitExpr(l), emitExpr(r)), opStr)
    }
    case UnOp(i, op) ⇒ op match {
      case ¬ ⇒ "-" <> emitExpr(i)
      case Paren ⇒ parens(emitExpr(i))
    }
    case App(f, args) ⇒ printConstructor(f,
      args.map(emitExpr _)(collection.breakOut), empty)
  }

  def printFV(v: Variable, σ: Store) = text(v.name)

  // extract values from variable arguments and append style arguments
  def printConstructor(name:String, args:Seq[Doc], end: Doc = semi ) = {
    name <> parens(
      if (args.isEmpty) empty else
        nest(sep(args , ","))
      ) <> end
  }

  def emitProg(p: Program, σ: Store): Doc = p match {
    case Program(vs, ps, ss, es, leqs, recs, rfvs, cs, names) ⇒ {
      vsep(Seq(varPreamble <@>
        indent(sep(vs.map(printVar(_, σ))(collection.breakOut)))
      , ipPreamble <@>
        indent(sep(ps.map(printIP(_, names))(collection.breakOut)))
      , shpPreamble <@>
        indent(sep(ss.map(printShape(_, names))(collection.breakOut)))
      , eqPreamble <@>
        indent(sep(es.map(printLinear(_))(collection.breakOut)))
      , leqPreamble <@>
        indent(sep(leqs.map(printLeq(_))(collection.breakOut)))
      , recPreamble <@>
        indent(sep(recs.map(printNonlinear(_))(collection.breakOut)))
      , fvPreamble <@>
        indent(sep(rfvs.map(printFV(_, σ))(collection.breakOut)))
      , chrtPreamble(cs) <@>
          indent(sep(cs.map(printChrt(_, names))(collection.breakOut)))
    ), line <> closer <> line) <> line <> closer <> line
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
  def eqPreamble = "LINEAR CONSTRAINTS:"
  def leqPreamble = "INEQUALITIES:"
  def recPreamble = "PHYSICS EQUATIONS:"
  def fvPreamble = "WITH FREE VARIABLES:"
  def chrtPreamble(charts: Set[Chart]) = "WITH CHARTS:"

  def printNonlinear(e: RecConstraint) = sep(Seq(text(e.lhs.name), emitExpr(e.rhs)), " <-")

  def printVar(v: Variable, σ: Store) = v.name <> semi

  def printShape(s: Shape, names: Map[String, Value]) = {
    val (cname: String, args) = s match {
      case LineSegment(Point(a,b), Point(c,d)) ⇒ ("Line", Seq(a,b,c,d))
      case Rectangle(Point(a,b), h, w) ⇒ ("Rectangle", Seq(a,b,h,w))
      case Image(Point(a,b), h, w, _) ⇒ ("Image", Seq(a,b,h,w))
      case Circle(Point(a,b), r) ⇒ ("Circle", Seq(a,b,r))
      case Triangle(Point(a,b), Point(c,d), Point(e,f)) ⇒ ("Triangle", Seq(a,b,c,d,e,f))
      case Spring(Point(a,b), dx, dy) ⇒ ("Spring", Seq(a,b,dx,dy))
      case Arrow(Point(a,b), dx, dy) ⇒ ("Arrow", Seq(a,b,dx,dy))
    }
    printConstructor(cname, args.map(v ⇒ text(v.name)), comma)
  }

  def printLinear(e: Eq) = {
    text(e.lhs + " = " +  e.rhs)
  }

  def printLeq(e: Leq) = text(e.lhs + " ≤ " + e.rhs)

  def printIP(p:IPoint, names: Map[String, Value]) = p match {
    case IPoint(x, y, links) ⇒ {
      parens( space <>
        nest( text(x.name) <> comma <+> text(y.name) <> comma <+> braces(
              fillsep(links.map(v ⇒ text(v.name))(collection.breakOut), ",")
        )) <> space
      )
    }
  }

  def printChrt(c: Chart, names: Map[String, Value]) = c match {
    case Chart(e, lo, hi) ⇒ {
      text(names.map(_.swap).apply(c)) <+> "=" <+> emitExpr(e) <+>
      colon <+> brackets(
        lo.toString <+> comma <+> hi.toString
      )
    }
  }
}

// output s.t. running parse on the result gives the same program
object Pretty extends Emitter {
  // VARS (ident = num (, ident = num)*);
  // POINTS (ident = ipoint (, ident = ipoint)*);
  // SHAPES (ident = shape (, ident = shape)*);
  // LINEAR (eq (, eq)*);
  // LEQS (leq (, leq)*);
  // PHYSICS (rec, (, rec)*);
  // WITH FREE (ident (, ident)*);
  // CHARTS (ident = chart (, ident = chart)*);
  def varPreamble = "VARS("
  def ipPreamble = "POINTS("
  def shpPreamble = "SHAPES("
  def eqPreamble = "LINEAR("
  def leqPreamble = "LEQS("
  def recPreamble = "PHYSICS("
  def fvPreamble = "WITH FREE("
  def chrtPreamble(charts: Set[Chart]) = "CHARTS("

  override def closer: Doc = ");"
  override def primSep: Doc = ","

  def printNonlinear(e: RecConstraint) = sep(Seq(text(e.lhs.name), emitExpr(e.rhs)), " <-")

  def printVar(v: Variable, σ: Store) = v.name <+> "=" <+> σ(v).toString()

  def ePoint(p: Point): Doc = parens(p.x.name <+> comma <+> p.y.name)
  def printShape(s: Shape, names: Map[String, Value]) =  names.map(_.swap).apply(s) <+> "=" <+> {
    val (cname: String, args) = s match {
      case LineSegment(p1, p2) ⇒
        ("Line", Seq(ePoint(p1), ePoint(p2)))
      case Rectangle(c, h, w) ⇒
        ("Rectangle", Seq(ePoint(c),text(h.name),text(w.name)))
      case Image(c, h, w, src) ⇒
        ("Image", Seq(ePoint(c),text(h.name),text(w.name),squotes(text(src))))
      case Circle(c, r) ⇒
        ("Circle", Seq(ePoint(c),text(r.name)))
      case Triangle(a, b, c) ⇒
        ("Triangle", Seq(ePoint(a), ePoint(b), ePoint(c)))
      case Spring(c, dx, dy) ⇒
        ("Spring", Seq(ePoint(c),text(dx.name),text(dy.name)))
      case Arrow(c, dx, dy) ⇒
        ("Arrow", Seq(ePoint(c),text(dx.name),text(dy.name)))
    }
    printConstructor(cname, args, empty)
  }


  def emitLinExpr(e: Expr): Doc = sep(
    text(e.constant.toString) +: e.vars.map{case (v, coeff) ⇒
      coeff.toString <+> "*" <+> v.name
    }(collection.breakOut),
    " +"
  )
  def printLinear(e: Eq) = emitLinExpr(e.lhs) <+> "=" <+> emitLinExpr(e.rhs)
  def printLeq(e: Leq) = emitLinExpr(e.lhs) <+> "<=" <+> emitLinExpr(e.rhs)

  def printIP(p:IPoint, names: Map[String, Value]) = names.map(_.swap).apply(p) <+> "=" <+> (p match {
    case IPoint(x, y, links) ⇒ {
      "IPoint" <> parens( space <>
        nest( text(x.name) <> comma <+> text(y.name) <> comma <+> brackets(
              fillsep(links.map(v ⇒ text(v.name))(collection.breakOut), ",")
        )) <> space
      )
    }
  })

  def printChrt(c: Chart, names: Map[String, Value]) = names.map(_.swap).apply(c) <+>
    "=" <+> (c match { case Chart(e, lo, hi) ⇒ {
      val args:Seq[Doc] = Seq(emitExpr(e), lo.toString, hi.toString)
      printConstructor("Chart", args, empty)
    }
  })
}

// print out a low-level javascript version of the program
object LowLevel extends Emitter {
  override def TODO = "//@TODO"
  // don't print out recursive constraints in body of init
  def recPreamble = empty
  def printNonlinear(e: RecConstraint) = empty
  def fvPreamble = empty
  def recFunName = "recursive_constraints"
  def recLocalSuffix = "_local"


  // for charts, also emit free variables and a default config object
  def chrtPreamble(charts: Set[Chart]) = {
    val msg = text("// chart free variables and default config")
    val freeVars = charts.flatMap(c ⇒ Validate.getVars(c.expr))
    val freeVDecl = "freeChartVars" <+> "=" <+> braces(
      sep(freeVars.map(v ⇒ text(v.name))(collection.breakOut), comma)
    ) <> semi

    val confDecl =
      text("var defaultChartConfig = {xmin: -25, xmax: 25, xtitle: 'deadbeef'};")


    vsep(Seq(msg, freeVDecl, confDecl), empty)
  }


  override def printFV(v: Variable, σ: Store) = empty

  def emitRecs(p: Program) = emitFCall("update_rec_constraints", Seq(
    text(recFunName),
    brackets(sep((p.freeRecVars ++ p.recConstraints.map(_.lhs)).map{ v ⇒
      squotes(v.name)
    }(collection.breakOut), comma))
  ))

  def initPreamble =
    vsep(Seq("all_objects", "drag_points", "inc_objects").map(s ⇒ text(s ++ " = [];")))
  def timestep = text("20")
  def initEpilogue(p: Program, σ: Store) = {
    val timerEnd = emitFCall("update_constraints") <@> emitFCall("global_redraw")
    "tau =" <+> printConstructor("Timer", Seq(timestep, // update frequency
      emitFunc("", emitRecs(p) <@> timerEnd, Seq(text("t"))), // onTick
      emitFunc("", emitFCall("resetCVs") <@> timerEnd))) // onReset
  }


  override def emitExpr(e: Expression) = e match {
    case Var(v) ⇒ "args." <> v.name
    case App(f, args) ⇒ printConstructor(emitFName(f),
      args.map(emitExpr _)(collection.breakOut), empty)
    case _ ⇒ super.emitExpr(e) // otherwise, the superclass is well-formed javascript
  }

  // convert a function identifier to the appropriate javascript function
  def emitFName(name: String): String = {
    val mathFuncs = Set("abs", "acos", "asin", "atan", "atan2", "ceil", "cos",
         "exp", "floor", "log", "max", "min", "pow", "random", "round", "sin",
         "sqrt", "tan")
    val libFuncs = Set("intersection")
    if (mathFuncs exists (_ == name))
      "Math." ++ name
    else if (libFuncs contains (name))
      name
    else if (name == "PI")
      "Math.PI" // hack in pi
    else {
      println("undefined function: " ++ name); throw IllformedProgram
    }
  }


  def varPreamble = "//VARIABLES:"
  def ipPreamble = "//IPOINTS:"
  def shpPreamble = "//SHAPES:"
  def eqPreamble = "init_stays(); " <@> line <> "//EQUATIONS:"
  def leqPreamble = "//INEQUALITIES:"

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
      emitFCall("makeVariable", Seq(squotes(text(v.name)), text(σ(v).toString)))
  }
  def printShape(s: Shape, names: Map[String, Value]) = names.map(_.swap).apply(s) <+> "=" <+> {
    val (ctor:String, symbArgs) = s match {
      case LineSegment(Point(a,b), Point(c,d)) ⇒ ("Line", Seq(a,b,c,d))
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
      case _:LineSegment ⇒ Seq(brackets(sep(inter.map(text(_)), comma)))
      // first, add "-" to the first two elements and "+" to the second two.
      // then, add "w"/"h" to the first two and "x"/"y" to the second two
      case _:Rectangle ⇒ inter.zipWithIndex.map{ case (v, i) ⇒ if (i < 2) {
        text(v ++ "-" ++ inter(i+2))
      } else {
        text(v ++ "+" ++ inter(i-2))
      }}

      case _:Image ⇒ inter.zipWithIndex.map{ case (v, i) ⇒ if (i < 2) {
        text(v)
      } else {
        text("2*" ++ v)
      }}
      case _ ⇒ inter.map(text(_))
    }

    // add style options and image filename (if necessary)
    val docArgs = strArgs ++ (s match {
      case i: Image ⇒ Seq(text(i.tagname))
      case _        ⇒ Seq()
    }) ++ Seq( "black", "rgba(0,0,0,0)").map(s ⇒ squotes(text(s)))
    printConstructor(ctor, docArgs)
  }

  def printLinear(e: Eq) = {
    emitFCall("addEquation", Seq(
      printExpr(e.lhs), printExpr(e.rhs)
    ))
  }

  // TODO: this is broken, debug
  def printLeq(e: Leq) = TODO
  // def printLeq(e: Leq) = {
  //   emitFCall("addLEQ", Seq(
  //     printExpr(e.lhs), printExpr(e.rhs)
  //   ))
  // }

  // foreach chart, emit a function implementing the expression, a local object
  // extending defaultChartConfig with ymin, ymax, ytitle = chart.name,
  // and a decl of the form
  // chart.name = addChart(chart.name, func, config)
  def printChrt(c: Chart, names: Map[String, Value]) = {
    val name = names.map(_.swap).apply(c)
    val optName = "_" + name + "Config"
    val exprName = "_" + name + "Expr"


    val exprFunc = "var" <+> exprName <+> "=" <+> emitFunc("",
      "return" <+> emitExpr(c.expr) <> semi,
      Seq("args")
    )

    val args:Seq[Doc] = Seq(squotes(name), c.lo.toString, c.hi.toString)
    val newOpts = "var" <+> optName <+> "=" <+> braces(
      sep(Seq("ytitle", "ymin", "ymax").zip(args).map(
        kv ⇒ kv._1 <+> ":" <+> kv._2
      ), comma)
    )
    val newConfig = optName <+> "=" <+> "_." <>
      emitFCall("extend", Seq("defaultChartConfig", optName))

    val cTor = emitFCall("addChart", Seq(squotes(name), exprName, optName))


    vsep(Seq(exprFunc, newOpts, newConfig, cTor), empty)

  }

  def printExpr(e: Expr) = e match { case Expr(c, vars) ⇒ {
    // optimization; elide fromConst(0.0) when possible
    val prefix = (if (c == 0 && (! vars.isEmpty)) {
      empty
    } else {
      "fromConst" <> parens(text(c.toString))
    })
    val suffix = (if (! vars.isEmpty) {
        // first, convert var → coeff mappings to coeff*var expressions
        val var2CoeffE  = vars.mapValues(coeff ⇒ text(coeff.toString))
        val varE2CoeffE = var2CoeffE.map(
          pr ⇒ "fromVar" <> parens(text(pr._1.name)) <> (
            // optimization; elide .times(1.0) when possible
            // pr._2 is wrapped in the text PP, so we look in the original
            if (vars(pr._1) == 1.0) {
              empty
            } else {
              ".times" <> parens(pr._2)
            }
          )
        )(collection.breakOut)
        // finally, build a sum of coeff*var terms
        if (c != 0) {
          text(".plus")
        } else {
          empty
        } <> parens(folddoc( varE2CoeffE, (acc, nxt) ⇒ acc <> ".plus" <> parens(nxt)))
    } else {
      empty
    })

    prefix <> suffix
  }}
  def printIP(p:IPoint, names: Map[String, Value]) = p match {
    case IPoint(x, y, links) ⇒ {
      val iname = names.map(_.swap).apply(p)
      iname <+> "=" <+> printConstructor(
        "InteractionPoint", Seq(x, y).map(v ⇒ text(v.name))
      ) <@> iname <> ".links" <+> "=" <+> brackets(
        sep( links.map(v ⇒ squotes(text(v.name)))(collection.breakOut), comma)
      ) <> semi
    }
  }


  // helper function: convert a shape into a set of tuples of the form (field, value) :: (Doc, Doc)
  def fieldsAndVars(s: Shape): Set[(Doc, Doc)] = {
    val inter = (s match {
      case LineSegment(Point(a,b), Point(c,d)) ⇒ throw Inconceivable
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
    }.zipWithIndex.map {
      case ((f, v), i) ⇒ (s, i>1) match {
        case (_:Image, true) ⇒ (f, "2*" ++ v)
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
  def emitDrawUpdates(shapes: Set[Shape], names: Map[Value, String]): Doc = {
    sep(
      shapes.map(s ⇒ s match {
        case LineSegment(Point(x1, y1), Point(x2, y2)) ⇒
          names(s) <> ".points = " <> brackets(sep(Seq(x1,y1,x2,y2).map{ v ⇒
            text(v.name ++ ".value")
          }, comma)) <> semi
        case _ ⇒ sep(fieldsAndVars(s).map{case (f, v) ⇒
          names(s) <> "." <> f <+> "=" <+> v <> semi
        }(collection.breakOut))
      }
      )(collection.breakOut)
    )
  }

  def emitInit(p: Program, σ: Store, body: Doc, end: Doc): Doc = {
    emitFunc("init", vsep(Seq(
      initPreamble, body, initEpilogue(p, σ), end), line)
    )
  }

  def emitRecConstraints(rs: Set[RecConstraint] ) : Doc = sep(
    rs.map { r ⇒
      "var" <+> (r.lhs.name ++ recLocalSuffix) <+> "=" <+> nest(emitExpr(r.rhs) <> semi)
    }(collection.breakOut)
  ) <@> "return" <+> braces( sep(rs.map{ r ⇒
    r.lhs.name <+> colon <+> (r.lhs.name ++ recLocalSuffix)
  }(collection.breakOut), comma)) <> semi


  override def emitProg(p: Program, σ: Store): Doc = {

    // emit init
    // rely on superclass for most of the gruntwork. in addition to variable declarations,
    // foreach shape + ip, we need to emit a call to push(all_objects, s)
    // and foreach ip, we need to emit a call to push(drag_objects, ip)
    val nms = p.names.map(_.swap)
    val ipoints = p.ipoints.map(nms(_))
    val objects = Seq("all_objects") ++ p.shapes.map(nms(_)) ++ ipoints
    val initBody = super.emitProg(p, σ)
    val initEnd =
      emitFCall("push", objects.map(text(_))) <@>
      emitFCall("push", (Seq("drag_points") ++ ipoints).map(text _)) <@>
      emitFCall("push", (Seq("timers", "tau")).map(text _))
    vsep(Seq(
      emitInit(p, σ, initBody, initEnd),
      // emit update_constraints
      emitFunc("update_constraints", emitDrawUpdates(p.shapes, nms)),
      // emit recursive_constraints
      emitFunc(recFunName, emitRecConstraints(p.recConstraints), Seq("args") ),
      // emit remaining stubs
      emitFunc("drag_update", emitFCall("update_constraints", Seq())),
      emitFunc("start", text("tau.shouldRun = true; tau.start();")),
      emitFunc("stop", text("tau.shouldRun = false; tau.stop();")),
      emitFunc("reset", text("tau.reset();")),
      emitFunc("on_release", empty),
      emitFunc("on_click", empty)
    ), line)

  }
}
