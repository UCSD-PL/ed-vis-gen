
import Cass = require('cassowary')
import {Circle, Line, DragPoint} from './model/Shapes'
import {VType, CassVar, Variable} from './model/Variable'
import SView = require('./view/Shapes')
import {Model} from './model/Model'
import View = require('./view/View')
import Cont = require('./controller/Controller')
import Ex = require('./model/Export')
import {PointGeneration, InteractionSynthesis} from './model/Synthesis'
import {DISPLAY_ID, map2Tup, map3Tup, map4Tup, Tup3, Tup, Tup4} from './util/Util'
import {fabricJSONObj, buildModel} from './model/Import'
import {Pendulum} from './model/Physics'



// let mainCanv = document.getElementById('mainCanvas') as HTMLCanvasElement
// let mainCtx = mainCanv.getContext('2d')
//

export var initModel = Model.empty()

// // build a circle, add to the model


let dragCont = new Cont.DragController(initModel, document.getElementById(DISPLAY_ID))
// let buttonCont = new Cont.ButtonController()

export function refresh() {
  dragCont.m = initModel
  View.renderModel(initModel)
}

export function drawFromFabric(object: fabricJSONObj) {
  // console.log(object)
  initModel = buildModel(object)
  refresh()
}

// console.log(finalModel.eval())
// console.log(circ instanceof SModel.Line)

function testISynth() {
  let vars = [new CassVar("X", 5), new CassVar("Y", 5), new CassVar("Z", 5), new CassVar('U', 5)]
  let e1 = (new Set<CassVar>()).add(vars[0]).add(vars[1]).add(vars[3])
  let e2 = (new Set<CassVar>()).add(vars[1]).add(vars[2]).add(vars[3])
  let eqs = (new Set<Set<CassVar>>()).add(e1).add(e2)
  let seedVars = (new Set<CassVar>()).add(vars[0])
  // X = Y + U
  // Y = Z + U
  console.log('testing synthesis')
  let synthd = InteractionSynthesis.validFreeVariables(seedVars, eqs)
  console.log(synthd)
}

function testPendulum() {
  let state = initModel.main
  let pBuilder = ([nme, v]: Tup<string, number>) => state.addVar(VType.Prim, nme, v)
  let cBuilder = ([nme, v]: Tup<string, number>) => state.addVar(VType.Cass, nme, v)

  let [pivX, pivY, pivR] = map3Tup(
    [['pivX', 150], ['pivY', 150], ['pivR', 8]] as Tup3<Tup<string, number>>,
    pBuilder
  )
  let pivot = new Circle(pivX, pivY, pivR, 'black', 'black')

  // 150 + 100/2 and 150 + 100*sqrt(3)/2
  let [bobX, bobY, bobR] = map3Tup(
    [['bobX', 200], ['bobY', 236.6], ['bobR', 20]] as Tup3<Tup<string, number>>,
    cBuilder
  )
  let bob = new Circle(bobX, bobY, bobR, 'black', 'rgba(0, 0, 0)')
  let [omega, theta, l] = map3Tup(
    [['omega', 0], ['theta', Math.PI/3], ['L', 100]] as Tup3<Tup<string, number>>,
    pBuilder
  )
  let [g, c] = map2Tup(
    [['G', 0.98], ['C', 0.01]],
    pBuilder
  )

  let points: Tup<Variable, Variable>[] = [[pivX, pivY], [bobX, bobY]]
  let lever = new Line(points, 'black', false)

  let dragPoint = new DragPoint(bobX, bobY, pivR, 'green')
  let frees = (new Set<Variable>()).add(bobX).add(bobY)


  // pendulum group
  let pend = new Pendulum(omega, theta, l, c, bobX, bobY, pivX, pivY, g)
  let newS = state.addShape(pivot, false).addShape(bob, false)
                  .addShape(lever, false).addPhysGroup(pend, refresh)
                  .addShape(dragPoint, false).addFrees(dragPoint, frees)
  initModel = new Model(newS)
  refresh()
  // newS.start()
}
// testPendulum();

(window as any).BACKEND = {}
export var backendExport: any = (window as any).BACKEND
backendExport.drawFromFabric = drawFromFabric
backendExport.startPhysics = () => initModel.main.start()
backendExport.stopPhysics = () => initModel.main.stop()
backendExport.resetPhysics = () => initModel.main.reset()
