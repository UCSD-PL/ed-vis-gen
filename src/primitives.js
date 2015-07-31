// Primitive: ClosedLine
function ClosedLine (points, fillStyle) {
  return {
    draw: function(ctx) {
      var len = points.length;
      if (len <= 0) { return }
      if (len%2 != 0) { return }
      ctx.fillStyle = fillStyle;
      ctx.strokeStyle = "black";
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

function Line (points, strokeStyle) {
  return {
    draw: function(ctx) {
      var len = points.length;
      if (len <= 0) { return }
      if (len%2 != 0) { return }
      ctx.strokeStyle = strokeStyle;
      ctx.beginPath();
      ctx.moveTo(points[0],points[1]);
      for (i = 2; i < len; i += 2) {
        ctx.lineTo(points[i],points[i+1]);
      }
      ctx.stroke();
    }
  }
}

function Text(x, y, text, font) { // font is an optional parameter
  font = font || "24pt Comic sans MS"
  return {
    x: x,
    y: y,
    font: font,
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
    draw: function (ctx) {
      ctx.beginPath();
      ctx.fillStyle = fill;
      ctx.strokeStyle = stroke;
      ctx.arc(x,y,r, 0, 2*Math.PI);
      ctx.fill();
      ctx.stroke();
    }
  }
}
// Image primitive. Needs a corresponding img tag in the html source.
// TODO
function Image (x, y, h, w, name) {

  return {
    x: x,
    y: y,
    h: h,
    w: w,
    name: name,
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
function Timer (freq, work, whenDone) {
  return {
    t: 0,
    freq: freq,
    inner: 0,
    work: work,
    donek: whenDone,
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
      this.donek();
    }
  }
}

function InteractionPoint (x,y) {
  return { x: x, y: y}
}
