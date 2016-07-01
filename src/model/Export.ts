// Export models (really, just the store) to json formats

import S = require('./Shapes')
import M = require('./Model')

// point: {x: string, y: string}
// circle: {center: point, r: string}
// rectangle: {center: point, dx: string, dy: string}
// line: {begin: point, end: point}
type PointJSON = {x: string, y: string}
type CircJSON = {center: PointJSON, r: string}
type RectJSON = {center: PointJSON, dx: string, dy: string}
type ImgJSON = {center: PointJSON, dx: string, dy: string, name: string}
type VectJSON = {base: PointJSON, dx: string, dy: string}
type SpringJSON = {base: PointJSON, dx: string, dy: string}
type LineJSON = {start: PointJSON, end: PointJSON}
// { vars:
//     [{name: number}],
//   ipoints: [],
//   shapes: [{type: string, name: string, args: {<shape dependent>}}],
//   equations : [],
//   inequalities: [],
//   recConstraints : [],
//   freeRecVars: [],
//   names: []
// }
type oldJSONObj = {
  vars: any[], // [{name: number}]
  shapes: {
    type: string, // "line" | "arrow" | "spring" | "circle" | "rectangle" | "image"
    name: string, // shape's name
    args: (CircJSON | RectJSON | ImgJSON | SpringJSON | VectJSON | LineJSON)
  }[],
  ipoints: PointJSON[], // [PointJSON]
  equations: any[], // []
  inequalities: any[], // []
  recConstraints: any[], // []
  freeRecVars: any[], // []
  names: any[] // []
}

export class oldJSON {
  constructor(public base: M.Model) {}

  // convert a model into an old-model json string
  public toJSON() : string {
    let vars = [... this.base.main.eval().entries()].map( ([k, v]) => {
      let ret = {} as any
      ret[k.name] = v
      return ret
    })

    let shapePrefix = "S"
    let shapeSuffix = -1
    let allocShape = () => {
      ++shapeSuffix
      return shapePrefix + shapeSuffix.toString()
    }
    let shapes = [... this.base.main.prog.shapes.values()].filter( s =>
      !(s instanceof S.DragPoint)
    ).map( s => {
      let type: string
      let name = allocShape()
      let args: CircJSON | RectJSON | ImgJSON | SpringJSON | VectJSON | LineJSON
      if (s instanceof S.Line) {
        type = "line"
        let start = s.points[0].map(i => i.name)
        let end = s.points[1].map(i => i.name)
        args = {start: {x: start[0], y: start[1]}, end: {x: end[0], y: end[1]}}
      } else if (s instanceof S.Arrow || s instanceof S.Spring) {
        if (s instanceof S.Arrow) {
          type = "arrow"
        } else {
          type = "spring"
        }
        args = {base: {x: s.x.name, y: s.y.name}, dx: s.dx.name, dy: s.dy.name}
      } else if (s instanceof S.Circle) {
        type = "circle"
        args = {center: {x: s.x.name, y: s.y.name}, r: s.r.name}
      } else if (s instanceof S.Rectangle) {
        type = "rectangle"
        args = {center: {x: s.x.name, y: s.y.name}, dx: s.dx.name, dy: s.dy.name}
      } else if (s instanceof S.Image) {
        type = "image"
        args = {center: {x: s.x.name, y: s.y.name}, dx: s.dx.name, dy: s.dy.name, name: s.name}
      } else {
        console.log('unhandled shape in export: ' + s.toString())
        assert(false)
      }
      return {type: type, name: name, args: args}
    })

    let ret: oldJSONObj = {
      vars: vars,
      shapes: shapes,
      ipoints: [],
      equations: [],
      inequalities: [],
      recConstraints: [],
      freeRecVars: [],
      names: []
    }
    return JSON.stringify(ret)
  }
}
