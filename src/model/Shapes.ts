import {Variable} from './Variable'

export interface Shape {}
export interface Drawable extends Shape {
  stroke: string
}


// Line primitive. Points is an array of (x,y) pairs, stroke specifies the
// color of the line stroke, and dash specifies whether to use a dashed line
// or not.
export class Line implements Drawable {
  constructor(
    public points: [Variable, Variable][],
    public stroke: string,
    public dash:boolean
  ){}
}

export interface VecLike extends Drawable {
  x: Variable
  y: Variable
  dx: Variable
  dy: Variable
}

export class Arrow implements VecLike {
  constructor(
    public x: Variable,
    public y: Variable,
    public dx: Variable,
    public dy: Variable,
    public stroke: string
  ){}
}

export class Spring implements VecLike {
  constructor(
    public x: Variable,
    public y: Variable,
    public dx: Variable,
    public dy: Variable,
    public stroke: string
  ){}
}

export class Text implements Drawable {
  public font: string
  constructor(
    public x: Variable,
    public y: Variable,
    public text: string,
    public stroke: string,
    font?: string
  ){
    this.font = font || "24pt Comic sans MS"
  }
}

// Circle primitive. Fill controls the color of the interior, while stroke controls
// the color of the border.
export class Circle implements Drawable {
  constructor(
    public x: Variable,
    public y: Variable,
    public r: Variable,
    public stroke: string,
    public fill: string
  ){}
}

export interface RecLike extends Drawable {
  x: Variable
  y: Variable
  dx: Variable
  dy: Variable
}

export class Image implements RecLike {
  constructor(
    public x: Variable,
    public y: Variable,
    public dx: Variable,
    public dy: Variable,
    public name: string,
    public stroke: string
  ){}
}

export class Rectangle implements RecLike {
  constructor(
    public x: Variable,
    public y: Variable,
    public dx: Variable,
    public dy: Variable,
    public stroke: string
  ){}
}


export class DragPoint implements Drawable {
  constructor(
    public x: Variable,
    public y: Variable,
    public r: Variable,
    public stroke: string
  ){}
}

// pretty printer: return the constructor and variable names
export function pp(s: Shape): string {
  let ret = ""
  let pPoint = (x: Variable, y: Variable) => "[" + x.name + "," + y.name + "]"

  if (s instanceof Line) {
    ret += "Line("
    s.points.forEach(([x, y]) => ret + " " + pPoint(x, y) + ",")
    ret = ret.slice(0, -1)
  } else if (s instanceof Arrow || s instanceof Spring) {
    if (s instanceof Arrow) {
      ret += "Arrow("
    } else {
      ret += "Spring("
    }

    ret += pPoint(s.x, s.y) + ", " + s.dx.name + ", " + s.dy.name

  } else if (s instanceof Circle || s instanceof DragPoint) {
    if (s instanceof Circle) {
      ret += "Circle("
    } else {
      ret += "DragPoint"
    }

    ret += pPoint(s.x, s.y) + ", " + s.r.name
  } else if (s instanceof Rectangle || s instanceof Image) {
    if (s instanceof Rectangle) {
      ret += "Rect("
    } else {
      ret += "Image("
    }

    ret += pPoint(s.x, s.y) + ", " + s.dx.name + ", " + s.dy.name

  } else if (s instanceof Text) {
    ret += "Text("
    ret += pPoint(s.x, s.y)
  } else {
    console.log('unhandled shape in prettyprinter:')
    console.log(s)
    assert(false)
  }
  ret += ")"
  return ret
}
export function collectVars(s: Shape): Set<Variable> {
  let ret = new Set<Variable>()
  if (s instanceof Line) {
    s.points.forEach(([x, y]) => ret.add(x).add(y))
  } else if (s instanceof Arrow || s instanceof Spring) {
    ret.add(s.x).add(s.y).add(s.dx).add(s.dy)
  } else if (s instanceof Circle || s instanceof DragPoint) {
    ret.add(s.x).add(s.y).add(s.r)
  } else if (s instanceof Rectangle || s instanceof Image) {
    ret.add(s.x).add(s.y).add(s.dx).add(s.dy)
  } else if (s instanceof Text) {
    ret.add(s.x).add(s.y)
  } else {
    console.log('unhandled shape in collectVars:')
    console.log(s)
    assert(false)
  }

  return ret
}


// export type Shape =
//   Line | Arrow | Spring | Text | Circle | Rectangle | Image | DragPoint
