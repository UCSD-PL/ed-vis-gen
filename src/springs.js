function init() {
  all_objects = [];
  drag_points = [];

  // initial positions for everything that needs to be restored
  // the compiler should build this up in the future
  Initials = {s1: {v: 0, x: 200, y: 300, dy: -200, dx: 0},
              i1: {x: 200, y: 300},
              i2: {x: 200, y: 100},
              p1: {x1: 175, y1: 92, x2: 225, y2: 108},
              w1: {x: 200, y: 77, h: 30, w: 30},
              ms: {mn: 10, mx: 100, val: 55},
              ss: {mn: 0.5, mx: 5, val: 2.75},
              ds: {mn: 0, mx: 1, val: 0.5},
              msOff: 50, ssOff: 50, dsOff: 50,
              i10: {x: 400, y:200},
              i11: {x: 400, y:300},
              i12: {x: 400, y:400}
            };


  // springs
  S1 = Spring(Initials.s1.x, Initials.s1.y, Initials.s1.dx, Initials.s1.dy, "black");
  I1 = InteractionPoint (Initials.i1.x, Initials.i1.y);
  I2 = InteractionPoint (Initials.i2.x, Initials.i2.y);
  W1 = Image(Initials.w1.x, Initials.w1.y, Initials.w1.h, Initials.w1.w, "iron");
  push(I1.links, S1, I2, W1)


  // (http://www.ux1.eiu.edu/~cfadd/1150/15Period/Vert.html)
  InitRestLengths = {s1: 125};// s2: 125, s3: 125};
  CurrRestLengths = copy(InitRestLengths);
  G = .98;

  CurrentVs = {s1: 0};


  // sliders
  MassSlider  = Slider(350, 200, 100, Initials.msOff, Initials.ms.mn, Initials.ms.mx, Initials.ms.val, "Mass");
  StiffSlider = Slider(350, 300, 100, Initials.ssOff, Initials.ss.mn, Initials.ss.mx, Initials.ss.val, "Stiffness");
  DampSlider  = Slider(350, 400, 100, Initials.dsOff, Initials.ds.mn, Initials.ds.mx, Initials.ds.val, "Damping");

  // slider interaction point
  I10 = InteractionPoint(Initials.i10.x, Initials.i10.y);
  I11 = InteractionPoint(Initials.i11.x, Initials.i11.y);
  I12 = InteractionPoint(Initials.i12.x, Initials.i12.y);

  // base, platform
  Base = Rectangle(S1.x-100, S1.y, S1.x+100, S1.y + 100, "black", "rgba(127,127,127,0.5)");
  Plat1 = Rectangle(Initials.p1.x1, Initials.p1.y1, Initials.p1.x2, Initials.p1.y2, "black", "rgba(0,0,0,0)");

  // link up ipoints
  push(I1.links, Plat1);


  push(all_objects, S1,  W1, Base, Plat1, MassSlider, StiffSlider, DampSlider);
  push(all_objects, I1, I2, I10, I11, I12);
  push(drag_points, I1, I2, I10, I11, I12);

  // initialize timer

  tau = Timer(20, function(t) {
    update_constraints();
    global_redraw();
  }, function() {
    restoreAll([
      // springs
      S1, Initials.s1,
      // ipoints
      I1, Initials.i1, I2, Initials.i2,

      // platforms
      Plat1, Initials.p1,
      // weights
      W1, Initials.w1,
      // RLs
      CurrRestLengths, InitRestLengths,

      // slider interactivity points
      I10, Initials.i10, I11, Initials.i11, I12, Initials.i12

    ]
    );
    // velocities
    restore(CurrentVs, {s1: Initials.s1.v});

    restore(MassSlider, {offset: Initials.msOff, minVal:Initials.ms.mn, maxVal:Initials.ms.mx, currVal:Initials.ms.val});
    restore(StiffSlider, {offset: Initials.ssOff, minVal:Initials.ss.mn, maxVal:Initials.ss.mx, currVal:Initials.ss.val});
    restore(DampSlider, {offset: Initials.dsOff, minVal:Initials.ds.mn, maxVal:Initials.ds.mx, currVal:Initials.ds.val});

    global_redraw();
  });
}

function drag_update() {
  I2.x = S1.x + S1.dx;

  S1.dy = (I2.y - S1.y);

  Plat1.y1 = I2.y - 8;
  Plat1.y2 = I2.y + 8;

  W1.y = Plat1.y1 - W1.h/2;


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

function update_constraints() {
  CurrRestLengths.s1 = InitRestLengths.s1 - MassSlider.currVal * G / StiffSlider.currVal;

  // F = kx - cv - mg = ma => dv = (kx-cv)/m + g
  CurrentVs.s1 = CurrentVs.s1 + ((StiffSlider.currVal*(-1*(S1.dy + CurrRestLengths.s1)) - DampSlider.currVal*CurrentVs.s1)/MassSlider.currVal);

  // dx/dt = v => dx = v
  S1.dy = S1.dy + CurrentVs.s1;

  if (dragged_obj !== I2) {
    CurrentVs.s1 = CurrentVs.s1 + (StiffSlider.currVal*(-1*(S1.dy + CurrRestLengths.s1)) - DampSlider.currVal*CurrentVs.s1)/ MassSlider.currVal;
    S1.dy = S1.dy + CurrentVs.s1;

    I2.y = S1.y + S1.dy;
    I2.x = S1.x + S1.dx;
  } else {
    S1.dy = I2.y - S1.y;
    I2.x = S1.x + S1.dx;
  }

  Plat1.y1 = I2.y - 8;
  Plat1.y2 = I2.y + 8;

  W1.y = Plat1.y1 - W1.h/2;

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
