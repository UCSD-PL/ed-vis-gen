
// Primitive: ClosedLine
function ClosedLine (points, fill) {
    return {
        draw: function(ctx) {
            var len = points.length;
            if (len <= 0) { return }
            if (len%2 != 0) { return }
            ctx.fillStyle = fill;
            ctx.beginPath();
            ctx.moveTo(points[0],points[1]);
            for (i = 2; i < len; i += 2) {
                ctx.lineTo(points[i],points[i+1]);    
            }
            ctx.fill();
            ctx.stroke();
        }
    }
}

function Line (points, fill) {
    return {
        draw: function(ctx) {
            var len = points.length;
            if (len <= 0) { return }
            if (len%2 != 0) { return }
            ctx.fillStyle = fill;
            ctx.beginPath();
            ctx.moveTo(points[0],points[1]);
            for (i = 2; i < len; i += 2) {
                ctx.lineTo(points[i],points[i+1]);    
            }
            ctx.stroke();
        }
    }
}

// type Rectangle = {
// 	x1: int
// 	y1: int
// 	x2: int
// 	y2: int
// 	fill: string
// 	implementation: {
// 		ClosedLine([x1,y1, x2,y1, x2,y2, x1,y2, x1,y1], fill);
// 	}
// }

// translates to:

function Rectangle (x1,y1,x2,y2,fill) {
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

// type Arrow = {
// 	x1: int
// 	y1: int
// 	x2: int
// 	y2: int
// 	fill: string
// 	implementation: {
// 		OpenLine([x1,y1,x2,y2]);
// 		tx1 = ...;
// 		ty1 = ...;
// 		tx2 = ...;
// 		ty2 = ...;
// 		tx3 = ...;
// 		ty3 = ...;
// 		Triangle(tx1, ty1,  tx2, ty2,  tx3, ty3, fill);
// 	}
// }

// translates to

function Arrow(x1,x2,y1,y2,fill) {
	return {
		x1: x1,
		y1: y1,
		x2: x2,
		y2: y2,
		fill: fill,
		draw: function (ctx) {
			with (this) {
				OpenLine([x1,y1,x2,y2]).draw();
				// tx1 = ...
				// ty1 = ...
				// tx2 = ...
				// ty2 = ...
				// tx3 = ...
				// ty3 = ...
				Triangle(tx1, ty1,  tx2, ty2,  tx3, ty3, fill).draw()
			}
		}
    }
}


function init() {
    all_objects = [];
    //var R1 = Rectangle(...)
    // translates to:
    R1 = Rectangle(100, 100, 200, 200, "black");
    all_objects.push(R1);

    //var R2 = Rectangle(...)
    // translates to:
    R2 = Rectangle(10,10, 50, 50, "red");
    all_objects.push(R2);
}

function draw_all(ctx) {
    for (var i = 0; i < all_objects.length; i++) {
        all_objects[i].draw(ctx)
    }
}

function update_constraints() {
	R1.x2 = R2.x1 / 2;
}

