
import Cass = require('cassowary')
import {Circle} from './model/Shapes'
import {VType, CassVar} from './model/Variable'
import SView = require('./view/Shapes')
import Model = require('./model/Model')
import View = require('./view/View')
import Cont = require('./controller/Controller')
import Ex = require('./model/Export')
import {PointGeneration, InteractionSynthesis} from './model/Synthesis'
import {DISPLAY_ID} from './util/Util'


// let mainCanv = document.getElementById('mainCanvas') as HTMLCanvasElement
// let mainCtx = mainCanv.getContext('2d')
//

export var initModel = Model.Model.empty()

// // build a circle, add to the model


let dragCont = new Cont.DragController(initModel, document.getElementById(DISPLAY_ID))
// let buttonCont = new Cont.ButtonController()

export function refresh() {
  dragCont.m = initModel
  View.renderModel(initModel)
}

export function addPoints() {
  let pointBuilder = new PointGeneration(initModel.main.eval())
  let newPoints = pointBuilder.makePoints(initModel.main.prog)
  // foreach point, make a green circle. let the exprs be, for now.
  let r = initModel.main.addVar(VType.Prim, 'r', 3)
  for (let [[x, _1], [y, _2]] of newPoints) {
    initModel.main.store.addCVar(x)
    initModel.main.store.addCVar(y)
    let circ = new Circle(x, y, r, 'black', 'green')
    let finProg = initModel.main.prog.addShape(circ)
    initModel = new Model.Model(new Model.State(finProg, initModel.main.store, false, null))
    refresh()
  }
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
