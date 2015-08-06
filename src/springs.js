function init() {
  all_objects = [];
  drag_points = [];

  T = 0;

  // initial positions for everything that needs to be restored
  // the compiler should build this up in the future
  Initials = {s1: {v: 0, x: 200, y: 300, dy: -200, dx: 0},
              i2: {x: 200, y: 100},
              p1: {x1: 175, y1: 92, x2: 225, y2: 108},
              w1: {x: 200, y: 77, h: 30, w: 30},
              m: {mn: 10, mx: 100, val: 55},
              k: {mn: 0.5, mx: 5, val: 2.75},
              c: {mn: 0, mx: 1, val: 0.5},
              g: {mn: 0, mx: 2, val: 0.98},
              msOff: 50, ssOff: 50, dsOff: 50,
            };


  // springs
  S1 = Spring(Initials.s1.x, Initials.s1.y, Initials.s1.dx, Initials.s1.dy, "black");
  I2 = InteractionPoint (Initials.i2.x, Initials.i2.y);
  W1 = Image(Initials.w1.x, Initials.w1.y, Initials.w1.h, Initials.w1.w, "iron");


  // (http://www.ux1.eiu.edu/~cfadd/1150/15Period/Vert.html)
  InitRestLengths = {s1: 125};// s2: 125, s3: 125};
  CurrRestLengths = copy(InitRestLengths);

  CurrConstants = {m: Initials.m.val, g: Initials.g.val, k: Initials.k.val, c: Initials.c.val};
  CurrentVs = {s1: 0};

  // sliders
  addSlider("Mass", "sliders", Initials.m.mn, Initials.m.mx, Initials.m.val, function(o) {
      CurrConstants.m = getSliderValue("Mass");
  });
  addSlider("Stiffness", "sliders", Initials.k.mn, Initials.k.mx, Initials.k.val, function(o) {
      CurrConstants.k = getSliderValue("Stiffness");
  });
  addSlider("Dampening", "sliders", Initials.c.mn, Initials.c.mx, Initials.c.val, function(o) {
      CurrConstants.c = getSliderValue("Dampening");
  });
  addSlider("Gravity", "sliders", Initials.g.mn, Initials.g.mx, Initials.g.val, function(o) {
      CurrConstants.g = getSliderValue("Gravity");
  });

  // base, platform
  Base = Rectangle(S1.x-100, S1.y, S1.x+100, S1.y + 100, "black", "rgba(127,127,127,0.5)");
  Plat1 = Rectangle(Initials.p1.x1, Initials.p1.y1, Initials.p1.x2, Initials.p1.y2, "black", "rgba(0,0,0,0)");

  // Plot of t, displacement, velocity, and force
  var pltRanges = {t: {mn: 0, mx: 100}, y: {mn: -200, mx: 200}, v:{mn: -50, mx: 50}, f:{mn: -20, mx: 20}};
  // plot center is at x + w/2, y + w/2 = y+150
  // Center y on the spring: y + 150 = S1.y + S1.dy/2 => y = S1.y + S1.dy/2 - 150
  plt = Plot(Plat1.x2 + 100, S1.y + S1.dy/2 - 150, 300, 300, "t", "y", pltRanges, "red", 500);

  // trace the current value with a green dot
  Tracer = Circle(plt.xStart, plt.yStart, 3, "green", "green");


  push(all_objects, S1,  W1, Base, Plat1, plt, Tracer);
  push(all_objects, I2);
  push(drag_points, I2);

  // initialize timer

  tau = Timer(10, function(t) {
    update_constraints();
    global_redraw();
  }, function() {
    restoreAll([
      // springs
      S1, Initials.s1,
      // ipoints
      I2, Initials.i2,
      // platforms
      Plat1, Initials.p1,
      // weights
      W1, Initials.w1,
      // RLs
      CurrRestLengths, InitRestLengths

    ]
    );
    // velocities
    restore(CurrentVs, {s1: Initials.s1.v});
    plt.reset();
    T = 0;

    setSliderValue("Mass", Initials.m.val);
    setSliderValue("Stiffness", Initials.k.val);
    setSliderValue("Dampening", Initials.c.val);
    setSliderValue("Gravity", Initials.g.val);

    for (var e in CurrConstants) {
      CurrConstants[e] = Initials[e].val;
    }

    Tracer.x = plt.xStart;
    Tracer.y = plt.yStart;
    global_redraw();
  });
}

function drag_update() {
  I2.x = S1.x + S1.dx;
  S1.dy = (I2.y - S1.y);

  Plat1.y1 = I2.y - 8;
  Plat1.y2 = I2.y + 8;

  W1.y = Plat1.y1 - W1.h/2;
}

function update_constraints() {
  var mass = CurrConstants.m;
  var g = CurrConstants.g;
  var k = CurrConstants.k;
  var c = CurrConstants.c;

  CurrRestLengths.s1 = InitRestLengths.s1 - mass * g / k;

  T += 0.1;
  T = T % 100;
  // F = kx - cv = ma => dv = (kx-cv)/m
  var F = (-k*(S1.dy + CurrRestLengths.s1) - c*CurrentVs.s1)/mass;

  // dx/dt = v => dx = v
  if (dragged_obj !== I2) {
    CurrentVs.s1 = CurrentVs.s1 + F;
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

  plt.record({t: T, y: -(CurrRestLengths.s1 + S1.dy), v: -CurrentVs.s1, f: -F});
  Tracer.x = plt.xStart;
  Tracer.y = plt.yStart;

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
