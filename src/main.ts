import {Expression, Equation} from 'cassowary'
import {Circle, Line, DragPoint, pp} from './model/Shapes'
import {VType, CassVar, Variable} from './model/Variable'
import SView = require('./view/Shapes')
import {Model} from './model/Model'
import {renderState} from './view/View'
import {DragController} from './controller/Controller'
import Ex = require('./model/Export')
import {PointGeneration, InteractionSynthesis} from './model/Synthesis'
import {DISPLAY_ID, map2Tup, map3Tup, map4Tup, Tup3, Tup, Tup4, flip, assert, filter, map} from './util/Util'
import {fabricJSONObj, buildModel, buildManipModel} from './model/Import'
import {Pendulum} from './model/Physics'
import {Poset} from './util/Poset'
import {ICanvas} from 'fabric'

import {triggerMD} from './model/Events'
import {circularSim} from './model/Simulation'

import {startSession, endSession} from './logging/Session'


export var initModel = Model.empty()

// // build a circle, add to the model

let physCont: DragController
let physCanv: ICanvas
let physicsFirst = true // does the physics drag controller need to be initialized?
let physicsState: Map<Variable, number> // state of physics variables

let editCont: DragController
let editInt: number = 0 // interval ID for drag simulation
let editFirst = true // does the edit drag controller need to be initialized?

export function refresh(cont: DragController, canv: ICanvas) {
  cont.m = initModel
  cont.receiver = canv
  renderState(initModel.main, canv)
}

export function drawToPhysics(object: fabricJSONObj, canvas: ICanvas) {
  
  let disabled = true
  if (disabled)
    return

  //
  physCanv = canvas
  initModel = buildModel(object, () => refresh(physCont, canvas))
  if (physicsFirst) {
    physCont = new DragController(initModel, canvas, false)
    canvas.on('after:render', () => refresh(physCont, canvas))
    physicsFirst = false
  }
  // dragCont.enableDrags()
  physicsState = initModel.main.eval()
  refresh(physCont, canvas)

}

export function loadModel(object: fabricJSONObj) {
  initModel = buildModel(object, () => null)
  // if (physicsFirst) {
  //   physCont = new DragController(initModel, canvas, false)
  //   canvas.on('after:render', () => refresh(physCont, canvas))
  //   physicsFirst = false
  // }
  // dragCont.enableDrags()
  physicsState = initModel.main.eval()
  // initModel.main.debug()
  //refresh(physCont, canvas)
}

export function drawManipModel(object: fabricJSONObj, canvas: ICanvas, targetName: string) {
  physCanv = canvas
  initModel = buildManipModel(object, targetName)
  if (physicsFirst) {
    physCont = new DragController(initModel, canvas, false)
    canvas.on('after:render', () => refresh(physCont, canvas))
    physicsFirst = false
  }
  // dragCont.enableDrags()
  physicsState = initModel.main.eval()
  initModel.main.debug()
  // console.log(initModel.main.prog.allFrees)
  refresh(physCont, canvas)
}

export function drawToEdit(dpName: string, dpChoice: number, canvas: ICanvas) {
  clearInterval(editInt) // stop previous simulation, reset state
  initModel.main.dragging = false
  initModel.main.draggedPoint = null
  initModel.main.store.suggestEdits(physicsState, new Set(physicsState.keys()))


  let dp = changeDPChoice(dpName, dpChoice)
  if (editFirst) {
    editCont = new DragController(initModel, canvas, true)
    canvas.on('after:render', () => refresh(editCont, canvas))
    editFirst = false
  }
  refresh(editCont, canvas)

  // start simulation
  if (dp) {
    let startPoint = {x: physicsState.get(dp.x), y: physicsState.get(dp.y)}
    editInt = circularSim(startPoint, canvas)
  }
}

export function finishEditChoice() {
  clearInterval(editInt) // stop previous simulation, reset state
  initModel.main.dragging = false
  initModel.main.draggedPoint = null
  initModel.main.store.suggestEdits(physicsState, new Set(physicsState.keys()))
}

export function changeDPChoice(dpName: string, dpChoice: number): DragPoint {
  let dp = initModel.main.prog.names.get(dpName)
  if (!dp) {
    console.log('WARNING: dragpoint not found:')
    console.log(dpName)
    console.log('store:')
    initModel.main.prog.printShapes()
    return null
  }
  assert(dp instanceof DragPoint, 'expected dragpoint but found' + pp(dp) + " for name " + dpName)
  if (!initModel.candidateFrees.has(dp as DragPoint)) {
    console.log('WARNING: dragpoint present but frees not found:')
    console.log(dp)
    console.log('frees:')
    console.log(initModel.candidateFrees)
  }
  // console.log('frees:')
  // console.log(initModel.candidateFrees)
  // console.log('choices:')
  let choices = initModel.candidateFrees.get(dp as DragPoint)
  // console.log(choices)

  initModel.main.prog = initModel.main.prog.addFrees(dp as DragPoint, choices[dpChoice])
  return dp as DragPoint

}

function getChoices(dpName: string): string[][] {
  let dp = initModel.main.prog.names.get(dpName)
  if (!dp) {
    console.log('WARNING: dragpoint not found:')
    console.log(dpName)
    console.log('store:')
    initModel.main.prog.printShapes()
    return null
  }
  assert(dp instanceof DragPoint, 'expected dragpoint but found' + pp(dp) + " for name " + dpName)
  if (!initModel.candidateFrees.has(dp as DragPoint)) {
    console.log('WARNING: dragpoint present but frees not found:')
    console.log(dp)
    console.log('frees:')
    console.log(initModel.candidateFrees)
  }
  // console.log('frees:')
  // console.log(initModel.candidateFrees)
  // console.log('choices:')
  let allFrees = Array.from(initModel.candidateFrees.get(dp as DragPoint).map(vs => Array.from(map(vs, (v:Variable) => v.name))))
  return allFrees
}

function getConnections(dpName: string): string[][] {
  let dp = initModel.main.prog.names.get(dpName)
  if (!dp) {
    console.log('WARNING: dragpoint not found:')
    console.log(dpName)
    console.log('store:')
    initModel.main.prog.printShapes()
    return null
  }
  assert(dp instanceof DragPoint, 'expected dragpoint but found' + pp(dp) + " for name " + dpName)
  if (!initModel.candidateFrees.has(dp as DragPoint)) {
    console.log('WARNING: dragpoint present but frees not found:')
    console.log(dp)
    console.log('frees:')
    console.log(initModel.candidateFrees)
  }

  let shapes = initModel.getConnectedShapes(dp as DragPoint)
  let names = flip(initModel.main.prog.names)
  return shapes.map(ss => [...map(ss, s => names.get(s))])
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

function testME() {
  let store = initModel.main.eval()
  let dps = filter(initModel.main.prog.shapes, s => s instanceof DragPoint) as Set<DragPoint>

  for (let dp of dps) {
    let p = {x: store.get(dp.x), y: store.get(dp.y)}
    console.log('dp:')
    console.log(p)
    // let mouseDown = trigger(physCanv, p)
    let simInt = circularSim(p, physCanv)

  }
}

function printMain() {
  initModel.main.debug()
}

// backend exports
(window as any).BACKEND = {}
export var backendExport: any = (window as any).BACKEND
backendExport.drawToPhysics = drawToPhysics
backendExport.drawManipModel = drawManipModel
backendExport.drawToEdit = drawToEdit
backendExport.startPhysics = () => initModel.main.start()
backendExport.stopPhysics = () => initModel.main.stop()
backendExport.resetPhysics = () => initModel.main.reset()
backendExport.testME = testME
backendExport.printMain = printMain
backendExport.finishEditChoice = finishEditChoice
backendExport.getChoices = getChoices
backendExport.getConnections = getConnections
backendExport.startSession = startSession
backendExport.endSession = endSession
backendExport.loadModel = loadModel
