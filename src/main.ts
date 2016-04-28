
import Cass = require('cassowary')
import SModel = require('./model/Shapes')
import VModel = require('./model/Variable')
import SView = require('./view/Shapes')
import Model = require('./model/Model')

let mainCanv = document.getElementById('mainCanvas') as HTMLCanvasElement
let mainCtx = mainCanv.getContext('2d')

// TODO
mainCanv.width  = 1000
mainCanv.height = 1000
// canvas.addEventListener("eddiemousedown", doMouseDown);
// canvas.addEventListener("eddiemouseup", doMouseUp);
// canvas.addEventListener("eddiemousemove", doMouseMove);

let initModel = Model.Model.empty()

// build a circle, add to the model
let decls:[[string, number]] = [['x', 100], ['y', 100], ['r', 10]]

let vars = decls.map( ([name, value]) =>
  initModel.addVar(VModel.VType.Prim, name, value)
)

let circ = new SModel.Circle(vars[0], vars[1], vars[2], 'black', 'black')
let finalModel = initModel.addShape(circ)

console.log(finalModel.eval())

//SView.drawLine(mainCtx, [[10,10], [100, 10], [100, 150], [10, 170], [10, 10]])
