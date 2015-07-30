function init() {
  all_objects = [];
  interaction_points = [];

  PigMass = 75;
  PigVelocity = {x:0, y:0};
  Initial = {x:150, y:150, v:{x:0, y:0} };
  //Pig = Image(Initial.x, Initial.y, 50, 50, "pig");
  Pig = {x:Initial.x, y:Initial.y}
  //all_objects.push(Pig);

//Ramp = Triangle (20, 150, 20, 400, 250, 400, none);
  red = "red";
  V1 = Arrow (Initial.x, Initial.y, -50, -50, red);
  I1 = InteractionPoint (Initial.x-50, Initial.y-50);
  V2 = Arrow (Initial.x, Initial.y, 50, -50, red);
  I2 = InteractionPoint (Initial.x+50, Initial.y-50);
  V3 = Arrow (Initial.x, Initial.y, 0, +150, red);
  I3 = InteractionPoint (Initial.x, Initial.y+150);
  push(all_objects, V1, V2, V3);
  push(interaction_points, I1, I2, I3);
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
    update_constraints(0);
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

function update_constraints(tau) {
  // differential equations, implicit time version
  // update the pig's position
  // dx = v * dt, v is saved as a variable
  // Pig.x = Pig.x + PigVelocity.x;
  // Pig.y = Pig.y + PigVelocity.y;

  // update the pig's velocity
  // dv = a*dt, a = ∑ vectors / m
  // PigVelocity.x = PigVelocity.x + (V1.x2 + V2.x2 + V3.x2 - 3*Pig.x) / PigMass;
  // PigVelocity.y = PigVelocity.y + (V1.y2 + V2.y2 + V3.y2 - 3*Pig.y) / PigMass;

  // explicit time version
  // x(t) = at^2/2 + v0t + x0, for constant acceleration.
  // time is dampened by 1/100 for display purposes.
  Pig.x = Initial.x + Initial.v.x * tau * (1/100) + (V1.dx + V2.dx + V3.dx) * tau * tau/2 * (1/100);
  Pig.y = Initial.y + Initial.v.x * tau * (1/100) + (V1.dy + V2.dy + V3.dy) * tau * tau/2 * (1/100);

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
