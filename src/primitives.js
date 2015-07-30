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
// Image primitive. Needs a corresponding img tag in the html source.
// TODO
function Image (x, y, h, w, name) {
  var i = document.getElementById(name);
  return {
    x: x,
    y: y,
    h: h,
    w: w,
    draw: function(ctx) {
      ctx.drawImage(i, x, y, h, w);
    }
  }
}

// Timer primitive. Takes a frequency and body as arguments. Can be started,
// stopped, and reset. Assumes work takes a single (numeric) argument representing
// the current time.
function Timer (freq, work) {
  return {
    t: 0,
    freq: freq,
    inner: 0,
    work: work,
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
    }
  }
}
