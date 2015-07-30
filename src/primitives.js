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
