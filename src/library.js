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

// Draws a triangle at input three points.
function Triangle (x1, y1, x2, y2, x3, y3, fill) {
	return {
		x1: x1,
		y1: y1,
		x2: x2,
		y2: y2,
    x3: x3,
    y3: y3,
		fill: fill,
		draw: function (ctx) {
			with (this) {
				ClosedLine([x1,y1, x2,y2, x3,y3], fill).draw(ctx);
			}
		}
  }
}

// Draws an arrow at location (x,y) with direction (dx, dy) and
// arrowhead width dx2 and height dy2.
// TODO: fix up the head of the arrow
function Arrow(x, y, dx, dy, dx2, dy2, fill) {
	return {
		x: x,
		y: y,
		dx: dx,
		dy: dy,
    dx2: dx2,
    dy2: dy2,
		fill: fill,
		draw: function (ctx) {
  		with (this) {
  			Line([x,y,x+dx,y+dy], fill).draw(ctx);

        // calculate the angle of the line
        // var theta=Math.atan2(y2-y1,x2-x1);
        // // h is the line length of a side of the arrow head
        // var h=Math.abs(d/Math.cos(angle));
        //
        // ctx.rotate(theta);
        // ctx.translate(x+dx, y+dy);
        // ctx.beginPath();
        // ctx.moveTo(0,0);
        // ctx.lineTo(-dx2,dy2);
        // ctx.lineTo(-dx2, -dy2);
        // ctx.closePath();
        // ctx.fill();
        // ctx.stroke();
        // ctx.restore();
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

// x, y, and r control circle, dx, dy control offset of text.
// TODO: algorithm to center circle around text (i.e. calculate r, dx, dy as a
// function of text)
function TextCircle (x, y, r, dx, dy, text, fill) {
  return {
    x: x,
    y: y,
    r: r,
    text: text,
    fill: fill,
    draw: function(ctx) {
      Circle(x,y,r, "white", fill).draw(ctx);
      Text(x+dx, y+dy, text, "18pt Comic sans MS").draw(ctx);
    }
  }
}

// TODO: TextBox, Triangle
