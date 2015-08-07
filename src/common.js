//

function common_init() {
  var c = document.getElementById("mainCanvas");
  var ctx = c.getContext("2d");
  ctx.canvas.width  = window.innerWidth-20;
  ctx.canvas.height = window.innerHeight-20;
  global_ctx = ctx;
  ctx = document.getElementById("incCanvas").getContext("2d");
  ctx.canvas.width  = window.innerWidth-20;
  ctx.canvas.height = window.innerHeight-20;
  inc_ctx = ctx;
  c.addEventListener("mousedown", doMouseDown);
  c.addEventListener("mouseup", doMouseUp);
  c.addEventListener("mousemove", doMouseMove);
  dragged_obj = null;
}

function doMouseDown(event) {
  switch (event.button) {
    case 0: // left click
      doLeftClick(event);
      break;
    case 2: // right click
      doRightClick(event);
      break;
    default:
      alert(event.button);
  }
}

function doLeftClick(event) {
  dragged_obj = null;
  var x = event.layerX;
  var y = event.layerY;
  for (var i = 0; i < drag_points.length; i++) {
    if (withinRadius(x, y, drag_points[i])) {
      dragged_obj = drag_points[i];
      break;
    }
  }
}

function doRightClick(event) {
  // if we clicked on a vector, prompt for the vector's magnitude
  var x = event.layerX;
  var y = event.layerY;
  for (var i = 0; i < rightClick_points.length; ++i) {
    if (withinRadius(x,y, rightClick_points[i])) {
      var m = parseFloat(prompt("What should the magnitude be?", "50"));
      rightClick_points[i].magnitude = m;
      rightClick_update();
      global_redraw();
      break;
    }
  }
}

function doMouseUp(event) {
  //drag_update();
  dragged_obj = null;
}

function doMouseMove(event) {
  if (dragged_obj != null) {
    var dx = event.layerX - dragged_obj.x;
    var dy = event.layerY - dragged_obj.y;
    dragged_obj.x = event.layerX;
    dragged_obj.y = event.layerY;

    for (var i = 0; i < dragged_obj.links.length; ++i) {
      dragged_obj.links[i].translate(dx,dy);
    }
    // console.log("(" + event.layerX +"," + event.layerY + ")");
    // console.log("(" + dragged_obj.x +"," + dragged_obj.y + ")");
    // console.log("-");
    drag_update();
    // confused why this is commented out: don't we need to update the constraints too here?
    // with implicit time, calling "update_constraints" corresponds to a clock tick.

    //update_constraints();
    global_redraw();
  }
}

function global_redraw() {
  var ctx = global_ctx;
  ctx.clearRect(0,0, ctx.canvas.width, ctx.canvas.height);
  draw_all(ctx);

  inc_objects.forEach(function(e) {
    e.incDraw(inc_ctx);
  });
}

function draw_all(ctx) {
  for (var i = 0; i < all_objects.length; i++) {
    all_objects[i].draw(ctx);
  }
}
