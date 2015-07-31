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

// Draws an arrow at location (x,y) with direction (dx, dy).
// TODO: add arrowhead parameters to arrow
function Arrow(x, y, dx, dy, fill) {
	return {
		x: x,
		y: y,
		dx: dx,
		dy: dy,
		fill: fill,
		draw: function (ctx) {
  		with (this) {
  			Line([x,y,x+dx,y+dy], fill).draw(ctx);

        // arrows are hard, adapted from here:
        // http://www.dbp-consulting.com/tutorials/canvas/CanvasArrow.html
        // x1 = x, y1 = y, x2 = x+dx, y2 = y+dy
        var angle = Math.PI/8; // angle arrowhead makes with line
        var d = 10; // length of arrowhead hypotenuses

        // calculate the angle of the line
        var theta=Math.atan2(dy,dx);
        // h is the line length of a side of the arrow head
        var h=Math.abs(d/Math.cos(angle));
        // angle of top hypotenuse with +X axis
        var angle1=theta+Math.PI+angle;
        // x, y coordinates of top corner
        var topx=x+dx+Math.cos(angle1)*h;
        var topy=y+dy+Math.sin(angle1)*h;
        // same calculations, but for bottom hypotenuse and corner
        var angle2=theta+Math.PI-angle;
        var botx=x+dx+Math.cos(angle2)*h;
        var boty=y+dy+Math.sin(angle2)*h;

  			Triangle(x+dx, y+dy, topx, topy, botx, boty, fill).draw(ctx);
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

// TODO: TextBox
