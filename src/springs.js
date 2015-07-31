function init() {
  all_objects = [];
  interaction_points = [];

  S1 = Spring(100, 100, 200, 200, "black");

  T = 0;

  push(all_objects, S1);
  //push(interaction_points);
  dragged_obj = null;
}

function doMouseDown(event) {
  dragged_obj = null;
  var x = event.layerX;
  var y = event.layerY;
  for (var i = 0; i < interaction_points.length; i++) {
    if (x <= interaction_points[i].x + 20 && x >= interaction_points[i].x - 20 &&
        y <= interaction_points[i].y + 20 && y >= interaction_points[i].y - 20) {
      dragged_obj = interaction_points[i];
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
    interactivity_update();
    //update_constraints();
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

function interactivity_update() {

}

function update_constraints() {

}
