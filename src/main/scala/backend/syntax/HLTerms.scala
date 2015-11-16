package EDDIE.backend.syntax.HLTerms
import EDDIE.backend.syntax.{JSTerms ⇒ JST}
import EDDIE.backend.semantics._

object HLTerms {

// references for shapes. TODO: add a map from names to shapes in JSTerms and
// parse named shapes
  type ShapeRef = String

  // NOAH: fill this out
  abstract class Physics
  case class Gravity(shape:JST.Shape, mass: JST.Variable, friction: JST.Variable, g: JST.Variable, floor: JST.Variable) extends Physics // example
  case class Spring_Mot(mass: JST.Variable, stiffness: JST.Variable, damping: JST.Variable, g: JST.Variable) extends Physics
  case class Pendulum(mass: JST.Variable, friction: JST.Variable, g: JST.Variable) extends Physics

  object Translate {
  	// Must return a tuple of (state, forcemap)
    def make_phys(phys: Physics, counter: Map[Shape, Int], 
                  forceMap: Map[Shape, List[Expression]], 
                  str: Store): (State, Map[Shape, List[Expresion]]) = phys match {
  		// TODO
  		case Gravity(shape, mass, g) => {
          // make the set of forces which need ot be combined to get
          // the total force on any object
          val forcesX = List[Expresion]()
          val forcesY = BinOp(Var(mass), Var(g), ⨁) :: List[Expression]()
          val totalX = forceMap(shape)._1 ++ forcesX
          val totalY = forceMap(shape)._2 ++ forcesY
          val newForces = (totalX, totalY)
          val newMap = forceMap - shape + (shape -> newForces)
      {
        {(prog:Program, stor:Store) => (State(prog, stor), newMap)} 
        // creates a program whch has the basic motion equations for gravity
        (Program(mass :: (g :: List[JST.Variable]())).toSet, // variables set
        	       Set[JST.IPoint](), // ipoints set (empty)
        	       Set(shape), // shapes set
        	       Set[JST.Eq](),// equations set (two-way) empty for gravity
        	       Set[RecConstraint](), // oneway constraints set (Eq's)
        	       Map[String, JST.Value] // name to value map, constants we define on the go
        	    )
        
        (str)
  		}
      }
    }

/*        case Spring_Mot(spring, mass, stiff, damp, g) => {
        forces = // TODO figure out the force expressions
        {prog, stor => (State(prog, stor), forces)}
        (Program(// variables set
        	     Set.empty // ipoints set (empty)
        	     // shapes set
        	     // equations set (two-way)
        	     // oneway constraints set (Eq's)
        	     // name set? maybe reference names? 
        	    )
        )
        (Store.empty)
  		}
        case Pendulum(bob, link, fulcrum, mass, fric, g) => {
        forces = // TODO figure out the force expressions
        {prog, stor => State(prog, stor)} 
        (Program(// variables set
        	     Set.empty // ipoints set (empty)
        	     // shapes set
        	     // equations set (two-way)
        	     // oneway constraints set (Eq's)
        	     // name set? maybe reference names? 
        	    )
        )
        (Store.empty)
  		}*/
  	
    def name(nm: String, cnt: Int): JST.Variable = Variable(nm ++ "___" ++ cnt.toString)
    
    def programUnion(pra: Program, prb: Program): Program = {
        Program(pra.vars++prb.vars, pra.ipoint++prb.ipoints,
        	    pra.shapes++prb.shapes, pra.equations++prb.equations,
        	    pra.recConstraint++prb.recConstraint,
        	    pra.freeRecVars++prb.freeRecVars, 
        	    pra.names++prb.names)
    }

    def stateUnion(sta: State, stb:State): State = {
        State(programUnion(sta.prog, stb.prog), sta.σ++stb.σ.vars);
    }

    def apply(ps: Set[Physics], str: Store): State = {
        var physList = ps.toArray
        var shapeSet : Set[JST.Shape]= Set.empty
        // makes an array of all unique shapes present in the picture
        for (elem <- physList) {
          elem match {
            case Gravity(shape, _, _, _) => {
              shapeSet = shapeSet + shape
            }
            case Spring_Mot(spring, _, _, _, _) => {
              shapeSet = shapeSet + spring
            }
            case Pendulum(bob, link, fulcrum, _, _, _) => {
              shapeSet = shapeSet + bob
              shapeSet = shapeSet + link
              shapeSet = shapeSet + fulcrum
            }
          }
        } 
        var shapeList = shapeSet.toArray
        // A map of shapes to x forces and y forces
        var forceMap = Map[Shape, (List[Expression],List[Expression])]()
        var shapeCount = Map[Shape, Int]()
        for (i <- shapeList.indices) {
          shapeCount = shapeCount updated (shapeList(i), i) 
          forceMap = forceMap updated (shapeList(i), List[Expression]())
        }
        var almostOutTuple = physList.foldLeft((State.empty, forceMap)) { (tot, twoElem) =>
            (stateUnion(tot, make_phys(twoElem._1, shapeCount, twoElem._2, str)))
            }
        var toReturn = almostOutTuple._1
        // Need to add total force (x and y), 
        // and motion (velocity and positions) change for each shape
        for (key <- almostOutTuple._2.keys) {
          val forces = almostOutTuple._2 get key
          var fx : Expression = Const(0)
          var fy : Expression = Const(0)
          // making total force expressions for each shape
          for (fxElem <- forces._1) {
            fx = BinOp(fxElem, fx, ⨁)
          }
          for (fyElem <- forces._2) {
            fy = BinOp(fxElem, fx, ⨁)
          }
          val vx : Expression = BinOp(Var(name("FX", counter get key)), Var(name("VX", counter get key)), ⨁)
          toReturn.prog.vars += name("FX", counter get key)
          toReturn.prog.vars += name("VX", counter get key)
          val vy : Expression = BinOp(Var(name("FY", counter get key)), Var(name("VY", counter get key)), ⨁)
          toReturn.prog.vars += name("FY", counter get key)
          toReturn.prog.vars += name("VY", counter get key)
          var consToAdd : Set[RecConstraint] = Set()
          // adding forces and velocities to program
          consToAdd += RecConstraint(name("FX", counter get key), fx)
          consToAdd += RecConstraint(name("FY", counter get key), fy)
          consToAdd += RecConstraint(name("VX", counter get key), vx)
          consToAdd += RecConstraint(name("VY", counter get key), vy)
          var moveTuple = key match {
            case Rectangle((x, y), _, _) => (x, y)
            case Circle((x,y), _) => (x, y)
          }
          // changing the x/y position of the shape
          val xUp : Expression = BinOp(Var(moveTuple._1), Var(name("VX", counter get key)), ⨁)
          val yUp : Expression = BinOp(Var(moveTuple._2), Var(name("VY", counter get key)), ⨁)
          consToAdd += RecConstraint(moveTuple._1, xUp)
          consToAdd += RecConstraint(moveTuple._2, yUp)
          toReturn.prog.recConstraints += consToAdd
          toReturn.prog.vars += moveTuple._1
          toReturn.prog.vars += moveTuple._2 
        }
        toReturn
      }
  }

}
