
import Cass = require('cassowary')
import SModel = require('./model/Shapes')
import VModel = require('./model/Variable')
import SView = require('./view/Shapes')
import Model = require('./model/Model')
import View = require('./view/View')
import Cont = require('./controller/Controller')
import Ex = require('./model/Export')


let mainCanv = document.getElementById('mainCanvas') as HTMLCanvasElement
let mainCtx = mainCanv.getContext('2d')

// TODO
mainCanv.width  = 600
mainCanv.height = 400
// canvas.addEventListener("eddiemousedown", doMouseDown);
// canvas.addEventListener("eddiemouseup", doMouseUp);
// canvas.addEventListener("eddiemousemove", doMouseMove);

export var initModel = Model.Model.empty()

// // build a circle, add to the model
// let decls:[[string, number]] = [['x', 100], ['y', 100]]
//
// let vars = decls.map( ([name, value]) =>
//   initModel.main.addVar(VModel.VType.Prim, name, value)
// )
//
// vars.push(initModel.main.addVar(VModel.VType.Cass, 'r', 10))
//
// let ddecls:[[string, number]] = [['dx', 110], ['dy', 100]]
// let dvars = ddecls.map( ([name, value]) =>
//   initModel.main.addVar(VModel.VType.Cass, name, value)
// )
// dvars.push(initModel.main.addVar(VModel.VType.Prim, 'dr', 5))
//
// let circ = new SModel.Circle(vars[0], vars[1], vars[2], 'black', 'black')
// let dpoint = new SModel.DragPoint(dvars[0], dvars[1], dvars[2], 'black')
//
// // add frees....
// let frees = (new Set<VModel.Variable>()).add(dvars[0]).add(dvars[1])
//let finState = addLine(initModel.main, 5)//initModel.main.addShape(circ).addShape(dpoint).addFrees(dpoint, frees)
// console.log('new frees:')
// console.log(finState.prog.allFrees)

let dragCont = new Cont.DragController(initModel, document.getElementById('mainCanvas'))
let buttonCont = new Cont.ButtonController()

export function refresh() {
  dragCont.m = initModel
  View.renderModel(initModel)
}

// console.log(finalModel.eval())
// console.log(circ instanceof SModel.Line)

// TODO: refactor


let exporter:any = document.getElementById('export')
exporter.builder = () => {
  return((new Ex.oldJSON(initModel)).toJSON())
}


//SView.drawLine(mainCtx, [[10,10], [100, 10], [100, 150], [10, 170], [10, 10]])
