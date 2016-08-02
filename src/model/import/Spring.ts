import {SpringGroup} from '../Physics'
import {Spring} from '../Shapes'
import {Variable} from '../Variable'
import {map2Tup, map3Tup, Tup} from '../../util/Util'
import {State} from '../Model'


export function buildSpringGroup (s: Spring, state: State): SpringGroup {
  let store = state.store.eval()
  // assumes spring is expanded by 50% i.e. initial rest length is 2/3 delta
  let [ix, iy] = map2Tup([s.dx, s.dy], v => store.get(v) * 2/3)
  let initTheta = Math.atan2(store.get(s.dy), store.get(s.dx))// uh.... atan dy dx???

  let [fx, fy] = map2Tup(
    [['FX', 0], ['FY', 0]] as Tup<Tup<string, number>, Tup<string, number>>,
    ([name, val]) => state.allocVar(val, name)
  )

  let [vx, vy] = map2Tup(
    [['VX', 0], ['VY', 0]] as Tup<Tup<string, number>, Tup<string, number>>,
    ([name, val]) => state.allocVar(val, name)
  )

  let [rlx, rly] = map2Tup(
    [['RLX', ix], ['RLY', iy]] as Tup<Tup<string, number>, Tup<string, number>>,
    ([name, val]) => state.allocVar(val, name)
  )

  let connectedX: Variable[] = []
  let connectedY: Variable[] = []

  // public coeffFriction: Variable, // coefficient of moving friction
  // public mass: Variable,          // mass
  // public springConstant: Variable, // spring constant k
  // public gravConstant: Variable
  let [c, g] = map2Tup(
    [['C', 10], ['G', 9.8]] as Tup<Tup<string, number>, Tup<string, number>>,
    ([name, val]) => state.allocVar(val, name)
  )

  let [mass, k] = map2Tup(
    [['M', 100], ['K', 4]] as Tup<Tup<string, number>, Tup<string, number>>,
    ([name, val]) => state.allocVar(val, name)
  )



  return new SpringGroup(
    s.dx, s.dy, {x: ix, y: iy}, initTheta,
    fx, vx, rlx, connectedX, fy, vy, rly, connectedY,
    c, mass, k, g
  )
}
