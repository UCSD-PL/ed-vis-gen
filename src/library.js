// Draws a rectangle with top left at (x1,y1) to bottom right at (x2,y2).
function Rectangle (x1, y1, x2, y2,fill) {
	return {
		x1: x1,
		y1: y1,
		x2: x2,
		y2: y2,
		fill: fill,
		draw: function (ctx) {
			with (this) {
				ClosedLine([x1,y1, x2,y1, x2,y2, x1,y2, x1,y1], fill).draw(ctx);
			}
		}
  }
}

// Draws an arrow from (x1,y1) to (x2,y2).
// TODO: fix up the head of the arrow
function Arrow(x1, y1, x2, y2, fill) {
	return {
		x1: x1,
		y1: y1,
		x2: x2,
		y2: y2,
		fill: fill,
		draw: function (ctx) {
  		with (this) {
  			Line([x1,y1,x2,y2], fill).draw(ctx);
  			// tx1 = ...
  			// ty1 = ...
  			// tx2 = ...
  			// ty2 = ...
  			// tx3 = ...
  			// ty3 = ...
  			//Triangle(tx1, ty1,  tx2, ty2,  tx3, ty3, fill).draw()
  		}
  	}
  }
}

// TODO: Circle, Text, TextBox, TextCircle, Triangle
