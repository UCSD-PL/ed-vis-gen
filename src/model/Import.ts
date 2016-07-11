import {Model, State} from './Model'
import {map2Tup, map3Tup, map4Tup} from '../util/Util'
import {Circle, Rectangle, Shape, Line} from './Shapes'

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

export type fabricJSONObj = {
  objects: (fabricCircle | fabricRect | fabricLine )[] // I think this is what we're probably going to end up using the most so far?
}


// given a json of shapes, build a model for the shapes
export function buildModel(shapes: fabricJSONObj): Model {

  // console.log()
  let retStore: State = State.empty()
  let objs = shapes.objects
  // two passes: first, normalize to eddie's position conventions
  objs.forEach(s => {
    if (s.type == 'circle') {
      let newS = s as fabricCircle
      newS.radius *= Math.sqrt(newS.scaleX * newS.scaleY)
      newS.left += newS.radius
      newS.top += newS.radius
    } else if (s.type == 'rect') {
      let newS = s as fabricRect
      newS.width *= newS.scaleX/2 // fabric stores widths in the scale matrix, eddie dx = width/2
      newS.left += newS.width
      newS.height *= newS.scaleY/2
      newS.top += newS.height
    }
  });

  // next, allocate variables and shapes for each input object
  objs.forEach(s => {
    let shape: Shape
    if (s.type == 'circle') {
      let newS = s as fabricCircle
      let [x, y, r] = map3Tup([newS.left, newS.top, newS.radius], v => retStore.allocVar(v)) // implicitly
      shape = new Circle(x, y, r, "black", newS.fill)
    } else if (s.type == 'rect') {
      let newS = s as fabricRect
      let [x, y, dx, dy] = map4Tup([newS.left, newS.top, newS.width, newS.height], v => retStore.allocVar(v))
      shape = new Rectangle(x, y, dx, dy, 'black')
    } else if (s.type == 'line') {
      let newS = s as fabricLine
      let [x1, y1] = map2Tup([newS.left, newS.top], v => retStore.allocVar(v))
      shape = new Line([[x1, y1]], newS.fill, false)
    } else {
      console.log('unrecognized fabric tag:')
      console.log(s)
      assert(false)
    }
    retStore = retStore.addShape(shape, false)
  })
  return new Model(retStore)
}
