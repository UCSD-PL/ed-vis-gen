import {SpringGroup} from '../Physics'
import {Spring, Line} from '../Shapes'
import {Variable, CassVar} from '../Variable'
import {map2Tup, map3Tup, Tup, map, uniqify, assert, exists, filter, partSet} from '../../util/Util'
import {State, Program, Store} from '../Model'
import {InteractionSynthesis} from '../Synthesis'
import {Poset} from '../../util/Poset'
import {TranslationFavored} from '../Ranking'


export function buildSpringGroup (s: Spring, state: State): SpringGroup {
  let store = state.store.eval()
  // assumes spring is expanded by 50% i.e. initial rest length is 2/3 delta
  let [ix, iy] = map2Tup([s.dx, s.dy], v => store.get(v) * 2/3)
  let initTheta = Math.atan2(store.get(s.dy), store.get(s.dx))// uh.... atan dy dx???

  let [fx, fy] = map2Tup(
    [['FX', 0], ['FY', 0]] as Tup<Tup<string, number>, Tup<string, number>>,
    ([name, val]) => state.allocCassVar(val, name)
  )

  let [vx, vy] = map2Tup(
    [['VX', 0], ['VY', 0]] as Tup<Tup<string, number>, Tup<string, number>>,
    ([name, val]) => state.allocCassVar(val, name)
  )

  let [rlx, rly] = map2Tup(
    [['RLX', ix], ['RLY', iy]] as Tup<Tup<string, number>, Tup<string, number>>,
    ([name, val]) => state.allocCassVar(val, name)
  )


  // public coeffFriction: Variable, // coefficient of moving friction
  // public mass: Variable,          // mass
  // public springConstant: Variable, // spring constant k
  // public gravConstant: Variable
  let [c, g] = map2Tup(
    [['C', 10], ['G', 9.8]] as Tup<Tup<string, number>, Tup<string, number>>,
    ([name, val]) => state.allocCassVar(val, name)
  )

  let [mass, k] = map2Tup(
    [['M', 100], ['K', 4]] as Tup<Tup<string, number>, Tup<string, number>>,
    ([name, val]) => state.allocCassVar(val, name)
  )

  let eqs = uniqify(new Set(map(state.store.equations, e => e.vars() as Set<CassVar>)))
  assert(s.dx instanceof CassVar && s.dy instanceof CassVar, 'expected cassowary variables for spring dimensions')
  assert(s.x instanceof CassVar && s.y instanceof CassVar, 'expected cassowary variables for spring dimensions')
  let xSeed = new Set<CassVar>().add(s.dx as CassVar) //.add(s.dy as CassVar)
  let ySeed = new Set<CassVar>().add(s.dy as CassVar)
  let candXFrees = filter(InteractionSynthesis.validFreeVariables(xSeed, eqs), vs => !vs.has(s.x as CassVar))
  let candYFrees = filter(InteractionSynthesis.validFreeVariables(ySeed, eqs), vs => !vs.has(s.y as CassVar))


  // console.log('candidates for spring:')
  // console.log(candXFrees)
  // console.log(candYFrees)
  // rank the results

  let rankedX = new Poset(map(candXFrees, frees => [frees, state.prog, state.store]), TranslationFavored,
[new Set<Variable>(), state.prog, state.store])
  let rankedY = new Poset(map(candYFrees, frees => [frees, state.prog, state.store]), TranslationFavored,
[new Set<Variable>(), state.prog, state.store])

  let [xs] = rankedX.toArr()[0] as [Set<Variable>, Program, Store]
  let [ys] = rankedY.toArr()[0] as [Set<Variable>, Program, Store]

  let connectedX: Variable[] = [... xs]
  let connectedY: Variable[] = [... ys]

  return new SpringGroup(
    s.dx, s.dy, {x: ix, y: iy}, initTheta,
    fx, vx, rlx, connectedX, fy, vy, rly, connectedY,
    c, mass, k, g
  )
}
