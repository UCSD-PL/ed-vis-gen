import V = require('./Variable')

// object PointGeneration {
//   def VC2IPC(x: VarConfig, y: VarConfig) =
//     (IPoint(x._1, y._1), x._2 ++ y._2, x._3 ++ y._3)
//   def apply(s: Shape, σ: Store): Set[IPConfig] = (s match {
//     case LineSegment(s, e) ⇒ line(s,e, σ)
//     case BoxLike(c, h, w) ⇒ box(c, h, w, σ)
//     case VecLike(c, dx, dy) ⇒ vec(c, dx, dy, σ)
//     case Circle(center, radius) ⇒ circ(center, radius, σ)
//     case Triangle(p1, p2, p3) ⇒ tri(p1, p2, p3, σ)
//   })
//
//   // helper function; link up an IP and a point by equality
//   def equality(l: IPoint, r: Point, σ: Store) = {
//     (Set(Eq(l.x, r.x), Eq(l.y, r.y)), σ + (l.x → σ(r.x)) + (l.y → σ(r.y)))
//   }
//   def ident(l: Variable, r: Variable, σ: Store): VarConfig = {
//     (l, Set(Eq(l, r)), σ + (l → σ(r)))
//   }
//   def plus(l: Variable, r: Variable, σ: Store, coeff: Double = 1) : VarConfig = {
//     val newVar = Variable(l.name + "_P_" + coeff.toString.replace('.', '$') + "_T_" + r.name)
//     (newVar, Set(Eq(newVar, Expr(l) plus (Expr(r) times coeff))), σ + (newVar → (σ(l) + coeff * σ(r))))
//   }
//
//   def minus(l: Variable, r: Variable, σ: Store, coeff: Double = 1) : VarConfig = {
//     val newVar = Variable(l.name + "_M_" + coeff.toString.replace('.', '$') + "_T_" + r.name)
//     (newVar, Set(Eq(newVar, Expr(l) minus (Expr(r) times coeff))), σ + (newVar → (σ(l) - coeff*σ(r))))
//   }
//   // helper function; link up an IP to the midpoint of two points
//   def midPoint(ip: IPoint, l: Point, r: Point, σ: Store) = {
//     (Set[Eq]() + Eq(ip.x, (l.x plus r.x) div 2.0) + Eq(ip.y, (l.y plus r.y) div 2.0),
//      σ + (ip.x → ((σ(l.x) + σ(r.x))/2)) + (ip.y → ((σ(l.y) + σ(r.y))/2)))
//    }
//
//   // given two points, build an IP for the midpoint and relevant equations
//   def makeMP(l: Point, r: Point, σ: Store) = {
//     val ip = IPoint(
//       l.x.name ++ "_" ++ r.x.name ++ "_MPX",
//       l.y.name ++ "_" ++ r.y.name ++ "_MPY")
//     val (eqs, newσ) = midPoint(ip, l, r, σ)
//     (ip, eqs, newσ)
//   }
//
//   // the beginning, the end, and the midpoint
//   // assumes start and end are points defined in the program
//   def line(start: Point, end: Point, σ: Store)  = {
//     val sip = start.toIP()
//     val eip = end.toIP()
//     val (startEqs, sσ) = equality(sip, start, σ)
//     val (endEqs, eσ) = equality(eip, end, σ)
//
//     val (mip, midEqs, mσ) = makeMP(start, end, σ)
//
//     // wrap everything up in tuples and return
//     Set((sip, startEqs, sσ), (eip, endEqs, eσ), (mip, midEqs, mσ))
//   }
//
//   // endpoints, midpoints of each line, and overall midpoint
//   def tri(p1: Point, p2: Point, p3: Point, σ: Store):Set[IPConfig] = {
//     val midPoint = Set() // TODO
//     line(p1, p2, σ) ++ line(p2, p3, σ) ++ line(p1, p3, σ) ++ midPoint
//   }
//
//   // 3 lines, including midpoints: tL -> tR, mL -> mR, bL -> bR
//   // visually:
//   // * - * - *
//   // |       |
//   // *   *   *
//   // |       |
//   // * - * - *
//   def box(center: Point, hheight: Variable, hwidth: Variable, σ: Store):Set[IPConfig] = {
//     for {
//       x <- Set(ident(center.toIP().x, center.x, σ),
//                plus(center.x, hwidth, σ),
//                minus(center.x, hwidth, σ))
//       y <- Set(ident(center.toIP().y, center.y, σ),
//                plus(center.y, hheight, σ),
//                minus(center.y, hheight, σ))
//     } yield (VC2IPC(x,y))
//   }
//
//   // center and both ends
//   // * - * - *>
//   def vec(base: Point, dx: Variable, dy: Variable, σ: Store):Set[IPConfig] = {
//     Set(
//       (ident(base.toIP().x, base.x, σ), ident(base.toIP().y, base.y, σ)),
//       (plus(base.x, dx, σ), plus(base.y, dy, σ)),
//       (plus(base.x, dx, σ, 0.5), plus(base.y, dy, σ, 0.5))
//     ).map{case (x,y) ⇒ VC2IPC(x,y)}
//   }
//
//   // center, 4 points on radius. circle version of the rectangle projection.
//   // visually (ascii is hard...):
//           //     =  *  =
//           //   =         =
//           //  =           =
//           //  *     *     *
//           //  =           =
//           //   =         =
//           //     =  *  =
//           //
//   def circ(c: Point, r: Variable, σ: Store): Set[IPConfig] = {
//     val midPoint = c.toIP()
//     val (midPointEqs, midPointσ) = equality(midPoint, c, σ)
//
//     // @TODO: refactor...
//     val leftPoint = c.toIP("L")
//     val leftPointEqs = Set(Eq(leftPoint.x, c.x minus r), Eq(leftPoint.y, c.y))
//     val leftPointσ = σ + (leftPoint.x → (σ(c.x) - σ(r))) + (leftPoint.y → σ(c.y))
//
//     val rightPoint = c.toIP("R")
//     val rightPointEqs = Set(Eq(rightPoint.x, c.x plus r), Eq(rightPoint.y, c.y))
//     val rightPointσ = σ + (rightPoint.x → (σ(c.x) + σ(r))) + (rightPoint.y → σ(c.y))
//
//     val topPoint = c.toIP("T")
//     val topPointEqs = Set(Eq(topPoint.y, c.y minus r), Eq(topPoint.x, c.x))
//     val topPointσ = σ + (topPoint.x → σ(c.x)) + (topPoint.y → (σ(c.y) - σ(r)))
//
//     val botPoint = c.toIP("B")
//     val botPointEqs = Set(Eq(botPoint.y, c.y plus r), Eq(botPoint.x, c.x))
//     val botPointσ = σ + (botPoint.x → σ(c.x)) + (botPoint.y → (σ(c.y) + σ(r)))
//
//     Set((midPoint, midPointEqs, midPointσ), (leftPoint, leftPointEqs, leftPointσ),
//         (rightPoint, rightPointEqs, rightPointσ), (topPoint, topPointEqs, topPointσ),
//         (botPoint, botPointEqs, botPointσ))
//   }
// }
// 
// export namespace PointGeneration {
//   var allocSuffix = 0
//   function allocFreshCVar(store: Set<V.Variable>, prefix?): V.CassVar {
//     ++allocSuffix
//
//   }
// }
