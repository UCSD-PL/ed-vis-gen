import v = require('./Variable')

type Var = v.Variable
export interface Shape {}
export interface Drawable extends Shape {
  stroke: string
}


// Line primitive. Points is an array of (x,y) pairs, stroke specifies the
// color of the line stroke, and dash specifies whether to use a dashed line
// or not.
export class Line implements Drawable {
  constructor(
    public points: [Var, Var][],
    public stroke: string,
    public dash:boolean
  ){}
}

export interface VecLike extends Drawable {
  x: Var
  y: Var
  dx: Var
  dy: Var
}

export class Arrow implements VecLike {
  constructor(
    public x: Var,
    public y: Var,
    public dx: Var,
    public dy: Var,
    public stroke: string
  ){}
}

export class Spring implements VecLike {
  constructor(
    public x: Var,
    public y: Var,
    public dx: Var,
    public dy: Var,
    public stroke: string
  ){}
}

export class Text implements Drawable {
  public font: string
  constructor(
    public x: Var,
    public y: Var,
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
    public x: Var,
    public y: Var,
    public r: Var,
    public stroke: string,
    public fill: string
  ){}
}

export interface RecLike extends Drawable {
  x: Var
  y: Var
  dx: Var
  dy: Var
}

export class Image implements RecLike {
  constructor(
    public x: Var,
    public y: Var,
    public dx: Var,
    public dy: Var,
    public name: string,
    public stroke: string
  ){}
}

export class Rectangle implements RecLike {
  constructor(
    public x: Var,
    public y: Var,
    public dx: Var,
    public dy: Var,
    public stroke: string
  ){}
}

export class DragPoint implements Drawable {
  constructor(
    public x: Var,
    public y: Var,
    public r: Var,
    public stroke: string
  ){}
}



// export type Shape =
//   Line | Arrow | Spring | Text | Circle | Rectangle | Image | DragPoint
