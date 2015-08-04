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
              w: {x: 163.3974596216, y: 300, r: 15 } // weight

            };

  Current = {l: Initials.l, theta: Initials.theta, omega: Initials.omega};

  Anc = Circle(Initials.anchor.x, Initials.anchor.y, Initials.anchor.r, "black", "black");
  Lever = Line([Initials.anchor.x, Initials.anchor.y,
               Initials.anchor.x + Initials.l * Math.sin(Initials.theta),
               Initials.anchor.y + Initials.l * Math.cos(Initials.theta)], "black" );
  Weight = Circle(Initials.w.x, Initials.w.y, Initials.w.r, "black", "black");
  I1 = InteractionPoint(Weight.x, Weight.y);
  I1.links.push(Weight);


  TX = Plot(Anc.x, Anc.y + Current.l + 50, 600, 600, "red", 1000, true);
  TY = Plot(Anc.x + Current.l + 50, Anc.y, 600, 600, "blue", 1000, false);
  G = .0098;
  GravSlider = Slider(400, 400, 100, 49, "0", "2", ".98", "Gravity");


  XTrace = Line([], "red", true);
  YTrace = Line([], "blue", true);

  I2 = InteractionPoint(Anc.x, Anc.y); // translation point for whole system
  push(I2.links, Anc, Lever, Weight, I1, TX, TY, XTrace, YTrace);

  push(all_objects, Anc, Lever, Weight, TX, TY, XTrace, YTrace, GravSlider);
  push(all_objects, I1, I2);
  push(drag_points, I1, I2);

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

    TX.x = Anc.x;
    TX.y = Anc.y + Current.l + 50;
    TY.x = Anc.x + Current.l + 50;
    TY.y = Anc.y;
    TX.vals = [];
    TY.vals = [];
    XTrace.points = [];
    YTrace.points = [];

    global_redraw();
  });
}

function drag_update() {
  Lever.points = [Anc.x, Anc.y, Weight.x, Weight.y];
  var dy = Anc.y - Weight.y;
  var dx = Anc.x - Weight.x;
  var alpha = Math.atan2(dy, dx);
  Current.theta = 3*Math.PI/2 - alpha;
  Current.l = Math.sqrt(dy*dy + dx*dx);
  Current.omega = 0;

  TX.y = Anc.y + Current.l + 50;
  TY.x = Anc.x + Current.l + 50;

  //TX.record(Weight.x - Anc.x);
  //TY.record(Weight.y - Anc.y);

  XTrace.points = [Weight.x, Weight.y, TX.xStart, TX.yStart];
  YTrace.points = [Weight.x, Weight.y, TY.xStart, TY.yStart];

}

function rightClick_update () {

}

function update_constraints() {
  // from wiki, angular acceleration = -g * sin theta / l
  // => dOmega = -g * sin theta / l
  Current.omega = Current.omega - G * Math.sin(Current.theta) / Current.l;
  // dTheta = Omega
  Current.theta = Current.theta + Current.omega;

  // arc length formulae
  Weight.x = Anc.x + Current.l*Math.sin(Current.theta);
  Weight.y = Anc.y + Current.l*Math.cos(Current.theta);
  Lever.points = [Anc.x, Anc.y, Weight.x, Weight.y];
  I1.x = Weight.x;
  I1.y = Weight.y;

  TX.y = Anc.y + Current.l + 50;
  TY.x = Anc.x + Current.l + 50;
  TX.record(Weight.x - Anc.x);
  TY.record(Weight.y - Anc.y);

  XTrace.points = [Weight.x, Weight.y, TX.xStart, TX.yStart];
  YTrace.points = [Weight.x, Weight.y, TY.xStart, TY.yStart];

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
