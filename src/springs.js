function init() {
  all_objects = [];
  drag_points = [];

  // springs
  S1 = Spring(200, 300, 0, -200, "black");
  I1 = InteractionPoint (S1.x, S1.y);
  I2 = InteractionPoint (S1.x, S1.y+S1.dy);
  push(I1.links, S1, I2);

  S2 = Spring(300, 300, 0, -200, "black");
  I3 = InteractionPoint (S2.x, S2.y);
  I4 = InteractionPoint (S2.x, S2.y+S2.dy);

  S3 = Spring(400, 300, 0, -200, "black");
  I5 = InteractionPoint (S3.x, S3.y);
  I6 = InteractionPoint (S3.x, S3.y+S3.dy);

  // TODO: if one interaction is "add masses to platforms", rest length needs a
  // constraint of the form
  // RL = intrinsicRL + ∑ m*g/k
  // (http://www.ux1.eiu.edu/~cfadd/1150/15Period/Vert.html)
  RestLengths = {s1: 125, s2: 125, s3: 125};
  G = 9.8; // currently not used, might be needed for restlengths (see above)
  Ks = {s1: 5, s2: 10, s3: 20};
  Masses = {s1: 500, s2: 500, s3: 500};
  Dampers = {s1: 5, s2: 5, s3: 5};
  Initials = {s1: {v: 0, dy: S1.dy, dx: S1.dx},
              s2: {v: 0, dy: S2.dy, dx: S2.dx},
              s3: {v: 0, dy: S3.dy, dx: S3.dx}};
  CurrentVs = {s1: 0, s2: 0, s3: 0};

  // base, platforms
  Base = Rectangle(S1.x-100, S1.y, S3.x+100, S3.y + 100, "black", "rgba(127,127,127,0.5)");
  Plat1 = Rectangle(S1.x - 25, S1.y + S1.dy - 8, S1.x + 25, S1.y + S1.dy + 8, "black", "rgba(0,0,0,0)");
  Plat2 = Rectangle(S2.x - 25, S2.y + S2.dy - 8, S2.x + 25, S2.y + S2.dy + 8, "black", "rgba(0,0,0,0)");
  Plat3 = Rectangle(S3.x - 25, S3.y + S3.dy - 8, S3.x + 25, S3.y + S3.dy + 8, "black", "rgba(0,0,0,0)");

  // link up ipoints
  I1.links.push(Plat1);
  I2.links.push(Plat1);
  I3.links.push(Plat2);
  I4.links.push(Plat2);
  I5.links.push(Plat3);
  I6.links.push(Plat3);

  push(all_objects, S1, S2, S3, Base, Plat1, Plat2, Plat3);
  push(all_objects, I1, I2, I3, I4, I5, I6);
  push(drag_points, I1, I2, I3, I4, I5, I6);


  // initialize timer

  tau = Timer(10, function(t) {
    update_constraints();
    global_redraw();
  }, function() {
    // S1
    CurrentVs.s1 = Initials.s1.v;
    S1.dy = Initials.s1.dy;
    S1.dx = Initials.s1.dx;
    I2.y = S1.y + S1.dy;
    I2.x = S1.x + S1.dx;
    Plat1.x1 = I2.x - 25;
    Plat1.x2 = I2.x + 25;
    Plat1.y1 = I2.y - 8;
    Plat1.y2 = I2.y + 8;
    // S2
    CurrentVs.s2 = Initials.s2.v;
    S2.dy = Initials.s2.dy;
    S2.dx = Initials.s2.dx;
    I4.y = S2.y + S2.dy;
    I4.x = S2.x + S2.dx;
    Plat4.x1 = I4.x - 25;
    Plat4.x2 = I4.x + 25;
    Plat4.y1 = I4.y - 8;
    Plat4.y2 = I4.y + 8;
    // S3
    CurrentVs.s3 = Initials.s3.v;
    S3.dy = Initials.s3.dy;
    S3.dx = Initials.s3.dx;
    I6.y = S3.y + S3.dy;
    I6.x = S3.x + S3.dx;
    Plat3.x1 = I6.x - 25;
    Plat3.x2 = I6.x + 25;
    Plat3.y1 = I6.y - 8;
    Plat3.y2 = I6.y + 8;
    global_redraw();
  });
}

function drag_update() {
  S1.dx = (I2.x - S1.x);
  S1.dy = (I2.y - S1.y);

  S2.dx = (I4.x - S2.x);
  S2.dy = (I4.y - S2.y);

  S3.dx = (I6.x - S3.x);
  S3.dy = (I6.y - S3.y);

}

function update_constraints() {
  // F = kx - cv - mg = ma => dv = (kx-cv)/m + g
  CurrentVs.s1 = CurrentVs.s1 + (Ks.s1*(-1*(S1.dy + RestLengths.s1)) - Dampers.s1*CurrentVs.s1)/ Masses.s1;
  CurrentVs.s2 = CurrentVs.s2 + (Ks.s2*(-1*(S2.dy + RestLengths.s2)) - Dampers.s2*CurrentVs.s2)/ Masses.s2;
  CurrentVs.s3 = CurrentVs.s3 + (Ks.s3*(-1*(S3.dy + RestLengths.s3)) - Dampers.s3*CurrentVs.s3)/ Masses.s3;
  // dx/dt = v => dx = v
  S1.dy = S1.dy + CurrentVs.s1;
  S2.dy = S2.dy + CurrentVs.s2;
  S3.dy = S3.dy + CurrentVs.s3;

  I2.y = S1.y + S1.dy;
  I4.y = S2.y + S2.dy;
  I6.y = S3.y + S3.dy;

  Plat1.y1 = I2.y - 8;
  Plat1.y2 = I2.y + 8;
  Plat2.y2 = I4.y + 8;
  Plat2.y1 = I4.y - 8;
  Plat3.y1 = I6.y - 8;
  Plat3.y2 = I6.y + 8;
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
