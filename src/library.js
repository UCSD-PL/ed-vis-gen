// Draws a rectangle with top left at (x1,y1) to bottom right at (x2,y2).
function Rectangle (x1, y1, x2, y2, stroke, fill) {
	return {
		x1: x1,
		y1: y1,
		x2: x2,
		y2: y2,
		fill: fill,
		translate: function(dx, dy) {
			with (this) {
				x1 += dx;
				x2 += dx;
				y1 += dy;
				y2 += dy;
			}
		},
		draw: function (ctx) {
			with (this) {
				ClosedLine([x1,y1, x2,y1, x2,y2, x1,y2, x1,y1], stroke, fill).draw(ctx);
			}
		}
  }
}

// Draws a triangle at input three points.
function Triangle (x1, y1, x2, y2, x3, y3, stroke, fill) {
	return {
		x1: x1,
		y1: y1,
    x2: x2,
    y2: y2,
    x3: x3,
    y3: y3,
    stroke: stroke,
    fill: fill,
		translate: function(dx, dy) {
			with (this) {
				x1 += dx;
				x2 += dx;
				x3 += dx;
				y1 += dy;
				y2 += dy;
				y3 += dy;
			}
		},
		draw: function (ctx) {
			with (this) {
				ClosedLine([x1,y1, x2,y2, x3,y3, x1,y1], stroke, fill).draw(ctx);
			}
		}
  }
}

// Draws an arrow at location (x,y) with direction (dx, dy).
// TODO: add arrowhead parameters to arrow
function Arrow(x, y, dx, dy, color) {
	return {
		x: x,
		y: y,
		dx: dx,
		dy: dy,
		color: color,
		translate: function(dx, dy) {
			with (this) {
				x += dx;
				x += dx;
			}
		},
		draw: function (ctx) {
  		with (this) {
  			Line([x,y,x+dx,y+dy], color).draw(ctx);

        // arrows are hard, adapted from here:
        // http://www.dbp-consulting.com/tutorials/canvas/CanvasArrow.html
        // x1 = x, y1 = y, x2 = x+dx, y2 = y+dy
        var angle = Math.PI/8; // angle arrowhead makes with line
        var d = 20; // length of arrowhead hypotenuses

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

  			Triangle(x+dx, y+dy, topx, topy, botx, boty, color, color).draw(ctx);
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
		translate: function(dx, dy) {
			with (this) {
				x += dx;
				y += dy;
			}
		},
    draw: function(ctx) {
      Circle(x,y,r, "white", fill).draw(ctx);
      Text(x+dx, y+dy, text, "18pt Comic sans MS").draw(ctx);
    }
  }
}

// Primitive for building sliders. x and y specify initial position,
// w specifies width of slider, offset specifies position of marker,
// minVal, maxVal, currVal, and label specify text for labels.
function Slider(x, y, w, offset, minVal, maxVal, currVal, label) {
	return {
		x: x,
		y: y,
		w: w,
		offset: offset,
		minVal: minVal,
		maxVal: maxVal,
		currVal: currVal,
		label: label,
		translate: function(dx, dy) {
			x += dx;
			y += dy;
		},
		draw: function(ctx) { with (this) {

			Line([x, y - 10, x, y + 10], "black", false).draw(ctx);
			Line([x, y, x + w, y], "black", false).draw(ctx);
			Line([x + w, y - 10, x + w, y + 10], "black", false).draw(ctx);
			Rectangle(x + offset - 10, y - 5, x + offset + 10, y + 5, "black", "black").draw(ctx);

			// labels
			Text(x-5, y-20, minVal, "12pt MS Comic Sans").draw(ctx);
			Text(x+w-5, y-20, maxVal, "12pt MS Comic Sans").draw(ctx);
			Text(x+offset-5, y-20, currVal, "12pt MS Comic Sans").draw(ctx);

			// title
			Text(x + 10, y + 30, label, "18pt MS Comic Sans").draw(ctx);
		}}
	}
}

// TODO: TextBox
