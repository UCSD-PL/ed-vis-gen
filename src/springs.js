function init() {
  all_objects = [];
  drag_points = [];

  // initial positions for everything that needs to be restored
  // the compiler should build this up in the future
  Initials = {s1: {v: 0, x: 200, y: 300, dy: -200, dx: 0},
              s2: {v: 0, x: 300, y: 300, dy: -200, dx: 0},
              s3: {v: 0, x: 400, y: 300, dy: -200, dx: 0},
              i1: {x: 200, y: 300},
              i2: {x: 200, y: 100},
              i3: {x: 300, y: 300},
              i4: {x: 300, y: 100},
              i5: {x: 400, y: 300},
              i6: {x: 400, y: 100},
              p1: {x1: 175, y1: 92, x2: 225, y2: 108},
              p2: {x1: 275, y1: 92, x2: 325, y2: 108},
              p3: {x1: 375, y1: 92, x2: 425, y2: 108},
              w1: {x: 200, y: 77, h: 30, w: 30},
              w2: {x: 300, y: 70, h: 45, w: 45},
              w3: {x: 400, y: 62, h: 60, w: 60}
            };


  // springs
  S1 = Spring(Initials.s1.x, Initials.s1.y, Initials.s1.dx, Initials.s1.dy, "black");
  I1 = InteractionPoint (Initials.i1.x, Initials.i1.y);
  I2 = InteractionPoint (Initials.i2.x, Initials.i2.y);
  W1 = Image(Initials.w1.x, Initials.w1.y, Initials.w1.h, Initials.w1.w, "iron");
  push(I1.links, S1, I2, W1);
  I2.links.push(W1);

  S2 = Spring(Initials.s2.x, Initials.s2.y, Initials.s2.dx, Initials.s2.dy, "black");
  I3 = InteractionPoint (S2.x, S2.y);
  I4 = InteractionPoint (S2.x, S2.y+S2.dy);
  W2 = Image(Initials.w2.x, Initials.w2.y, Initials.w2.h, Initials.w2.w, "iron");
  push(I3.links, S2, I4, W2);
  I4.links.push(W2);

  S3 = Spring(Initials.s3.x, Initials.s3.y, Initials.s3.dx, Initials.s3.dy, "black");
  I5 = InteractionPoint (S3.x, S3.y);
  I6 = InteractionPoint (S3.x, S3.y+S3.dy);
  W3 = Image(Initials.w3.x, Initials.w3.y, Initials.w3.h, Initials.w3.w, "iron");
  push(I5.links, S3, I6, W3);
  I6.links.push(W3);

  // TODO: if one interaction is "add masses to platforms", rest length needs a
  // constraint of the form
  // RL = intrinsicRL + ∑ m*g/k
  // (http://www.ux1.eiu.edu/~cfadd/1150/15Period/Vert.html)
  RestLengths = {s1: 125, s2: 125, s3: 125};
  G = 9.8; // currently not used, might be needed for restlengths (see above)
  Ks = {s1: 5, s2: 5, s3: 5};
  Masses = {s1: 500, s2: 1000, s3: 1500};
  Dampers = {s1: 5, s2: 5, s3: 5};

  CurrentVs = {s1: 0, s2: 0, s3: 0};

  // base, platforms
  Base = Rectangle(S1.x-100, S1.y, S3.x+100, S3.y + 100, "black", "rgba(127,127,127,0.5)");
  Plat1 = Rectangle(Initials.p1.x1, Initials.p1.y1, Initials.p1.x2, Initials.p1.y2, "black", "rgba(0,0,0,0)");
  Plat2 = Rectangle(Initials.p2.x1, Initials.p2.y1, Initials.p2.x2, Initials.p2.y2, "black", "rgba(0,0,0,0)");
  Plat3 = Rectangle(Initials.p3.x1, Initials.p3.y1, Initials.p3.x2, Initials.p3.y2, "black", "rgba(0,0,0,0)");

  // link up ipoints
  I1.links.push(Plat1);
  I2.links.push(Plat1);
  I3.links.push(Plat2);
  I4.links.push(Plat2);
  I5.links.push(Plat3);
  I6.links.push(Plat3);

  push(all_objects, S1, S2, S3, W1, W2, W3, Base, Plat1, Plat2, Plat3);
  push(all_objects, I1, I2, I3, I4, I5, I6);
  push(drag_points, I1, I2, I3, I4, I5, I6);

  // initialize timer

  tau = Timer(10, function(t) {
    update_constraints();
    global_redraw();
  }, function() {
    restoreAll([
      // springs
      S1, Initials.s1, S2, Initials.s2, S3, Initials.s3,
      // ipoints
      I1, Initials.i1, I2, Initials.i2, I3, Initials.i3,
      I4, Initials.i4, I5, Initials.i5, I6, Initials.i6,
      // platforms
      Plat1, Initials.p1, Plat2, Initials.p2, Plat3, Initials.p3,
      // weights
      W1, Initials.w1, W2, Initials.w2, W3, Initials.w3
    ]
    );

    // velocities
    restore(CurrentVs, {s1: Initials.s1.v, s2: Initials.s2.v, s3: Initials.s3.v});
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

  W1.y = Plat1.y1 - W1.h/2;
  W2.y = Plat2.y1 - W2.h/2;
  W3.y = Plat3.y1 - W3.h/2;
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
