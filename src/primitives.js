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
    translate: function (dx, dy) {
      for (var i = 0; i < points.length; i += 2) {
        points[i] += dx;
        points[i+1] += dy;
      }
    },
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
        for (var i = 2; i < len; i += 2) {
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
    intID: 0,
    work: work,
    done: done,
    started: false,
    start: function () { with (this) {
      if (! started) {
        started = true;
        intID = setInterval(function(me){
          me.work(me.t);
          me.t++;
        }, freq, this);
      }
    }},
    stop: function() { with (this) {
      if (started) {
        started = false;
        clearInterval(intID);
      }
    }},
    reset: function() { with (this) {
      if (started) {
        started = false;
        clearInterval(intID);
      }
      t=0;
      done();
    }}
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

// Traces values over time. Time is displayed either on the x-axis or on the y-axis.
// x and y are position, h and w are height/width, resolution is the number
// of values to record, and orientation controls whether time goes top-down or
// left-to-right. A new value is added to a plot by calling plot.record(val).

// For best results, place x and y to the center of the thing being plotted and
// record offsets from the center.
function Trace (x, y, h, w, stroke, resolution, orientation) {
  return {
    x: x,
    y: y,
    h: h,
    w: w,
    xStart: 0, // coordinates of first value in plot
    yStart: 0,
    res: resolution,
    stroke: stroke,
    u2d: orientation, // up-to-down if true, left-to-right otherwise
    vals: [],
    record: function (v) { with (this) {
      vals.push(v);
      if (vals.length >= res) {
        vals.shift();
      }
      if (u2d) {
        xStart = x + v;
        yStart = y;
      } else {
        xStart = x;
        yStart = y + v;
      }
    }},
    // assumes traced object is translated as well
    translate: function (dx, dy) { with (this) {
      x += dx;
      xStart += dx;
      y += dy;
      yStart += dy;

    }},
    draw: function (ctx) { with (this) {
      ctx.save();
      ctx.strokeStyle = stroke;
      ctx.beginPath();

      // @OPT: iterate through vals in reverse instead of making a new array
      var vls = vals.slice();
      vls.reverse();
      u2d ? ctx.moveTo(x + vls[0],y) : ctx.moveTo(x, y + vls[0]);
      for (var e = 0; e < vls.length; ++e) {
        var dx = u2d ? vls[e] : w*e/res;
        var dy = u2d ? h*(e)/(res) : vls[e];
        ctx.lineTo(x + dx, y + dy);
      }
      ctx.stroke();
      ctx.restore();
    }}
  }
}



// e.g. record({t: 5, v: 7})
// Plot(..., "t", "v", o, "red", 1000)
// o = {t: {mn: 0, mx: 100},
//      v: ...}
function Plot (x, y, h, w, xFieldName, yFieldName, ranges, stroke, resolution) {
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
    xFieldName: xFieldName, // x and y coordinate axes, should not be directly
    yFieldName: yFieldName, // modified. Instead, use setView.

    // Helper function to calculate the position of the most recent value.
    // Updates xStart and yStart.
    _calcStart: function () { with (this) {
      if (vals.length <= 0) {
        // whoops
        return;
      }
      var xMx = ranges[xFieldName].mx;
      var xMn = ranges[xFieldName].mn;
      xStart = x + w * (vals[vals.length-1][xFieldName] - xMn)/(xMx - xMn);

      var yMx = ranges[yFieldName].mx;
      var yMn = ranges[yFieldName].mn;
      yStart = y + h * (1 - (vals[vals.length-1][yFieldName] - yMn)/(yMx - yMn));
    }},

    // Change the coordinate axes. This changes the x and y starting values,
    // so we wrap it in a function.
    setView: function(xName, yName) { with (this) {
      xFieldName = xName;
      yFieldName = yName;
      _calcStart();
    }},
    setXView: function(xName) { with (this) { setView(xName, yFieldName); }},
    setYView: function(yName) { with (this) { setView(xFieldName, yName); }},

    record: function (v) { with (this) {
      vals.push(v);
      if (vals.length >= res) {
        vals.shift();
      }
      // update starting values
      _calcStart();
    }},
    translate: function (dx, dy) { with (this) {
      x += dx;
      y += dy;
    }},
    draw: function (ctx) { with (this) {
      ctx.save();
      ctx.fillStyle = stroke;
      ctx.beginPath();

      // @OPT: iterate through vals in reverse instead of making a new array
      var vls = vals.slice();
      vls.reverse();

      var xMx = ranges[xFieldName].mx;
      var xMn = ranges[xFieldName].mn;

      var yMx = ranges[yFieldName].mx;
      var yMn = ranges[yFieldName].mn;

      // axes
      ctx.moveTo(x, y + h/2); // x axis
      ctx.lineTo(x + w, y + h/2);
      ctx.moveTo(x + w/2, y); // y axis
      ctx.lineTo(x + w/2, y + h);

      // y ticks
      ctx.moveTo(x + w/2 - 10, y + h/4);
      ctx.lineTo(x + w/2 + 10, y + h/4);
      Text(x + w/2 + 15, y + h/4 + 5, (3*yMx/4 + yMn/4).toFixed(2), "12pt MS Comic Sans").draw(ctx);
      ctx.moveTo(x + w/2 - 10, y + 3*h/4);
      ctx.lineTo(x + w/2 + 10, y + 3*h/4);
      Text(x + w/2 + 15, y + 3*h/4 + 5, (3*yMn/4 + yMx/4).toFixed(2), "12pt MS Comic Sans").draw(ctx);

      // x ticks
      ctx.moveTo(x + w/4, y + h/2 - 10);
      ctx.lineTo(x + w/4, y + h/2 + 10);
      var txt = (3*xMn/4 + xMx/4).toFixed(2);
      Text(x + w/4 - 3*txt.length, y + h/2 + 25, txt, "12pt MS Comic Sans").draw(ctx);
      ctx.moveTo(x + 3*w/4, y + h/2 - 10);
      ctx.lineTo(x + 3*w/4, y + h/2 + 10);
      txt = (3*xMx/4 + xMn/4).toFixed(2);
      Text(x + 3*w/4 - 3*txt.length, y + h/2 + 25, txt, "12pt MS Comic Sans").draw(ctx);
      ctx.strokeStyle = "black";
      ctx.stroke();



      Text(x + w/2 - 5*yFieldName.length, y + h + 20, yFieldName, "18pt MS Comic Sans").draw(ctx) // y label
      Text(x + w + 10, y + h/2 + 5, xFieldName, "18pt MS Comic Sans").draw(ctx) // x label


      // scatter plot of values
      ctx.strokeStyle = stroke;
      ctx.fillStyle = stroke;
      for (var e = 0; e < vls.length; ++e) {
        var dx = w * (vls[e][xFieldName] - xMn)/(xMx - xMn);
        var dy = h * (1 - (vls[e][yFieldName] - yMn)/(yMx - yMn));
        //ctx.moveTo(x + dx, y + dy);
        ctx.fillRect(x + dx,y + dy,1,1); // optimization over drawing a circle
        ctx.fill();
      }
      ctx.restore();
    }}
  }
}
