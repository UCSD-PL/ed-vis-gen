
import Cass = require('cassowary')
import SModel = require('./model/Shapes')
import VModel = require('./model/Variable')
import SView = require('./view/Shapes')
import Model = require('./model/Model')
import View = require('./view/View')
import Cont = require('./controller/Controller')

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
let decls:[[string, number]] = [['x', 100], ['y', 100]]

let vars = decls.map( ([name, value]) =>
  initModel.main.addVar(VModel.VType.Prim, name, value)
)

vars.push(initModel.main.addVar(VModel.VType.Cass, 'r', 10))

let ddecls:[[string, number]] = [['dx', 110], ['dy', 100]]
let dvars = ddecls.map( ([name, value]) =>
  initModel.main.addVar(VModel.VType.Cass, name, value)
)
dvars.push(initModel.main.addVar(VModel.VType.Prim, 'dr', 5))

let circ = new SModel.Circle(vars[0], vars[1], vars[2], 'black', 'black')
let dpoint = new SModel.DragPoint(dvars[0], dvars[1], dvars[2], 'black')

// add frees....
let frees = (new Set<VModel.Variable>()).add(dvars[0]).add(dvars[1])
let finState = initModel.main.addShape(circ).addShape(dpoint).addFrees(dpoint, frees)



let finalModel = new Model.Model(finState)


// MFW it doesn't work zzzz
View.renderModel(finalModel)
let _ = new Cont.ClickController(finalModel, document.getElementById('mainCanvas'))


// console.log(finalModel.eval())
// console.log(circ instanceof SModel.Line)



//SView.drawLine(mainCtx, [[10,10], [100, 10], [100, 150], [10, 170], [10, 10]])
