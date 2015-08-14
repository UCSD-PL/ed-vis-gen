//

function common_init() {

  // canvas operations are expensive, so we distinguish between a global canvas
  // "mainCanvas", which gets (globally) wiped and redrawn every frame, and
  // an incremental canvas "incCanvas", which never gets wiped. In return,
  // drawn on the incremental canvas must clean up after themselves and implement
  // an "incDraw" method.

  // for the moment, only plots draw on the incremental canvas, but a further
  // optimization would be to put all static objects in a background canvas
  // and make everything dynamic live in the incremental canvas.
  var canvas = document.getElementById("mainCanvas");
  var ctx = canvas.getContext("2d");
  ctx.canvas.width  = window.innerWidth-20;
  ctx.canvas.height = window.innerHeight-20;
  global_ctx = ctx;
  ctx = document.getElementById("incCanvas").getContext("2d");
  ctx.canvas.width  = window.innerWidth-20;
  ctx.canvas.height = window.innerHeight-20;
  inc_ctx = ctx;
  canvas.addEventListener("mousedown", doMouseDown);
  canvas.addEventListener("mouseup", doMouseUp);
  canvas.addEventListener("mousemove", doMouseMove);
  dragged_obj = null;

  solver = new c.SimplexSolver();
  solver.autoSolve = false;
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
      on_click();
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
  on_release();
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
