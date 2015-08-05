function init() {
  all_objects = [];
  drag_points = [];
  rightClick_points = [];

  // initial positions for everything that needs to be restored
  // the compiler should build this up in the future
  Initials = {anchor: {x: 250, y: 250, r: 5}, // pivot
              l: 100,  // lever arm
              theta: -Math.PI/3, // angular displacement
              omega: 0, // angular velocity
              w: {x: 163.3974596216, y: 300, r: 15 }, // weight
              g: {mn: 0, mx: 0.098, v:0.0098}, // Gravity
              gOff: 10 // gravity slider offset
            };

  Current = {l: Initials.l, theta: Initials.theta, omega: Initials.omega};

  Anc = Circle(Initials.anchor.x, Initials.anchor.y, Initials.anchor.r, "black", "black");
  Lever = Line([Initials.anchor.x, Initials.anchor.y,
               Initials.anchor.x + Initials.l * Math.sin(Initials.theta),
               Initials.anchor.y + Initials.l * Math.cos(Initials.theta)], "black" );
  Weight = Circle(Initials.w.x, Initials.w.y, Initials.w.r, "black", "black");
  I1 = InteractionPoint(Weight.x, Weight.y);
  I1.links.push(Weight);

  T = 0;


  var pltRanges = {t: {mn:0, mx: 100}, theta: {mn: -Math.PI, mx: Math.PI},
                   omega: {mn: -0.02, mx: 0.02}, x: {mn: -Initials.l, mx: Initials.l},
                   y: {mn: -Initials.l, mx: Initials.l}};
  plt = Plot(Anc.x + Current.l + 50, Anc.y, 300, 300, "t", "y", pltRanges, "red", 1050);
  G = Initials.g.v;
  var GravPos = Initials.gOff;
  GravSlider = Slider(400, 400, 100, Initials.gOff,
                      Initials.g.mn, Initials.g.mx, Initials.g.v, "Gravity");


  YTrace = Line([], "blue", true);

  I2 = InteractionPoint(Anc.x, Anc.y); // translation point for whole system
  //push(I2.links, Anc, Lever, Weight, I1, plt, YTrace);

  I3 = InteractionPoint(400 + GravPos, 400)

  push(all_objects, Anc, Lever, Weight, plt, YTrace);
  push(all_objects, I1, I2, I3);
  push(drag_points, I1, I2, I3);

  // initialize timer

  tau = Timer(10, function(t) {
    update_constraints();
    global_redraw();
  }, function() {
    restoreAll([
      Weight, Initials.w,
      I1, Initials.w,
      Current, Initials,
      Anc, Initials.anchor,
      I2, Initials.anchor
    ]
    );
    Lever.points = [Initials.anchor.x, Initials.anchor.y,
                 Initials.anchor.x + Initials.l * Math.sin(Initials.theta),
                 Initials.anchor.y + Initials.l * Math.cos(Initials.theta)];

    plt.x = Anc.x + Current.l + 50;
    plt.y = Anc.y;
    plt.vals = [];
    YTrace.points = [];

    T = 0;

    G = Initials.g.v;
    GravSlider.offset = Initials.gOff;
    I3.x = GravSlider.x + GravSlider.offset;
    GravSlider.currVal = G;

    global_redraw();
  });
}

function drag_update() {
  Lever.points = [Anc.x, Anc.y, Weight.x, Weight.y];
  var dy = Anc.y - Weight.y;
  var dx = Anc.x - Weight.x;
  var alpha = Math.atan2(dy, dx);
  Current.theta = (3*Math.PI/2 - alpha ) % (2 * Math.PI);
  if (dx > 0) { // third quadrant...
    Current.theta -= (2*Math.PI);
  }
  Current.l = Math.sqrt(dy*dy + dx*dx);
  Current.omega = 0;

  plt.x = Anc.x + Current.l + 50;

  YTrace.points = [Weight.x, Weight.y, plt.xStart, plt.yStart];


  if (I3.x > GravSlider.x + GravSlider.w) {
    I3.x = GravSlider.x + GravSlider.w;
  }

  if (I3.x < GravSlider.x) {
    I3.x = GravSlider.x;
  }
  GravSlider.offset = I3.x - GravSlider.x;
  GravSlider.currVal = (GravSlider.minVal + (GravSlider.maxVal-GravSlider.minVal) * GravSlider.offset / GravSlider.w);


}

function rightClick_update () {

}

function update_constraints() {
  // from wiki, angular acceleration = -g * sin theta / l
  // => dOmega = -g * sin theta / l
  Current.omega = Current.omega - G * Math.sin(Current.theta) / Current.l;
  // dTheta = Omega
  Current.theta = Current.theta + Current.omega;

  Current.theta = Current.theta % (2*Math.PI);
  T += 0.1;
  T = T % 100;

  // arc length formulae
  Weight.x = Anc.x + Current.l*Math.sin(Current.theta);
  Weight.y = Anc.y + Current.l*Math.cos(Current.theta);
  Lever.points = [Anc.x, Anc.y, Weight.x, Weight.y];
  I1.x = Weight.x;
  I1.y = Weight.y;

  plt.x = Anc.x + Current.l + 50;

  var reading = { t: T, theta: Current.theta, omega: Current.omega,
                  x: Weight.x - Anc.x, y: Weight.y - Anc.y};

  console.log(Current.omega);
  plt.record(reading);

  YTrace.points = [Weight.x, Weight.y, plt.xStart, plt.yStart];

  I3.y = GravSlider.y;
  if (I3.x > GravSlider.x + GravSlider.w) {
    I3.x = GravSlider.x + GravSlider.w;
  }

  if (I3.x < GravSlider.x) {
    I3.x = GravSlider.x;
  }

  G = (GravSlider.minVal + (GravSlider.maxVal-GravSlider.minVal) * GravSlider.offset / GravSlider.w);
  GravSlider.currVal = G;


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
