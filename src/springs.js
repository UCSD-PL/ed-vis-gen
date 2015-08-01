function init() {
  all_objects = [];
  drag_points = [];


  S1 = Spring(200, 300, 0, -200, "black");
  I1 = InteractionPoint (S1.x, S1.y);
  I2 = InteractionPoint (S1.x, S1.y+S1.dy);

  RestLengths = {s1: 125};
  G = 9.8;
  Ks = {s1: 5};
  Masses = {s1: 2000};
  Dampers = {s1: 10};
  Initials = {s1: {v: 0, dy: S1.dy, dx: S1.dx}};
  CurrentVs = {s1: 0};

  push(all_objects, S1, I1, I2);
  push(drag_points, I1, I2);


  // initialize timer

  tau = Timer(10, function(t) {
    update_constraints();
    global_redraw();
  }, function() {
    CurrentVs.s1 = Initials.s1.v;
    S1.dy = Initials.s1.dy;
    S1.dx = Initials.s1.dx;
    I2.y = S1.y + S1.dy;
    I2.x = S1.x + S1.dx;
    global_redraw();
  });
}

function drag_update() {
  S1.x = I1.x;
  S1.y = I1.y;

  S1.dx = (I2.x - S1.x);
  S1.dy = (I2.y - S1.y);

}

function update_constraints() {
  // F = kx - cv = ma => dv = (kx-cv)/m
  CurrentVs.s1 = CurrentVs.s1 + (Ks.s1*(-1*(S1.dy + RestLengths.s1)) - Dampers.s1*CurrentVs.s1)/ Masses.s1;
  // dx/dt = v => dx = v
  S1.dy = S1.dy + CurrentVs.s1;

  I2.y = S1.y + S1.dy;
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
