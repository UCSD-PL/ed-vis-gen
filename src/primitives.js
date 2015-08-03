// Primitive: ClosedLine
function ClosedLine (points, stroke, fill) {
  return {
    draw: function(ctx) {
      var len = points.length;
      if (len <= 0) { return }
      if (len%2 != 0) { return }
      ctx.fillStyle = fill;
      ctx.strokeStyle = stroke;
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

// Line primitive. Points is an array of (x,y) pairs, stroke specifies the
// color of the line stroke, and dash specifies whether to use a dashed line
// or not.
function Line (points, stroke, dash) {
  return {
    points : points,
    stroke: stroke,
    dash: dash,
    draw: function(ctx) {
      with (this) {
        var len = points.length;
        if (len <= 0) { return }
        if (len%2 != 0) { return }
        ctx.save();
        if (dash) {ctx.setLineDash([2,2]);}
        ctx.strokeStyle = stroke;
        ctx.beginPath();
        ctx.moveTo(points[0],points[1]);
        for (i = 2; i < len; i += 2) {
          ctx.lineTo(points[i],points[i+1]);
        }
        ctx.stroke();
        ctx.restore();
      }
    }
  }
}

function Spring (x, y, dx, dy, stroke) {
  return {
    x: x,
    y: y,
    dx: dx,
    dy: dy,
    translate: function(deltax, deltay) {
			with (this) {
				x += deltax;
				y += deltay;
			}
		},
    draw: function (ctx) {
      with (this) {
        // draw a sinusoid centered on the line between
        // (x,y) -> (x+dx, y+dy)
        //ctx.save();
        //ctx.translate(x,y);
        //ctx.moveTo(0,0);
        //ctx.rotate(Math.atan2(dy,dx));
        ctx.strokeStyle = stroke;
        ctx.beginPath();

        var A = 10;
        var tau = Math.PI/50;
        var deltay = - A*Math.cos(0);
        var offset = 0;
        var IMAX = 1000;

        var dist = 10;
        var theta = Math.atan2(dy,dx);
        var dx2 = dist*Math.cos(theta);
        var dy2 = dist*Math.sin(theta);
        ctx.lineTo(x,y);
        ctx.lineTo(x + dx2, y + dy2);

        for (var i = 100; i < IMAX-100; ++i) {
          var p = x + i * (dx-dx2)/IMAX + A*Math.sin(tau*i+offset);
          var q = y + i * (dy-dy2)/IMAX + A*Math.cos(tau*i+offset);
          ctx.lineTo(p,q + deltay );
        }

        ctx.lineTo(x + dx, y + dy);

        ctx.stroke();
        //ctx.restore();
      }
    }
  }
}

function Text(x, y, text, font) { // font is an optional parameter
  font = font || "24pt Comic sans MS"
  return {
    x: x,
    y: y,
    font: font,
    translate: function(dx, dy) {
			with (this) {
				x += dx;
				y += dy;
			}
		},
    draw: function (ctx) {
      ctx.font = font;
      ctx.fillStyle = "black";
      ctx.fillText(text, x, y);
    }
  }
}

// Circle primitive. Fill controls the color of the interior, while stroke controls
// the color of the border.
function Circle (x, y, r, fill, stroke) {
  return {
    x: x,
    y: y,
    r: r,
    fill: fill,
    stroke: stroke,
    translate: function(dx, dy) {
			with (this) {
				x += dx;
				y += dy;
			}
		},
    draw: function (ctx) {
      with (this) {
        ctx.beginPath();
        ctx.fillStyle = fill;
        ctx.strokeStyle = stroke;
        ctx.arc(x,y,r, 0, 2*Math.PI);
        ctx.fill();
        ctx.stroke();
      }
    }
  }
}
// Image primitive. Needs a corresponding img tag in the html source.
function Image (x, y, h, w, name) {
  return {
    x: x,
    y: y,
    h: h,
    w: w,
    name: name,
    translate: function(dx, dy) {
			with (this) {
				x += dx;
				y += dy;
			}
		},
    draw: function(ctx) {
      with (this) {
        var i = document.getElementById(name);
        //i.style.display="initial";
        ctx.drawImage(i, x-w/2, y-h/2, h, w);
      }
    }
  }
}

// Timer primitive. Takes a frequency and body as arguments. Can be started,
// stopped, and reset. Assumes work takes a single (numeric) argument representing
// the current time.
function Timer (freq, work, done) {
  return {
    t: 0,
    freq: freq,
    inner: 0,
    work: work,
    done: done,
    start: function () {
      this.inner = setInterval(function(me){
        me.work(me.t);
        me.t++;
      }, this.freq, this);
    },
    stop: function() { clearInterval(this.inner); },
    reset: function() {
      clearInterval(this.inner);
      this.t=0;
      this.done();
    }
  }
}

function InteractionPoint (x,y) {
  return {
    x: x,
    y: y,
    cr: 2,
    r: 20,
    fill: "black",
    links: [], // linked objects for translations
    translate: function(dx, dy) {
			with (this) {
				x += dx;
				y += dy;
			}
		},
    draw: function(ctx) {
      with (this) {
        Circle(x, y, cr, fill).draw(ctx);
      }
    }
  }
}

// Plots values over time. Time is displayed either on the x-axis or on the y-axis.
// x and y are position, h and w are height/width, and resolution is the number
// of values to record. A new value is added to a plot by calling plot.record(val).
function Plot (x, y, h, w, stroke, resolution) {
  return {
    x: x,
    y: y,
    h: h,
    w: w,
    xStart: 0, // coordinates of first value in plot
    yStart: 0,
    res: resolution,
    stroke: stroke,
    vals: [],
    record: function (v) { with (this) {
      vals.push(v);
      if (vals.length >= res) {
        vals.shift();
      }

      var mx = Math.max.apply(null, vals);
      var mn = Math.min.apply(null, vals);
      var dx = w * (v - mn)/(mx - mn)
      xStart = x + dx;
      yStart = y;
    }},
    draw: function (ctx) { with (this) {
      ctx.save();
      ctx.strokeStyle = stroke;
      ctx.beginPath();

      // scale by max and min values
      var mx = Math.max.apply(null, vals);
      var mn = Math.min.apply(null, vals);
      //console.log("(" + (mx) + "," + (mn) + ")");
      var vls = vals.slice();
      vls.reverse();
      var dx = w * (vls[0] - mn)/(mx - mn)
      // map y0 -> y, yend -> y + h
      ctx.moveTo(x + dx,y);
      for (var e = 0; e < vls.length; ++e) {
        // map mn -> x, mx -> x + w on a linear scale
        dx = w * (vls[e] - mn)/(mx - mn);
        // map y0 -> y, yend -> y + h
        var dy = h*(e)/(res);
        ctx.lineTo(x + dx, y + dy);

      }
      ctx.stroke();
      ctx.restore();
    }}
  }
}
