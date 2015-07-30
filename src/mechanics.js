function init() {
  all_objects = [];

  PigMass = 75;
  PigVelocity = {x:0, y:0};
  Initial = {x:150, y:150, v:{x:0, y:0} };
  //Pig = Image(Initial.x, Initial.y, 50, 50, "pig");
  Pig = {x:Initial.x, y:Initial.y}
  //all_objects.push(Pig);

//Ramp = Triangle (20, 150, 20, 400, 250, 400, none);
  red = "red";
  V1 = Arrow (Initial.x, Initial.y, Initial.x-50, Initial.y-50, red);
  V2 = Arrow (Initial.x, Initial.y, Initial.x+50, Initial.y-50, red);
  V3 = Arrow (Initial.x, Initial.y, Initial.x, Initial.y+150, red);
  push(all_objects, V1, V2, V3);
}

function draw_all(ctx) {
  for (var i = 0; i < all_objects.length; i++) {
    all_objects[i].draw(ctx);
  }
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
  Pig.x = Initial.x + Initial.v.x * tau * (1/100) + (V1.x2 + V2.x2 + V3.x2 - 3*Pig.x) * tau * tau/2 * (1/100);
  Pig.y = Initial.y + Initial.v.x * tau * (1/100) + (V1.y2 + V2.y2 + V3.y2 - 3*Pig.y) * tau * tau/2 * (1/100);

  // update the vector positions
  V1.x1 = Pig.x;
  V1.y1 = Pig.y;
  V1.x2 = Pig.x-50;
  V1.y2 = Pig.y-50;

  V2.x1 = Pig.x;
  V2.y1 = Pig.y;
  V2.x2 = Pig.x+50;
  V2.y2 = Pig.y-50;

  V3.x1 = Pig.x;
  V3.y1 = Pig.y;
  V3.x2 = Pig.x;
  V3.y2 = Pig.y+150;


}
