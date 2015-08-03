function init() {
  all_objects = [];
  drag_points = [];
  rightClick_points = [];

  PigMass = 7500;
  PigVelocity = {x:0, y:0};
  Initial = {x:150, y:150, v:{x:0, y:0} };
  Pig = Image(Initial.x, Initial.y, 50, 50, "pig");
  //Pig = {x:Initial.x, y:Initial.y}
  //all_objects.push(Pig);

  Ramp = Triangle (
    Initial.x-75, Initial.y-75,
    Initial.x-75, Initial.y+75,
    Initial.x+75, Initial.y+75,
    "black", "rgba(0,0,0,0)");
  V1 = Arrow (Initial.x, Initial.y, -50, -50, "red");
  I1 = InteractionPoint (Initial.x-50, Initial.y-50);
  I1.magnitude = Math.sqrt(V1.dx*V1.dx + V1.dy*V1.dy); // magnitude constraint variable
  V2 = Arrow (Initial.x, Initial.y, 50, -50, "red");
  I2 = InteractionPoint (Initial.x+50, Initial.y-50);
  I2.magnitude = Math.sqrt(V2.dx*V2.dx + V2.dy*V2.dy);
  V3 = Arrow (Initial.x, Initial.y, 0, +150, "red");
  I3 = InteractionPoint (Initial.x, Initial.y+150);
  I3.magnitude = Math.sqrt(V3.dx*V3.dx + V3.dy*V3.dy);

  Title = Text(50, 50, "Pig on a ramp with friction", "16pt Comic sans MS");

  // right now, start/stop/reset are handled as html buttons
  // TODO: implement these
  //Start = TextCircle(400, 100, 40, -15, 10, "Go", "black");
  //SI = InteractionPoint(400, 100);
  //Reset = TextCircle(400, 200, 40, -30, 10, "Reset", "black");
  //RI = InteractionPoint(400, 200);

  T = 0;

  tau = Timer(10, function(t){
    T = t/100;
    update_constraints();
    global_redraw();
  }, function() {
    T = 0;
    restore(Pig, Initial);
    restore(PigVelocity, Initial.v);

    V1.dx = -50;
    V1.dy = -50;
    V2.dx = 50;
    V2.dy = -50;
    V3.dx = 0;
    V3.dy = 150;
    update_constraints();
    global_redraw();
  }); // executes every 10ms (.01s)

  push(all_objects, V1, V2, V3, Title, Pig, Ramp, I1, I2, I3 /*,Start, Reset*/);
  push(drag_points, I1, I2, I3 /*,SI, RI*/);
  push(rightClick_points, I1, I2, I3);

}

function drag_update() {
  // update locations based on changes in interactivity points
  V1.dx = I1.x - V1.x;
  V1.dy = I1.y - V1.y;
  V2.dx = I2.x - V2.x;
  V2.dy = I2.y - V2.y;
  V3.dx = I3.x - V3.x;
  V3.dy = I3.y - V3.y;
}

function rightClick_update() {
  // update locations based on magnitude field
  var v1theta = Math.atan2(V1.dy, V1.dx);
  var v2theta = Math.atan2(V2.dy, V2.dx);
  var v3theta = Math.atan2(V3.dy, V3.dx);
  V1.dx = I1.magnitude * Math.cos(v1theta);
  V1.dy = I1.magnitude * Math.sin(v1theta);
  V2.dx = I2.magnitude * Math.cos(v2theta);
  V2.dy = I2.magnitude * Math.sin(v2theta);
  V3.dx = I3.magnitude * Math.cos(v3theta);
  V3.dy = I3.magnitude * Math.sin(v3theta);
}

function update_constraints() {
  // differential equations, implicit time version (i.e. dt = 1)
  // a = dv/dt = ∑ F/m => dv = ∑ F/m
  PigVelocity.x = PigVelocity.x + (V1.dx + V2.dx + V3.dx) / PigMass;
  PigVelocity.y = PigVelocity.y + (V1.dy + V2.dy + V3.dy) / PigMass;
  // v = dx/dt => dx = v
  Pig.x = Pig.x + PigVelocity.x;
  Pig.y = Pig.y + PigVelocity.y;

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

  // update magnitudes
  I1.magnitude = Math.sqrt(V1.dx*V1.dx + V1.dy*V1.dy);
  I2.magnitude = Math.sqrt(V2.dx*V2.dx + V2.dy*V2.dy);
  I3.magnitude = Math.sqrt(V3.dx*V3.dx + V3.dy*V3.dy);
}

function start() {
  tau.start();
}
function stop() {
  tau.stop();
}
function reset() {
  tau.reset();
}
