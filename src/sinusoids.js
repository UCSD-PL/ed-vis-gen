function init() {
  all_objects = [];
  drag_points = [];
  rightClick_points = [];

  // initial positions for everything that needs to be restored
  // the compiler should build this up in the future
  Initials = {circ: {x: 200, y: 200, r: 100},
              theta: 0, // angular displacement
              tr: {x: 300, y: 200, r: 5} // tracer
            };

  Current = {theta: Initials.theta, tr: copy(Initials.tr)};

  Crc = Circle(Initials.circ.x, Initials.circ.y, Initials.circ.r, "white", "black");
  Trc = Circle(Initials.tr.x, Initials.tr.y, Initials.tr.r, "black", "black");
  //I1 = InteractionPoint(Trc.x, Trc.y);

  //TCos = Trace(Crc.x + Crc.r + 50, Crc.y, 600, 600, "red", 1000, false);
  var ranges =  {x:{mn: 0, mx:2*Math.PI}, y:{mn:-Crc.r, mx:Crc.r}};
  TCos = Plot(Crc.x + Crc.r + 50, Crc.y - Crc.r, 300, 300, "x", "y", ranges, "red", 1000);
  TSin = Trace(Crc.x + Crc.r + 50, Crc.y, 600, 600, "blue", 1000, false);

  XAxis = Line([Crc.x - Crc.r, Crc.y, Crc.x + Crc.r, Crc.y], "red", false);
  YAxis = Line([Crc.x, Crc.y - Crc.r, Crc.x, Crc.y + Crc.r], "blue", false);

  T2X = Line([Trc.x, Trc.y, Trc.x, Crc.y], "red", true);
  T2Y = Line([Trc.x, Trc.y, Crc.x, Trc.y], "blue", true);
  CosTrc = Line([], "red", true);
  SinTrc = Line([], "blue", true);

  push(all_objects, Crc, Trc, TCos, TSin, XAxis, YAxis);
  push(all_objects, T2X, T2Y, CosTrc, SinTrc);
  //push(all_objects, I1);
  //push(drag_points, I1);

  // initialize timer

  tau = Timer(10, function(t) {
    update_constraints();
    global_redraw();
  }, function() {
    restoreAll([
      Current, Initials,
      Crc, Initials.circ,
      Trc, Initials.tr,
    ]
    );

    T2X.points = [Trc.x, Trc.y, Trc.x, Crc.y];
    T2Y.points = [Trc.x, Trc.y, Crc.x, Trc.y];

    TCos.vals = [];
    TSin.vals = [];
    CosTrc.points = [];
    SinTrc.points = [];

    global_redraw();
  });
}

function drag_update() {

}

function rightClick_update () {

}

function update_constraints() {
  Current.theta += 0.01;
  Current.theta = Current.theta % (2*Math.PI);

  // arc length formulae
  Trc.x = Crc.x + Crc.r*Math.cos(Current.theta);
  Trc.y = Crc.x - Crc.r*Math.sin(Current.theta);

  TSin.record(-Crc.r*Math.sin(Current.theta));

  var pushToCos = {x:Current.theta, y:(-Crc.r*Math.cos(Current.theta))};
  //TCos.record(-Crc.r*Math.cos(Current.theta));
  TCos.record(pushToCos);

  T2X.points = [Trc.x, Trc.y, Trc.x, Crc.y];
  T2Y.points = [Trc.x, Trc.y, Crc.x, Trc.y];
  CosTrc.points = [Trc.x, Crc.y, TCos.xStart, TCos.yStart];
  SinTrc.points = [Crc.x, Trc.y, TSin.xStart, TSin.yStart];

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
