import {Expression, Equation} from 'cassowary'
import {Circle, Line, DragPoint} from './model/Shapes'
import {VType, CassVar, Variable} from './model/Variable'
import SView = require('./view/Shapes')
import {Model} from './model/Model'
import View = require('./view/View')
import {DragController} from './controller/Controller'
import Ex = require('./model/Export')
import {PointGeneration, InteractionSynthesis} from './model/Synthesis'
import {DISPLAY_ID, map2Tup, map3Tup, map4Tup, Tup3, Tup, Tup4} from './util/Util'
import {fabricJSONObj, buildModel} from './model/Import'
import {Pendulum} from './model/Physics'
import {Poset} from './util/Poset'
import {ICanvas} from 'fabric'



// let mainCanv = document.getElementById('mainCanvas') as HTMLCanvasElement
// let mainCtx = mainCanv.getContext('2d')
//

export var initModel = Model.empty()

// // build a circle, add to the model

let dragCont: DragController

// let buttonCont = new Cont.ButtonController()

export function refresh() {
  dragCont.m = initModel
  View.renderModel(initModel)
}

export function drawFromFabric(object: fabricJSONObj, canvas: ICanvas) {
  // console.log(object)
  initModel = buildModel(object, canvas, refresh)
  dragCont = new DragController(initModel, canvas)
  dragCont.enableDrags()
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


function overlayContacts() {
  let pointGen = new PointGeneration(initModel.main.eval())
  let r = initModel.main.addVar(VType.Prim, 'arr', 10)
  let suffix = 0
  let newS = initModel.main
  for (let [[xv, xe], [yv, ye]] of pointGen.makePoints(initModel.main.prog)) {
    initModel.main.store.addCVar(xv)
    initModel.main.store.addCVar(yv)
    initModel.main.store.addEq(new Equation(Expression.fromVariable(xv._value), xe.toCass()))
    initModel.main.store.addEq(new Equation(Expression.fromVariable(yv._value), ye.toCass()))
    let newPoint = new Circle(xv, yv, r, 'black', 'red')
    newS = newS.addShape("CP" + (suffix++).toString(), newPoint, false)
  }
  initModel = new Model(newS, new Map<DragPoint, Set<Variable>[]>())
  refresh()
}

// backend exports
(window as any).BACKEND = {}
export var backendExport: any = (window as any).BACKEND
backendExport.drawFromFabric = drawFromFabric
backendExport.startPhysics = () => initModel.main.start()
backendExport.stopPhysics = () => initModel.main.stop()
backendExport.resetPhysics = () => initModel.main.reset()
backendExport.contacts = overlayContacts
