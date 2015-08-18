function init() {
  all_objects = [];
  drag_points = [];
  inc_objects = [];

  T = 0;

  // initial positions for everything that needs to be restored
  // the compiler should build this up in the future
  Initials = {s: {v: 0, x: 200, y: 300, dy: -200, dx: 0},
              i: {x: 200, y: 100},
              p: {x1: 175, y1: 92, x2: 225, y2: 108},
              w: {x: 200, y: 77, h: 30, w: 30},
              m: {mn: 10, mx: 100, val: 55},
              k: {mn: 0.5, mx: 5, val: 2.75},
              c: {mn: 0, mx: 1, val: 0.5},
              g: {mn: 0, mx: 2, val: 0.98},
              msOff: 50, ssOff: 50, dsOff: 50,
            };


  // springs
  SX = makeVariable("SX", Initials.s.x);
  SY = makeVariable("SY", Initials.s.y);
  SDX = makeVariable("SDX", Initials.s.dx);
  SDY = makeVariable("SDY", Initials.s.dy);
  S = Spring(Initials.s.x, Initials.s.y, Initials.s.dx, Initials.s.dy, "black");
  IX = makeVariable("IX", Initials.i.x);
  IY = makeVariable("IY", Initials.i.y);
  WX = makeVariable("WX", Initials.w.x);
  WY = makeVariable("WY", Initials.w.y);
  WH = makeVariable("WH", Initials.w.h);
  WW = makeVariable("WW", Initials.w.w);
  W = Image(Initials.w.x, Initials.w.y, Initials.w.h, Initials.w.w, "iron");

  I = InteractionPoint(IX, IY);

  // (http://www.ux1.eiu.edu/~cfadd/1150/15Period/Vert.html)
  InitRL = 125;
  CurrRL = makeVariable("RL", 125);

  M = makeVariable("M", Initials.m.val);
  G = makeVariable("G", Initials.g.val);
  K = makeVariable("K", Initials.k.val);
  C = makeVariable("C", Initials.c.val);
  V = makeVariable("V", 0);

  // sliders
  // addSlider("Mass", "sliders", Initials.m.mn, Initials.m.mx, Initials.m.val, function(o) {
  //     CurrConstants.m = getSliderValue("Mass");
  // });
  // addSlider("Stiffness", "sliders", Initials.k.mn, Initials.k.mx, Initials.k.val, function(o) {
  //     CurrConstants.k = getSliderValue("Stiffness");
  // });
  // addSlider("Dampening", "sliders", Initials.c.mn, Initials.c.mx, Initials.c.val, function(o) {
  //     CurrConstants.c = getSliderValue("Dampening");
  // });
  // addSlider("Gravity", "sliders", Initials.g.mn, Initials.g.mx, Initials.g.val, function(o) {
  //     CurrConstants.g = getSliderValue("Gravity");
  // });

  // base, platform
  BX1 = makeVariable("BX1", S.x-100);
  BY1 = makeVariable("BY1", S.y);
  BX2 = makeVariable("BX2", S.x+100);
  BY2 = makeVariable("BY2", S.y + 100);
  Base = Rectangle(BX1.value, BY1.value, BX2.value, BY2.value, "black", "rgba(127,127,127,0.5)");

  PX1 = makeVariable("PX1", Initials.p.x1);
  PY1 = makeVariable("PY1", Initials.p.y1);
  PX2 = makeVariable("PX2", Initials.p.x2);
  PY2 = makeVariable("PY2", Initials.p.y2);
  Plat = Rectangle(PX1.value, PY1.value, PX2.value, PY2.value, "black", "rgba(0,0,0,0)");

  // Plot of t, displacement, velocity, and force
  var pltRanges = {t: {mn: 0, mx: 100}, y: {mn: -200, mx: 200}, v:{mn: -50, mx: 50}, f:{mn: -20, mx: 20}};
  // plot center is at x + w/2, y + w/2 = y+150
  // Center y on the spring: y + 150 = S1.y + S1.dy/2 => y = S1.y + S1.dy/2 - 150
  plt = Plot(Plat.x2 + 100, S.y + S.dy/2 - 150, 300, 300, "t", "y", pltRanges, "red", 500);

  // trace the current value with a green dot
  Tracer = Circle(plt.xStart, plt.yStart, 3, "green", "green");

  I.links = ["SDY", "IY", "WY", "PY1", "PY2"]; // ipoint compresses spring in x-axis


  // equations:
  // spring in middle of base
  // platform on top of spring
  // weight on top of platform
  init_stays();


  //var fromVar = c.Expression.fromConstant;
  addEquation(SX, fromVar(BX1).plus(BX2).divide(fromConst(2)));
  addEquation(SY, BY1);
  addEquation(IX, SX);
  addEquation(IY, fromVar(SY).plus(SDY));
  var sXPadding = fromConst(25);
  var sYPadding = fromConst(8);
  addEquation(PX1, fromVar(IX).minus(sXPadding));
  addEquation(PY1, fromVar(IY).minus(sYPadding));
  addEquation(PX2, fromVar(IX).plus(sXPadding));
  addEquation(PY2, fromVar(IY).plus(sYPadding));

  addEquation(WX, IX);
  addEquation(WY, fromVar(PY1).minus(fromVar(WW).divide(fromConst(2))));


  push(all_objects, S, W, I, Base, Plat, plt, Tracer);
  inc_objects.push(plt);
  push(drag_points, I);

  // initialize timer

  tau = Timer(1, function(t) {
    update_constraints();
    global_redraw();
  }, function() {

    // velocities
    //restore(CurrentVs, {s1: Initials.s1.v});
    plt.reset();
    T = 0;

    // setSliderValue("Mass", Initials.m.val);
    // setSliderValue("Stiffness", Initials.k.val);
    // setSliderValue("Dampening", Initials.c.val);
    // setSliderValue("Gravity", Initials.g.val);


    Tracer.x = plt.xStart;
    Tracer.y = plt.yStart;
    global_redraw();
  });
}

function drag_update() {
  // I2.x = S1.x + S1.dx;
  // S1.dy = (I2.y - S1.y);
  //
  // Plat1.y1 = I2.y - 8;
  // Plat1.y2 = I2.y + 8;
  //
  // W1.y = Plat1.y1 - W1.h/2;
}

function update_constraints() {

  S.x = SX.value;
  S.y = SY.value;
  S.dx = SDX.value;
  S.dy = SDY.value;

  W.x = WX.value;
  W.y = WY.value;
  W.w = WW.value;
  W.h = WH.value;

  Plat.x1 = PX1.value;
  Plat.y1 = PY1.value;
  Plat.x2 = PX2.value;
  Plat.y2 = PY2.value;

  Base.x1 = BX1.value;
  Base.y1 = BY1.value;
  Base.x2 = BX2.value;
  Base.y2 = BY2.value;

  // var mass = CurrConstants.m;
  // var g = CurrConstants.g;
  // var k = CurrConstants.k;
  // var c = CurrConstants.c;
  //
  // CurrRestLengths.s1 = InitRestLengths.s1 - mass * g / k;
  //
  // T += 0.1;
  // T = T % 100;
  // // F = kx - cv = ma => dv = (kx-cv)/m
  // var F = (-k*(S1.dy + CurrRestLengths.s1) - c*CurrentVs.s1)/mass;
  //
  // // dx/dt = v => dx = v
  // if (dragged_obj !== I2) {
  //   CurrentVs.s1 = CurrentVs.s1 + F;
  //   S1.dy = S1.dy + CurrentVs.s1;
  //
  //   I2.y = S1.y + S1.dy;
  //   I2.x = S1.x + S1.dx;
  // } else {
  //   S1.dy = I2.y - S1.y;
  //   I2.x = S1.x + S1.dx;
  // }
  //
  // Plat1.y1 = I2.y - 8;
  // Plat1.y2 = I2.y + 8;
  //
  // W1.y = Plat1.y1 - W1.h/2;


  // plt.record({t: T, y: -(CurrRestLengths.s1 + S1.dy), v: -CurrentVs.s1, f: -F});
  // Tracer.x = plt.xStart;
  // Tracer.y = plt.yStart;

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

function on_release() {
}

function on_click() {
}
