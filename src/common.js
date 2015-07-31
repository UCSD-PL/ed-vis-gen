function common_init() {
  var c = document.getElementById("mainCanvas");
  var ctx = c.getContext("2d");
  ctx.canvas.width  = window.innerWidth-20;
  ctx.canvas.height = window.innerHeight-20;
  global_ctx = ctx;
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
    if (x <= drag_points[i].x + 20 && x >= drag_points[i].x - 20 &&
        y <= drag_points[i].y + 20 && y >= drag_points[i].y - 20) {
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
    if (x <= rightClick_points[i].x + 20 && x >= rightClick_points[i].x - 20 &&
        y <= rightClick_points[i].y + 20 && y >= rightClick_points[i].y - 20) {
      var m = parseInt(prompt("What should the magnitude be?", "50"));
      rightClick_points[i].magnitude = m;
      rightClick_update();
      global_redraw();
      break;
    }
  }
}

function doMouseUp(event) {
  dragged_obj = null;
}

function doMouseMove(event) {
  if (dragged_obj != null) {
    dragged_obj.x = event.layerX;
    dragged_obj.y = event.layerY;
    // console.log("(" + event.layerX +"," + event.layerY + ")");
    // console.log("(" + dragged_obj.x +"," + dragged_obj.y + ")");
    // console.log("-");
    drag_update();
    // confused why this is commented out: don't we need to update the constraints too here?
    update_constraints();
    global_redraw();
  }
}

function global_redraw() {
  var ctx = global_ctx;
  ctx.clearRect(0,0, ctx.canvas.width, ctx.canvas.height);
  draw_all(ctx);
}

function draw_all(ctx) {
  for (var i = 0; i < all_objects.length; i++) {
    all_objects[i].draw(ctx);
  }
}
