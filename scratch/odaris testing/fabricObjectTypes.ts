type fabricCircle = {
  type: string, // "circle"
  left: number, // left + radius = x (basically)
  top: number, // top + radius = y (basically)
  radius: number,
  fill: string
}

type fabricRect = {
  type: string, // "rect"
  left: number, // x equivalent of RectJSON
  top: number, // y equivalent
  width: number, // dx
  height: number, // dy
  fill: string
}

type fabricLine = {
  type: string, // "line"
  left: number, top: number, // x and y equivalent of PointJSON for start (for LineJSON)
  width: number,
  height: number, // (left, height + y) = "end" since shapes aren't rotatable on the fabric.js canvas (yet)
  fill: string
}

type fabricJSONObj = {
  objects: { (fabricCircle | fabricRect | fabricLine ) // I think this is what we're probably going to end up using the most so far?
  }
}
