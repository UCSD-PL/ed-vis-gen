function init() {
  all_objects = [];
  inc_objects = [];
  drag_points = [];
  rightClick_points = [];

  // initial positions for everything that needs to be restored
  // the compiler should build this up in the future
  Initials = {anchor: {x: 150, y: 150, r: 5}, // pivot
              l: {mn: 5, mx: 200, v:100},  // lever arm
              theta: {mn: -Math.PI, mx:Math.PI, v: -Math.PI/3}, // angular displacement
              omega: {mn: -0.02, mx: 0.02, v:0}, // angular velocity
              g: {mn: 0, mx: 0.098, v:0.0098}, // Gravity
            };

  Current = {g: Initials.g.v, l: Initials.l.v, theta: Initials.theta.v, omega: Initials.omega.v};

  var theta = Initials.theta.v;
  Anc = Circle(Initials.anchor.x, Initials.anchor.y, Initials.anchor.r, "black", "black");
  Lever = Line([Initials.anchor.x, Initials.anchor.y,
               Initials.anchor.x + Initials.l.v * Math.sin(theta),
               Initials.anchor.y + Initials.l.v * Math.cos(theta)], "black" );
  Weight = Circle(Anc.x + Initials.l.v * Math.sin(theta), Anc.y + Initials.l.v * Math.cos(theta),
                  20, "black", "black");
  I1 = InteractionPoint(Weight.x, Weight.y);
  I1.links.push(Weight);

  T = 0;

  var pltRanges = {t: {mn:0, mx: 100}, theta: {mn: -Math.PI, mx: Math.PI},
                   omega: {mn: -0.02, mx: 0.02}, x: {mn: -Initials.l.mx, mx: Initials.l.mx},
                   y: {mn: -Initials.l.mx, mx: Initials.l.mx}};
  plt = Plot(Anc.x + Current.l + 50, 50, 300, 300, "t", "y", pltRanges, "red", 900);

  addSlider("Gravity", "sliders", Initials.g.mn, Initials.g.mx, Initials.g.v,
            function(cng) { Current.g = getSliderValue("Gravity"); });
  addSlider("Arm length", "sliders", Initials.l.mn, Initials.l.mx, Initials.l.v,
            function(cng) {
              // philosophically, we should just call update_constraints...
              Current.l = getSliderValue("Arm length");
              Anc.x = Current.l + 50;
              Anc.y = Current.l + 50;
              var w = {x: Anc.x + Current.l * Math.sin(Current.theta),
                       y: Anc.y + Current.l * Math.cos(Current.theta)};
              restoreAll([Weight, w, I1, w]);
              plt.x = Anc.x + Current.l + 50;

              I2.x = Anc.x;
              I2.y = Anc.y

              YTrace.points = [Weight.x, Weight.y, plt.xStart, plt.yStart];
            });



  YTrace = Line([], "blue", true);

  I2 = InteractionPoint(Anc.x, Anc.y); // translation point for whole system
  push(I2.links, Anc, Lever, Weight, I1);


  push(all_objects, Anc, Lever, Weight, plt, YTrace);
  push(all_objects, I1, I2);
  push(drag_points, I1, I2);
  inc_objects.push(plt);

  // initialize timer

  tau = Timer(5, function(t) {
    update_constraints();
    global_redraw();
  }, function() {
    restoreAll([
      Anc, Initials.anchor,
      I2, Initials.anchor
    ]
    );
    Lever.points = [Initials.anchor.x, Initials.anchor.y,
                 Initials.anchor.x + Initials.l.v * Math.sin(Initials.theta.v),
                 Initials.anchor.y + Initials.l.v * Math.cos(Initials.theta.v)];

    plt.x = Anc.x + Current.l + 50;
    plt.y = Anc.y;
    plt.reset();
    YTrace.points = [];

    T = 0;

    for (var e in Current) {
      Current[e] = Initials[e].v;
    }

    var w = {x: Anc.x + Current.l * Math.sin(Current.theta),
             y: Anc.y + Current.l * Math.cos(Current.theta)};
    restoreAll([Weight, w,
                I1, w]);

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



  YTrace.points = []; //[Weight.x, Weight.y, plt.xStart, plt.yStart];

}

function rightClick_update () {

}

function update_constraints() {
  // from wiki, angular acceleration = -g * sin theta / l
  // => dOmega = -g * sin theta / l
  var g = Current.g;
  var k = Current.k;
  var l = Current.l;

  Current.omega = Current.omega - g * Math.sin(Current.theta) / l;
  // dTheta = Omega
  Current.theta = Current.theta + Current.omega;

  Current.theta = Current.theta % (2*Math.PI);
  T += 0.1;
  T = T % 100;

  // arc length formulae
  Weight.x = Anc.x + l*Math.sin(Current.theta);
  Weight.y = Anc.y + l*Math.cos(Current.theta);
  Lever.points = [Anc.x, Anc.y, Weight.x, Weight.y];
  I1.x = Weight.x;
  I1.y = Weight.y;

  var reading = { t: T, theta: Current.theta, omega: Current.omega,
                  x: Weight.x - Anc.x, y: Weight.y - Anc.y};


  plt.record(reading);

  YTrace.points = [Weight.x, Weight.y, plt.xStart, plt.yStart];

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
