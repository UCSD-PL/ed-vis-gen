// Primitive: ClosedLine
function ClosedLine (points, stroke, fill) {
  return {
    draw: function(ctx) {
      ctx.save();
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
      ctx.restore();
    }
  }
}

// Line primitive. Points is an array of (x,y) pairs, stroke specifies the
// color of the line stroke, and dash specifies whether to use a dashed line
// or not.
function Line (points, stroke, fill, dash) {
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
        ctx.save();
        var len = points.length;
        if (len <= 0) { return }
        if (len%2 != 0) { return }
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
        ctx.save();
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
        ctx.restore();
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
      ctx.save();
      ctx.font = font;
      ctx.fillStyle = "black";
      ctx.fillText(text, x, y);
      ctx.restore();
    }
  }
}

// Circle primitive. Fill controls the color of the interior, while stroke controls
// the color of the border.
function Circle (x, y, r, stroke, fill) {
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
        ctx.save();
        ctx.beginPath();
        ctx.fillStyle = fill;
        ctx.strokeStyle = stroke;
        ctx.arc(x,y,r, 0, 2*Math.PI);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
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
        ctx.save();
        var i = document.getElementById(name);
        ctx.drawImage(i, x-w/2, y-h/2, h, w);
        ctx.restore();
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
    shouldRun: false,
    start: function () { with (this) {
      if (! started) {
        started = true;
        intID = setInterval(function(me){
          requestAnimFrame( function () {
          me.work(me.t);
          me.t++;
        })}, freq, this);
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
      shouldRun = false;
      t=0;
      done();
    }}
  }
}

// x and y are assumed to be cassowary constraint variables (i.e., instances of
// c.Variable)
function InteractionPoint (x,y) {
  // c.assert(x instanceof c.Variable && y instanceof c.Variable,
  //   "InteractionPoint requires c.Variable arguments");
  // backwards compatible interface
  if (! (x instanceof c.Variable) ) {
    x = new c.Variable({value: x});
  }

  if (! (y instanceof c.Variable) ) {
    y = new c.Variable({value: y});
  }
  return {
    x: x,
    y: y,
    cr: 2,
    r: 2,
    fill: "green",
    links: [], // transitive cassowary data dependencies,
               // need to be keys in constrained_vars.
    translate: function(dx, dy) {
			c.assert(false, "translation interface not supported");
		},
    draw: function(ctx) {
      with (this) {
        Circle(x.value, y.value, cr, fill, fill).draw(ctx);
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

// Plot primitive. Records an arbitrary number of columns and plots two views
// versus each other. Auto-scales views to plot height and width as a function
// of view min/max. Data is recorded by calling member function "record" with
// an object of the form {viewName : viewValue} e.g. plot.record({t: 0, x: 5, y: 3}).

// Takes parameters:
// x, y, h, w: centers the plot at (x + w/2, y + h/2) with height h and width w.
// xFieldName, yFieldName: initial view names.
// ranges: object mapping view names to view min and max values. e.g. {x: {mn: 0, mx: 100}}
// stroke: color of plotted points
// resolution: number of points kept as history.
// simple: whether to draw axes and labels

// Exports member functions:
// setView(x,y), setXView, setYView: change the views to input parameters.
// record(v): records a datapoint.
// reset(): clears the plot. This should be called when resetting started
//          instead of modifying vals directly.
// translate(dx, dy): translates by an input delta
// moveTo(x, y): move to x and y coordinate.

// Exports values:
// xStart: x-coordinate for "current" point.
// yStart: y-coordinate for "current" point.

function Plot (x, y, h, w, xFieldName, yFieldName, ranges, stroke, resolution, simple) {
  var initVals = {};
  for (var d in ranges) {
    initVals[d] = [];
  }
  return {
    x: x, // since we're drawing incrementally, these shouldn't be directly edited.
    y: y, // intead, call "moveTo" for translations and "resize" for resizing.
    h: h,
    w: w,
    ranges: ranges,
    xStart: x+w/2, // coordinates of first value in plot
    yStart: y+h/2,
    res: resolution,
    stroke: stroke,
    vals: initVals, // history of values.
    xVals: [], // x and y (incremental) views. incDraw plots these when called.
    yVals: [], // we maintain the invariant that xVals.length = yVals.length.
    _needToClear: false, // flag for clearing plot before next incremental draw
    xFieldName: xFieldName, // x and y coordinate axes, should not be directly
    yFieldName: yFieldName, // modified. Instead, use setView.

    // Helper function to calculate the position of the most recent value.
    // Updates xStart and yStart.
    _calcStart: function () { with (this) {
      if (vals[xFieldName].length <= 0) {
        // whoops
        return;
      }
      xStart = x + xVals[xVals.length -1];
      yStart = y + yVals[yVals.length -1];
    }},

    moveTo: function (newx, newy) {with (this) {
      _needToClear = true;
      x = newx;
      y = newy;
    }},

    resize: function (neww, newh) { with (this) {
      var hRat = newh/h; // assumes h = w
      h = newh;
      w = neww;
      for (k in ranges) {
        ranges[k].mn *= hRat;
        ranges[k].mx *= hRat;
      }
      _needToClear = true;
    }},

    // Change the coordinate axes. This changes the x and y starting values,
    // so we wrap it in a function.
    setView: function(xName, yName) { with (this) {

      _needToClear = true;
      xFieldName = xName;
      yFieldName = yName;

      // recalculate x and y views
      var xMx = ranges[xFieldName].mx;
      var xMn = ranges[xFieldName].mn;

      var yMx = ranges[yFieldName].mx;
      var yMn = ranges[yFieldName].mn;
      var wCnst = w/(xMx - xMn);
      var hCnst = (yMx-yMn);

      xVals = vals[xFieldName].map(function (e) { return wCnst*(e-xMn); });
      yVals = vals[yFieldName].map(function (e) { return h * (1 - (e- yMn)/hCnst); });

      _calcStart();
    }},
    setXView: function(xName) { with (this) { setView(xName, yFieldName); }},
    setYView: function(yName) { with (this) { setView(xFieldName, yName); }},

    // record a value, of the form {view: val} e.g. {t: 0, KE: 55, PE: 70}
    record: function (v) { with (this) {

      // as an optimization, we store the (plotting) dx and dy directly in
      // xVals and yVals, so we need to scale the incoming value appropriately.
      var xMx = ranges[xFieldName].mx;
      var xMn = ranges[xFieldName].mn;

      var yMx = ranges[yFieldName].mx;
      var yMn = ranges[yFieldName].mn;
      var wCnst = w/(xMx - xMn);
      var hCnst = (yMx-yMn);

      // some pre-school algebra...
      // linearly map {xMin -> 0, xMax -> w} and { yMin -> h, yMax -> 0}.
      // y-axis is inverted because of the shitty coordinate system.
      xVals.push(wCnst*(v[xFieldName]-xMn));
      yVals.push(h * (1 - (v[yFieldName] - yMn)/hCnst));
      for (var e in v) {
        vals[e].push(v[e]);

        if (vals[e].length >= res) {
          vals[e].shift();
        }
      }

      if (xVals.length >= res) {
        xVals.shift();
        yVals.shift();
      }

      // update starting values
      _calcStart();
    }},
    translate: function (dx, dy) { with (this) {
      x += dx;
      y += dy;
      xStart += dx;
      yStart += dy;
    }},
    // clear internal history and schedule a wipe of the plot
    reset: function() { with (this) {

      for (var k in vals) {
        vals[k] = [];
      }
      xVals = [];
      yVals = [];
      _needToClear = true;
      xStart = x + w/2;
      yStart = y + h/2;
    }},
    // incrementally draw points on the canvas. points are staged into xVals and
    // yVals, so they must be cleared after plotting. if something else (e.g. a
    // reset or changing a view) schedules a clear, wipe the portion containing
    // points.
    incDraw : function (ctx) { with (this) {
      if (_needToClear) {
        ctx.clearRect(x, y, x + w, y + h);
        ctx.fill();
        _needToClear = false;
      }
      ctx.fillStyle = stroke;

      // draw new values
      xVals.forEach(function (dx, i) {
        var dy = yVals[i];
        ctx.fillRect(x + dx-0.5,y + dy-0.5,1.25,1.25); // optimization over drawing a circle
      });

      ctx.fill();
      ctx.stroke();
      xVals = [];
      yVals = [];

    }},
    // draws the axes and labels.
    draw: function (ctx) { with (this) {
      if (simple) {
        return;
      }
      ctx.save();
      ctx.fillStyle = stroke;
      ctx.beginPath();

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

      Text(x + w/2 - 5*yFieldName.length, y + h + 20, yFieldName, "18pt MS Comic Sans").draw(ctx) // y label
      Text(x + w + 10, y + h/2 + 5, xFieldName, "18pt MS Comic Sans").draw(ctx) // x label

      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }}
  }
}
