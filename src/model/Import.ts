import {Model, State} from './Model'
import {map2Tup, map3Tup, map4Tup, Tup, Tup3, assert} from '../util/Util'
import {Circle, Rectangle, Shape, Line} from './Shapes'
import {PhysicsGroup, Pendulum} from './Physics'
import {VType, Variable} from './Variable'

type fabricCircle = {
  type: string, // "circle"
  left: number, // left + radius = x (basically)
  top: number, // top + radius = y (basically)
  radius: number,
  scaleX: number,
  scaleY: number,
  fill: string
}

type fabricRect = {
  type: string, // "rect"
  left: number, // x equivalent of RectJSON
  top: number, // y equivalent
  width: number, // dx
  height: number, // dy
  scaleX: number,
  scaleY: number,
  fill: string
}

type fabricLine = {
  type: string, // "line"
  left: number, top: number, // x and y equivalent of PointJSON for start (for LineJSON)
  width: number,
  height: number, // (left, height + y) = "end" since shapes aren't rotatable on the fabric.js canvas (yet)
  scaleX: number,
  scaleY: number,
  fill: string
}

export type fabricObject = fabricCircle | fabricRect | fabricLine

type fabricPhysicsCommon = {
  type: string
}
type pendulumGroup = {
  pivot: fabricCircle,
  rod: fabricLine,
  bob: fabricCircle
} & fabricPhysicsCommon


export type fabricPhysicsGroup = pendulumGroup

export type fabricJSONObj = {
  shapes: fabricObject[],
  physicsGroups: fabricPhysicsGroup[]
}

// given a fabric object, convert the coordinates to backend conventions
function normalizeFabricShape(s: fabricObject): fabricObject {
  let ret: fabricObject
  if (s.type == 'circle') {
    let newS = Object.assign({}, s) as fabricCircle
    newS.radius *= Math.sqrt(newS.scaleX * newS.scaleY)
    newS.left += newS.radius
    newS.top += newS.radius
    ret = newS
  } else if (s.type == 'rect') {
    let newS = Object.assign({}, s) as fabricRect
    newS.width *= newS.scaleX/2 // fabric stores widths in the scale matrix, eddie dx = width/2
    newS.left += newS.width
    newS.height *= newS.scaleY/2
    newS.top += newS.height
    ret = newS
  } else if (s.type == 'line') {
    // TODO?
    ret = Object.assign({}, s) as fabricLine
  } else {
    console.log('unrecognized shape in normalize:')
    console.log(s)
    assert(false)
  }

  return ret
}

// given a store and (normalized) fabric shape, make variables in the store and return a backend shape over the variables
function buildBackendShapes(store: State, s: fabricObject) {
  let shape: Shape
  if (s.type == 'circle') {
    let newS = s as fabricCircle
    let [x, y, r] = map3Tup([newS.left, newS.top, newS.radius], v => store.allocVar(v))
    shape = new Circle(x, y, r, "black", newS.fill)
  } else if (s.type == 'rect') {
    let newS = s as fabricRect
    let [x, y, dx, dy] = map4Tup([newS.left, newS.top, newS.width, newS.height], v => store.allocVar(v))
    shape = new Rectangle(x, y, dx, dy, 'black')
  } else if (s.type == 'line') {
    let newS = s as fabricLine
    let [x1, y1] = map2Tup([newS.left, newS.top], v => store.allocVar(v))
    let [x2, y2] = map2Tup([newS.left + newS.width, newS.top + newS.height], v => store.allocVar(v))
    shape = new Line([[x1, y1], [x2, y2]], newS.fill, false)
  } else {
    console.log('unrecognized fabric tag:')
    console.log(s)
    assert(false)
  }
  return shape
}

function buildPendulum(state: State, pivot: Shape, bob: Shape, rod: Shape): Pendulum {
  let pBuilder = ([nme, v]: Tup<string, number>) => state.addVar(VType.Prim, nme, v)
  let cBuilder = ([nme, v]: Tup<string, number>) => state.addVar(VType.Cass, nme, v)

  let store = state.eval()

  assert(pivot instanceof Circle, 'pendulum builder expected circle for pivot')
  assert(bob instanceof Circle, 'pendulum builder expected circle for bob')
  assert(rod instanceof Line, 'pendulum builder expected line for rod')
  let [pivotS, bobS, rodS] = [pivot as Circle, bob as Circle, rod as Line]

  let [pivX, pivY] = map2Tup([pivotS.x, pivotS.y], v => store.get(v))
  let [bobX, bobY] = map2Tup([bobS.x, bobS.y], v => store.get(v))
  let [dy, dx] = [bobY - pivY, bobX - pivX]

  // L = sqrt(dx^2 + dy^2)
  // theta = atan2(dy, dx)
  let [omega, theta, l] = map3Tup(
    [['omega', 0], ['theta', Math.atan2(dx, dy)], ['L', Math.sqrt(dx*dx + dy*dy)]] as Tup3<Tup<string, number>>,
    pBuilder
  )
  let [g, c] = map2Tup(
    [['G', 0.98], ['C', 0.01]],
    pBuilder
  )

  // let points: Tup<Variable, Variable>[] = [[pivX, pivY], [bobX, bobY]]
  // let lever = new Line(points, 'black', false)

  // let dragPoint = new DragPoint(bobX, bobY, pivR, 'green')
  // let frees = (new Set<Variable>()).add(bobX).add(bobY)


  // pendulum group
  let pend = new Pendulum(omega, theta, l, c, bobS.x, bobS.y, pivotS.x, pivotS.y, g)

  return pend
}

// given a json of shapes, build a model for the shapes
export function buildModel(canvas: fabricJSONObj, renderer: () => void): Model {

  // console.log()
  let retStore: State = State.empty()
  let objs = canvas.shapes
  // two passes: first, normalize to eddie's position conventions
  let normObjs = objs.map(normalizeFabricShape)

  // next, allocate variables and shapes for each input object
  normObjs.map(fs => buildBackendShapes(retStore, fs)).forEach(shape => {
    retStore = retStore.addShape(shape, false)
  })

  // console.log(canvas.physicsGroups)
  canvas.physicsGroups.forEach( grp => {
    let newShapes: Shape[]
    let newGroup: PhysicsGroup
    if (grp.type == 'pendulum') {
      let physObj = Object.assign({}, grp) as pendulumGroup
      let [pivot, bob, rod] = map3Tup(
        [physObj.pivot, physObj.bob, physObj.rod],
        (s: fabricObject) => buildBackendShapes(retStore, normalizeFabricShape(s))
      )
      newShapes = [pivot, bob, rod]
      newGroup = buildPendulum(retStore, pivot, bob, rod)
    } else {
      console.log('unrecognized group tag:')
      console.log(grp)
    }

    newShapes.forEach(s => retStore = retStore.addShape(s, false))
    retStore.addPhysGroup(newGroup, renderer)
  })

  let ret = new Model(retStore)
  // console.log('model:')
  // console.log(ret)
  return ret
}
