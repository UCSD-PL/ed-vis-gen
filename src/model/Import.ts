import {Model, State, Program, Store} from './Model'

import {map2Tup, map3Tup, map4Tup, Tup, Tup3, assert, flatMap, fold, union, map, zip, repeat, toMap, flip, filter, exists, subset, find, intersect} from '../util/Util'
import {Circle, Rectangle, Shape, Line, DragPoint, pp, Spring, Arrow, Image} from './Shapes'

import {PhysicsGroup, Pendulum, SpringGroup} from './Physics'
import {VType, Variable, CassVar} from './Variable'
import {constrainAdjacent, InteractionSynthesis} from './Synthesis'

import {Poset} from '../util/Poset'
import {Default} from './Ranking'
import {ICanvas} from 'fabric'
import {buildSpringGroup} from './import/Spring'

type fabricCommon = {
  type: string,
  fill: string,
  name: string,
  scaleX: number,
  scaleY: number,
  height: number,
  width: number,
  left: number,
  top: number,
  flipX: boolean,
  flipY: boolean
}
type fabricCircle = {
  // left: number, // left + radius = x (basically)
  // top: number, // top + radius = y (basically)
  radius: number
} & fabricCommon

type fabricRect = {
  // left: number, // x equivalent of RectJSON
  // top: number, // y equivalent
  // width: number, // dx
  // height: number
} & fabricCommon

type fabricImg = {
  src: string
} & fabricRect

type fabricSpring = {
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  dx: number,
  angle: number
} & fabricCommon

type fabricLine = {
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  angle: number
  // left: number,
  // top: number, // x and y equivalent of PointJSON for start (for LineJSON)
  // width: number,
  // height: number // (left, height + y) = "end" since shapes aren't rotatable on the fabric.js canvas (yet)
} & fabricCommon

type fabricDrag = {
  X: number,
  Y: number,
  DX: number,
  DY: number,
  shape: fabricObject,
  choice: number
} & fabricCircle

type fabricArrow = {
  angle: number
} & fabricCommon

type fabricTriangle = {
  // something something triangle
} & fabricCommon

export type fabricObject =
  fabricCircle | fabricRect | fabricImg | fabricLine | fabricDrag | fabricTriangle | fabricSpring | fabricArrow
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
  } else if (s.type == 'rect' || s.type == 'image') {
    let newS = Object.assign({}, s) as fabricRect
    newS.width *= newS.scaleX/2 // fabric stores widths in the scale matrix, eddie dx = width/2
    newS.left += newS.width
    newS.height *= newS.scaleY/2
    newS.top += newS.height
    ret = newS
  } else if (s.type == 'arrow') {
    let newS = Object.assign({}, s) as fabricArrow
    // height == hypotenuse, angle = theta = degree of rotation
    // TODO: move point to center of base (currently at bottom left)

    newS.height *= newS.scaleY
    newS.width = newS.height * Math.sin(2*Math.PI/360 * newS.angle)
    newS.height *= Math.cos(2*Math.PI/360 * newS.angle)
    // black magic...i'm not sure why this works
    newS.height *= -1
    // shift top/left to base
    newS.left -= newS.width - s.width/2 * s.scaleX * Math.cos(2*Math.PI/360 * newS.angle)
    newS.top -= newS.height - s.width/2 * s.scaleX * Math.sin(2*Math.PI/360 * newS.angle)
    ret = newS
  } else if (s.type == 'line') {
    // console.log(s)
    let newS = Object.assign({}, s) as fabricLine

    newS.height *= newS.scaleY
    newS.width = newS.height * Math.sin(2*Math.PI/360 * newS.angle)
    newS.height *= Math.cos(2*Math.PI/360 * newS.angle)
    // black magic...i'm still not sure??? geometry is hard
    newS.width *= -1

    // x, y coordinates are relative to origin, change to absolute system
    newS.x1 = newS.left //+ (newS.width/2 + newS.x1)*newS.scaleX
    newS.x2 = newS.left + newS.width // + (newS.width/2 + newS.x2)*newS.scaleX

    newS.y1 = newS.top //+ (newS.height/2 + newS.y1)*newS.scaleY
    newS.y2 = newS.top + newS.height//(newS.height/2 + newS.y2)*newS.scaleY

    ret = newS

  } else if (s.type == 'spring') {
    let newS = Object.assign({}, s) as fabricSpring
    // console.log(s)

    // x, y coordinates are relative to origin, change to absolute system
    //newS.x1 = newS.left + (newS.width/2 + newS.x1)*newS.scaleX
    //newS.x2 = newS.left + (newS.width/2 + newS.x2)*newS.scaleX

    //newS.y1 = newS.top + (newS.height/2 + newS.y1)*newS.scaleY
    //newS.y2 = newS.top + (newS.height/2 + newS.y2)*newS.scaleY

    // console.log(newS)

    //newS.top = newS.y1
    //newS.left = newS.x1
    //newS.height *= newS.scaleY
    //newS.width = -newS.height * Math.sin(2*Math.PI/360 * newS.angle)
    //newS.height *= Math.cos(2*Math.PI/360 * newS.angle)

    // console.log(newS)

    newS.width *= newS.scaleX/2
    newS.left += newS.width
    newS.dx = 0 //could add input dx feature later


    ret = newS

  } else if (s.type == 'dragPoint') {
    // TODO: left and top don't reflect the underlying object in the import...
    //       ...but do in the frontend. debug.
    let newS = Object.assign({}, s) as fabricDrag

    // left: X + shape.width*shape.scaleX*DX,
    // top: Y  + shape.height*shape.scaleY*DY
    newS.radius *= Math.sqrt(newS.scaleX * newS.scaleY)
    newS.left = newS.X + newS.shape.width*newS.shape.scaleX*newS.DX
    newS.top = newS.Y + newS.shape.height*newS.shape.scaleY*newS.DY
    ret = newS
    // console.log(ret)
  } else {
    console.log('unrecognized shape in normalize:')
    console.log(s)
    assert(false)
  }

  return ret
}

// given a store and (normalized) fabric shape, make variables in the store and return a backend shape over the variables
function buildBackendShapes(store: State, s: fabricObject): Tup<string, Shape> {
  let shape: Shape
  if (s.type == 'circle' || s.type == 'dragPoint') {
    let newS = s as fabricCircle
    let [x, y, r] = map3Tup([newS.left, newS.top, newS.radius], v => store.allocVar(v))
    if (s.type == 'circle') {
      shape = new Circle(x, y, r, "black", newS.fill)
    } else {
      shape = new DragPoint(x, y, r, 'green')
    }
  } else if (s.type == 'rect' || s.type == 'image') {
    let newS = s as fabricImg // careful: accessing newS.src is only safe for images
    let [x, y, dx, dy] = map4Tup([newS.left, newS.top, newS.width, newS.height], v => store.allocVar(v))
    if (newS.type == 'image') {
      if (! (window as any).BACKEND.IMAGES) {
        (window as any).BACKEND.IMAGES = new Map<string, HTMLImageElement>()
      }
      // make the image, checking the image cache
      let imgCache: Map<string, HTMLImageElement> = (window as any).BACKEND.IMAGES
      let newImg: HTMLImageElement
      // if present, use cache's version
      if (imgCache.has(newS.src)) {
        newImg = imgCache.get(newS.src)
      } else {
        // otherwise, make a new entry and add to cache
        newImg = document.createElement('img')
        newImg.src = newS.src
        newImg.id = newS.name
        newImg.style.display = 'none'
        document.head.appendChild(newImg)
        imgCache.set(newS.src, newImg)
      }

      // finally, create an Image for it
      shape = new Image(x, y, dx, dy, newS.name, 'black')
    } else {
      shape = new Rectangle(x, y, dx, dy, 'black')
    }
  } else if (s.type == 'arrow') {
    let newS = s as fabricArrow
    let [x, y, dx, dy] = map4Tup([newS.left, newS.top, newS.width, newS.height], v => store.allocVar(v))
    shape = new Arrow(x, y, dx, dy, 'black')
  } else if (s.type == 'line') {
    let newS = s as fabricLine
    let [x1, y1] = map2Tup([newS.x1, newS.y1], v => store.allocVar(v))
    let [x2, y2] = map2Tup([newS.x2, newS.y2], v => store.allocVar(v))
    shape = new Line([[x1, y1], [x2, y2]], newS.fill, false)
  } else if (s.type == 'spring') {
    let newS = s as fabricSpring
    let [x, y, dx, dy] = map4Tup([newS.left, newS.top, newS.dx, newS.height], v => store.allocVar(v))
    shape = new Spring(x, y, dx, dy, newS.fill)
  } else {
    console.log('unrecognized fabric tag:')
    console.log(s)
    assert(false)
  }
  return [s.name, shape]
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
  // theta = atan2(dx, dy)
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

  let rodVars = new Set(rodS.points[1]) // assumes rod goes from pivot -> bob


  // pendulum group
  let pend = new Pendulum(omega, theta, l, c, bobS.x, bobS.y, pivotS.x, pivotS.y, g, rodVars)

  return pend
}

// given a json of shapes, build a model for the shapes
export function buildModel(model: fabricJSONObj, renderer: () => void): Model {

  // console.log(model)
  let retStore: State = State.empty()
  let objs = model.shapes
  // three passes: first, normalize to eddie's position conventions
  let normObjs = objs.map(normalizeFabricShape)

  // second, pluck out dragpoint choices
  let dragChoices: Map<string, number> = toMap((normObjs.filter(s => s.type == 'dragPoint') as fabricDrag[])
    .map(dp => [dp.name, dp.choice] as Tup<string, number>))

  // finally, allocate variables and shapes for each input object
  normObjs.map(fs => buildBackendShapes(retStore, fs)).forEach(([name, shape]) => {
    retStore = retStore.addShape(name, shape, false)
  })

  // console.log(model.physicsGroups)
  let newPhysicsGroups = new Set<PhysicsGroup>()
  // add in pendulum groups
  model.physicsGroups.forEach( grp => {
    let newShapes: Tup<string, Shape>[]
    let newGroup: PhysicsGroup
    if (grp.type == 'pendulum') {
      let physObj = Object.assign({}, grp) as pendulumGroup
      let [pivot, bob, rod] = map3Tup(
        [physObj.pivot, physObj.bob, physObj.rod],
        (s: fabricObject) => buildBackendShapes(retStore, normalizeFabricShape(s))
      )
      newShapes = [pivot, bob, rod]
      newGroup = buildPendulum(retStore, pivot[1], bob[1], rod[1])
    } else {
      console.log('unrecognized group tag:')
      console.log(grp)
    }

    newShapes.forEach(([name, s]) => retStore = retStore.addShape(name, s, false))
    newPhysicsGroups.add(newGroup)
    //retStore.addPhysGroup(newGroup, renderer)
  })



  // console.log('before synthesis:')
  // console.log(retStore)
  // console.log('shapes:')
  // console.log([...retStore.prog.shapes].map(s => pp(s)).join())
  // console.log('equations:')
  let [xEqs, yEqs] = constrainAdjacent(retStore)
  // console.log(eqs)
  let buildFVs = (seeds: Set<CassVar>) => [InteractionSynthesis.validFreeVariables(seeds, xEqs), InteractionSynthesis.validFreeVariables(seeds, yEqs)]

  let possibleFrees = new Map<DragPoint, Set<Variable>[]>()


  for (let [dp] of retStore.prog.allFrees) {

    assert(dp.x instanceof CassVar, 'expected cassvars for dragpoint members')
    assert(dp.y instanceof CassVar, 'expected cassvars for dragpoint members')

    // get the candidate sets for seeds {{x}, {y}, {x, y}}
    let vX = InteractionSynthesis.validFreeVariables(new Set<CassVar>().add(dp.x as CassVar), xEqs)
    let vY = InteractionSynthesis.validFreeVariables(new Set<CassVar>().add(dp.y as CassVar), yEqs)
    let vBoth = new Set<Set<CassVar>>()

    for (let xs of vX) {
      for (let ys of vY) {
        vBoth.add(union(xs, ys))
      }
    }

    // collect the results and build programs for the ranker
    // IMPORTANT: programs are built w.r.t the original program, i.e. independently
    let newFrees = union(union(vX, vY), vBoth)
    // console.log('candidates for')
    // console.log(dp)
    // console.log(newFrees)
    let candProgs = map(newFrees, (frees) => retStore.prog.addFrees(dp, frees))

    // rank the results
    let ranked = new Poset(zip(candProgs, repeat(retStore.store)), Default, [retStore.prog, retStore.store] as Tup<Program, Store>)

    // console.log(ranked.toArr())

    let frees = ranked.toArr().map(([p]: [Program, Store]) => p.allFrees.get(dp))
    possibleFrees.set(dp, frees)
    let dpName = flip(retStore.prog.names).get(dp)
    // pluck out its free-variables for the particular drag point, add to the cumulative program
    let selFrees = frees[dragChoices.get(dpName)]

    retStore.prog = retStore.prog.addFrees(dp, selFrees)

  }


  // finally, add dragpoint free variables as needed
  let drags = filter(retStore.prog.shapes, s => s instanceof DragPoint) as Iterable<DragPoint>
  let St = (v1: Variable, v2: Variable) => (new Set<Variable>()).add(v1).add(v2)

  retStore.prog.shapes.forEach(s => {
    if (s instanceof Spring) {
      newPhysicsGroups.add(buildSpringGroup(s, retStore))
    }
  });

  for (let grp of newPhysicsGroups) {
    for (let dp of drags) {
      let grpVars = grp.frees()
      let e = find(retStore.store.equations, e =>
       (e.vars().has(dp.x) || e.vars().has(dp.y)) && intersect(e.vars(), grpVars).size > 0)
      if (e) {
        grp.addDrag(dp)
     }
    }
    retStore.addPhysGroup(grp, renderer)
  }

  // add in spring groups


  let ret = new Model(retStore, possibleFrees)
  // console.log('model:')
  // console.log(ret)
  return ret
}
