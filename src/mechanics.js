function init() {
  all_objects = [];
  interaction_points = [];

  PigMass = 75;
  PigVelocity = {x:0, y:0};
  Initial = {x:150, y:150, v:{x:0, y:0} };
  Pig = Image(Initial.x, Initial.y, 50, 50, "pig");
  //Pig = {x:Initial.x, y:Initial.y}
  //all_objects.push(Pig);

  Ramp = Triangle (Initial.x-75, Initial.y-75, Initial.x-75, Initial.y+75, Initial.x+75, Initial.y+75, "rgba(0,0,0,0)");
  red = "red";
  V1 = Arrow (Initial.x, Initial.y, -50, -50, red);
  I1 = InteractionPoint (Initial.x-50, Initial.y-50);
  V2 = Arrow (Initial.x, Initial.y, 50, -50, red);
  I2 = InteractionPoint (Initial.x+50, Initial.y-50);
  V3 = Arrow (Initial.x, Initial.y, 0, +150, red);
  I3 = InteractionPoint (Initial.x, Initial.y+150);

  Title = Text(50, 50, "Pig on a ramp with friction", "16pt Comic sans MS");

  // right now, start/stop/reset are handled as html buttons
  // TODO: implement these
  //Start = TextCircle(400, 100, 40, -15, 10, "Go", "black");
  //SI = InteractionPoint(400, 100);
  //Reset = TextCircle(400, 200, 40, -30, 10, "Reset", "black");
  //RI = InteractionPoint(400, 200);

  T = 0;

  push(all_objects, V1, V2, V3, Title, Pig, Ramp /*,Start, Reset*/);
  push(interaction_points, I1, I2, I3 /*,SI, RI*/);
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

function interactivity_update() {
  // update locations based on changes in interactivity points
  V1.dx = I1.x - V1.x;
  V1.dy = I1.y - V1.y;
  V2.dx = I2.x - V2.x;
  V2.dy = I2.y - V2.y;
  V3.dx = I3.x - V3.x;
  V3.dy = I3.y - V3.y;
}

function update_constraints() {
  // differential equations, explicit time version
  // x(t) = at^2/2 + v0t + x0, for constant acceleration.
  // time is dampened by 1/100 for display purposes.
  Pig.x = Initial.x + Initial.v.x * T + (V1.dx + V2.dx + V3.dx) * T * T;
  Pig.y = Initial.y + Initial.v.x * T + (V1.dy + V2.dy + V3.dy) * T * T;

  // update the vector positions
  V1.x = Pig.x;
  V1.y = Pig.y;

  V2.x = Pig.x;
  V2.y = Pig.y;

  V3.x = Pig.x;
  V3.y = Pig.y;

  // update interactivity point locations
  I1.x = V1.x + V1.dx;
  I1.y = V1.y + V1.dy;
  I2.x = V2.x + V2.dx;
  I2.y = V2.y + V2.dy;
  I3.x = V3.x + V3.dx;
  I3.y = V3.y + V3.dy;

}
