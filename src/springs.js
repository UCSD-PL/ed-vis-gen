function init() {
  all_objects = [];
  drag_points = [];
  //rightClick_points = [];

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
              w3: {x: 400, y: 62, h: 60, w: 60},
              ms: {mn: 1, mx: 5, val: 1},
              ss: {mn: 0.5, mx: 2.5, val: 0.5},
              ds: {mn: 0, mx: 1, val: 0.5},
              msOff: 0, ssOff: 0, dsOff: 50,
              i10: {x: 550, y:200},
              i11: {x: 550, y:300},
              i12: {x: 600, y:400}
            };


  // springs
  S1 = Spring(Initials.s1.x, Initials.s1.y, Initials.s1.dx, Initials.s1.dy, "black");
  I1 = InteractionPoint (Initials.i1.x, Initials.i1.y);
  I2 = InteractionPoint (Initials.i2.x, Initials.i2.y);
  W1 = Image(Initials.w1.x, Initials.w1.y, Initials.w1.h, Initials.w1.w, "iron");
  push(I1.links, S1, I2, W1)

  S2 = Spring(Initials.s2.x, Initials.s2.y, Initials.s2.dx, Initials.s2.dy, "black");
  I3 = InteractionPoint (S2.x, S2.y);
  I4 = InteractionPoint (S2.x, S2.y+S2.dy);
  W2 = Image(Initials.w2.x, Initials.w2.y, Initials.w2.h, Initials.w2.w, "iron");
  push(I3.links, S2, I4, W2);

  S3 = Spring(Initials.s3.x, Initials.s3.y, Initials.s3.dx, Initials.s3.dy, "black");
  I5 = InteractionPoint (S3.x, S3.y);
  I6 = InteractionPoint (S3.x, S3.y+S3.dy);
  W3 = Image(Initials.w3.x, Initials.w3.y, Initials.w3.h, Initials.w3.w, "iron");
  push(I5.links, S3, I6, W3);

  // right click points for the weights
  //I7 = InteractionPoint(Initials.w1.x, Initials.w1.y);
  //I8 = InteractionPoint(Initials.w2.x, Initials.w2.y);
  //I9 = InteractionPoint(Initials.w3.x, Initials.w3.y);
  //push(rightClick_points, I7, I8, I9);


  // (http://www.ux1.eiu.edu/~cfadd/1150/15Period/Vert.html)
  InitRestLengths = {s1: 125, s2: 125, s3: 125};
  CurrRestLengths = copy(InitRestLengths);
  G = 9.8; // currently not used, might be needed for restlengths (see above)
  //Ks = {s1: .5, s2: .5, s3: .5};
  //InitMasses = {s1: 1, s2: 2, s3: 3};
  //CurrMasses = copy(InitMasses);

  //I7.magnitude = InitMasses.s1;
  //I8.magnitude = InitMasses.s2;
  //I9.magnitude = InitMasses.s3;

  //Dampers = {s1: .1, s2: .1, s3: .1};

  CurrentVs = {s1: 0, s2: 0, s3: 0};

  
  // sliders
  MassSlider  = Slider(550, 200, 100, Initials.msOff, Initials.ms.mn, Initials.ms.mx, Initials.ms.val, "Mass");
  StiffSlider = Slider(550, 300, 100, Initials.ssOff, Initials.ss.mn, Initials.ss.mx, Initials.ss.val, "Stiffness");
  DampSlider  = Slider(550, 400, 100, Initials.dsOff, Initials.ds.mn, Initials.ds.mx, Initials.ds.val, "Damping");

  // slider interaction point
  I10 = InteractionPoint(550 + Initials.msOff, 200);
  I11 = InteractionPoint(550 + Initials.ssOff, 300);
  I12 = InteractionPoint(550 + Initials.dsOff, 400);

  // base, platforms
  Base = Rectangle(S1.x-100, S1.y, S3.x+100, S3.y + 100, "black", "rgba(127,127,127,0.5)");
  Plat1 = Rectangle(Initials.p1.x1, Initials.p1.y1, Initials.p1.x2, Initials.p1.y2, "black", "rgba(0,0,0,0)");
  Plat2 = Rectangle(Initials.p2.x1, Initials.p2.y1, Initials.p2.x2, Initials.p2.y2, "black", "rgba(0,0,0,0)");
  Plat3 = Rectangle(Initials.p3.x1, Initials.p3.y1, Initials.p3.x2, Initials.p3.y2, "black", "rgba(0,0,0,0)");

  // link up ipoints
  push(I1.links, Plat1);
  push(I3.links, Plat2);
  push(I5.links, Plat3);


  push(all_objects, S1, S2, S3, W1, W2, W3, Base, Plat1, Plat2, Plat3, MassSlider, StiffSlider, DampSlider);
  push(all_objects, I1, I2, I3, I4, I5, I6, I10, I11, I12);
  push(drag_points, I1, I2, I3, I4, I5, I6, I10, I11, I12);

  // initialize timer

  tau = Timer(25, function(t) {
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
      W1, Initials.w1, W2, Initials.w2, W3, Initials.w3,
      // masses and RLs
      // CurrMasses, InitMasses, CurrRestLengths, InitRestLengths,

      // slider interactivity points
      I10, Initials.i10, I11, Initials.i11, I12, Initials.i12
      
    ]
    );
    // velocities
    restore(CurrentVs, {s1: Initials.s1.v, s2: Initials.s2.v, s3: Initials.s3.v});
    restore(MassSlider, {offset: Initials.msOff, minVal:Initials.ms.mn, maxVal:Initials.ms.mx, currVal:Initials.ms.val});
    restore(StiffSlider, {offset: Initials.ssOff, minVal:Initials.ss.mn, maxVal:Initials.ss.mx, currVal:Initials.ss.val});
    restore(DampSlider, {offset: Initials.dsOff, minVal:Initials.ds.mn, maxVal:Initials.ds.mx, currVal:Initials.ds.val});

    // magnitudes
    //I7.magnitude = InitMasses.s1;
    //I8.magnitude = InitMasses.s2;
    //I9.magnitude = InitMasses.s3;

    global_redraw();
  });
}

function drag_update() {
  I2.x = S1.x + S1.dx;
  I4.x = S2.x + S2.dx;
  I6.x = S3.x + S3.dx;

  S1.dy = (I2.y - S1.y);
  S2.dy = (I4.y - S2.y);
  S3.dy = (I6.y - S3.y);

  Plat1.y1 = I2.y - 8;
  Plat1.y2 = I2.y + 8;
  Plat2.y2 = I4.y + 8;
  Plat2.y1 = I4.y - 8;
  Plat3.y1 = I6.y - 8;
  Plat3.y2 = I6.y + 8;

  W1.y = Plat1.y1 - W1.h/2;
  W2.y = Plat2.y1 - W2.h/2;
  W3.y = Plat3.y1 - W3.h/2;
  

  // Mass Slider updates
  if (I10.x > MassSlider.x + MassSlider.w) {
    I10.x = MassSlider.x + MassSlider.w;
  }

  if (I10.x < MassSlider.x) {
    I10.x = MassSlider.x;
  }
  I10.y = MassSlider.y;
  MassSlider.offset = I10.x - MassSlider.x;
  MassSlider.currVal = (MassSlider.minVal + (MassSlider.maxVal-MassSlider.minVal) * MassSlider.offset / MassSlider.w);

  // Stiffness Slider updates
  if (I11.x > StiffSlider.x + StiffSlider.w) {
    I11.x = StiffSlider.x + StiffSlider.w;
  }

  if (I11.x < StiffSlider.x) {
    I11.x = StiffSlider.x;
  }
  I11.y = StiffSlider.y;
  StiffSlider.offset = I11.x - StiffSlider.x;
  StiffSlider.currVal = (StiffSlider.minVal + (StiffSlider.maxVal-StiffSlider.minVal) * StiffSlider.offset / StiffSlider.w);

  // Damping Slider updates
  if (I12.x > DampSlider.x + DampSlider.w) {
    I12.x = DampSlider.x + DampSlider.w;
  }

  if (I12.x < DampSlider.x) {
    I12.x = DampSlider.x;
  }
  I12.y = DampSlider.y;
  DampSlider.offset = I12.x - DampSlider.x;
  DampSlider.currVal = (DampSlider.minVal + (DampSlider.maxVal-DampSlider.minVal) * DampSlider.offset / DampSlider.w);

}

function rightClick_update () {
  //CurrMasses.s1 = I7.magnitude;
  //CurrMasses.s2 = I8.magnitude;
  //CurrMasses.s3 = I9.magnitude;
}

function update_constraints() {
  CurrRestLengths.s1 = InitRestLengths.s1 - MassSlider.currVal * G / StiffSlider.currVal;
  //CurrRestLengths.s2 = InitRestLengths.s2 - CurrMasses.s2 * G / Ks.s2;
  //CurrRestLengths.s3 = InitRestLengths.s3 - CurrMasses.s3 * G / Ks.s3;
  // F = kx - cv - mg = ma => dv = (kx-cv)/m + g
  CurrentVs.s1 = CurrentVs.s1 + (StiffSlider.currVal*(-1*(S1.dy + CurrRestLengths.s1)) - DampSlider.currVal*CurrentVs.s1)/ MassSlider.currVal;
  //CurrentVs.s2 = CurrentVs.s2 + (Ks.s2*(-1*(S2.dy + CurrRestLengths.s2)) - Dampers.s2*CurrentVs.s2)/ CurrMasses.s2;
  //CurrentVs.s3 = CurrentVs.s3 + (Ks.s3*(-1*(S3.dy + CurrRestLengths.s3)) - Dampers.s3*CurrentVs.s3)/ CurrMasses.s3;
  // dx/dt = v => dx = v
  S1.dy = S1.dy + CurrentVs.s1;
  //S2.dy = S2.dy + CurrentVs.s2;
  //S3.dy = S3.dy + CurrentVs.s3;

  if (dragged_obj !== I2) {
    CurrentVs.s1 = CurrentVs.s1 + (StiffSlider.currVal*(-1*(S1.dy + CurrRestLengths.s1)) - DampSlider.currVal*CurrentVs.s1)/ MassSlider.currVal;
    S1.dy = S1.dy + CurrentVs.s1;

    I2.y = S1.y + S1.dy;
    I2.x = S1.x + S1.dx;
  } else {
    S1.dy = I2.y - S1.y;
    I2.x = S1.x + S1.dx;
  }
  /*if (dragged_obj !== I4) {
    I4.y = S2.y + S2.dy;
    I4.x = S2.x + S2.dx;
  }
  if (dragged_obj !== I6) {
    I6.y = S3.y + S3.dy;
    I6.x = S3.x + S3.dx;
  }
  */
  Plat1.y1 = I2.y - 8;
  Plat1.y2 = I2.y + 8;
  /*Plat2.y2 = I4.y + 8;
  Plat2.y1 = I4.y - 8;
  Plat3.y1 = I6.y - 8;
  Plat3.y2 = I6.y + 8;
 */
  W1.y = Plat1.y1 - W1.h/2;
  //W2.y = Plat2.y1 - W2.h/2;
  //W3.y = Plat3.y1 - W3.h/2;

  //I7.x = W1.x;
  //I7.y = W1.y;
  //I8.x = W2.x;
  //I8.y = W2.y;
  //I9.x = W3.x;
  //I9.y = W3.y;

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
