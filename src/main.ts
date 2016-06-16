
import Cass = require('cassowary')
import SModel = require('./model/Shapes')
import VModel = require('./model/Variable')
import SView = require('./view/Shapes')
import Model = require('./model/Model')
import View = require('./view/View')
import Cont = require('./controller/Controller')
import Ex = require('./model/Export')

function addLine(s: Model.State, numPoints: number): Model.State{
  let delta = 50
  let [x, y] = [50, 50]
  let points: [VModel.Variable, VModel.Variable][] = []
  for (let i = 0; i < numPoints; ++i) {
    let newPoint = [s.allocVar(x, "LX"), s.allocVar(y, "LY")] as [VModel.Variable, VModel.Variable]
    points.push(newPoint)
    x += delta
    y += delta
  }

  return s.addShape(new SModel.Line(points, "black", false))
}

function addSpring(s: Model.State): Model.State{
  let delta = 50
  let [x, y, dx, dy] = [50, 50, delta, delta]
  let [sx, sy, sdx, sdy] = [s.allocVar(x, "LX"), s.allocVar(y, "LY"), s.allocVar(dx, "LDX"), s.allocVar(dy, "LDY")]

  return s.addShape(new SModel.Spring(sx, sy, sdx, sdy, "black"))
}

function addArrow(s: Model.State): Model.State{
  let delta = 50
  let [x, y, dx, dy] = [50, 50, delta, delta]
  let [sx, sy, sdx, sdy] = [s.allocVar(x, "LX"), s.allocVar(y, "LY"), s.allocVar(dx, "LDX"), s.allocVar(dy, "LDY")]

  return s.addShape(new SModel.Arrow(sx, sy, sdx, sdy, "black"))
}

function addCircle(s: Model.State): Model.State{
  let delta = 50
  let [x, y, r] = [50, 50, delta]
  let [sx, sy, sr] = [s.allocVar(x, "CX"), s.allocVar(y, "CY"), s.allocVar(r, "SR")]

  return s.addShape(new SModel.Circle(sx, sy, sr, "black", "rgba(0,0,0,0)"))
}

function addRect(s: Model.State): Model.State{
  let delta = 50
  let [x, y, dx, dy] = [50, 50, delta, delta]
  let [sx, sy, sdx, sdy] = [s.allocVar(x, "LX"), s.allocVar(y, "LY"), s.allocVar(dx, "LDX"), s.allocVar(dy, "LDY")]

  return s.addShape(new SModel.Rectangle(sx, sy, sdx, sdy, "black"))
}

function addImage(s: Model.State, name: string): Model.State{
  let delta = 50
  let [x, y, dx, dy] = [50, 50, delta, delta]
  let [sx, sy, sdx, sdy] = [s.allocVar(x, "LX"), s.allocVar(y, "LY"), s.allocVar(dx, "LDX"), s.allocVar(dy, "LDY")]

  return s.addShape(new SModel.Image(sx, sy, sdx, sdy, name, "black"))
}

let mainCanv = document.getElementById('mainCanvas') as HTMLCanvasElement
let mainCtx = mainCanv.getContext('2d')

// TODO
mainCanv.width  = 600
mainCanv.height = 400
// canvas.addEventListener("eddiemousedown", doMouseDown);
// canvas.addEventListener("eddiemouseup", doMouseUp);
// canvas.addEventListener("eddiemousemove", doMouseMove);

let initModel = Model.Model.empty()

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



View.renderModel(initModel)
let dragCont = new Cont.DragController(initModel, document.getElementById('mainCanvas'))


// console.log(finalModel.eval())
// console.log(circ instanceof SModel.Line)

// TODO: refactor
document.getElementById('addRect').onclick = () => {
  let newState = addRect(initModel.main)
  initModel = new Model.Model(newState)
  dragCont.m = initModel
  View.renderModel(initModel)
}

document.getElementById('addImage').onclick = () => {
  let srcName = prompt('Source filename:')
  let newState = addImage(initModel.main, srcName)
  initModel = new Model.Model(newState)
  dragCont.m = initModel
  View.renderModel(initModel)
}

document.getElementById('addSpring').onclick = () => {
  let newState = addSpring(initModel.main)
  initModel = new Model.Model(newState)
  dragCont.m = initModel
  View.renderModel(initModel)
}

document.getElementById('addArrow').onclick = () => {
  let newState = addArrow(initModel.main)
  initModel = new Model.Model(newState)
  dragCont.m = initModel
  View.renderModel(initModel)
}

document.getElementById('addCircle').onclick = () => {
  let newState = addCircle(initModel.main)
  initModel = new Model.Model(newState)
  dragCont.m = initModel
  View.renderModel(initModel)
}

document.getElementById('addLine').onclick = () => {
  let numPoints = prompt('Number of points:')
  let newState = addLine(initModel.main, parseInt(numPoints))
  initModel = new Model.Model(newState)
  dragCont.m = initModel
  View.renderModel(initModel)
}

let exporter:any = document.getElementById('export')
exporter.builder = () => {
  return((new Ex.oldJSON(initModel)).toJSON())
}


//SView.drawLine(mainCtx, [[10,10], [100, 10], [100, 150], [10, 170], [10, 10]])
