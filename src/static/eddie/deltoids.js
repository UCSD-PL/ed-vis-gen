function init() {
  all_objects = [];
  drag_points = [];
  inc_objects = [];

  T = 0;

  // initial positions for everything that needs to be restored
  // the compiler should build this up in the future
  Initials = {big: {x: 300, y: 300, r:180, dx: 0},
              small: {x: 420, y: 300, r:60},
              outer: {x: 480, y: 300},
              inner: {x: 360, y: 300},
              heightp: {x: 300, y: 120},
              constants: {theta: 0,
                          omega: Math.PI,
                        },
            };




  BigCirc = Circle(Initials.big.x, Initials.big.y, Initials.big.r, "rgba(255,255,255,1)", "black");
  SmallCirc = Circle(Initials.small.x, Initials.small.y, Initials.small.r, "rgba(255,255,255,1)", "black");
  TangentPoint = InteractionPoint(Initials.outer.x, Initials.outer.y);
  InnerPoint = Circle(Initials.inner.x, Initials.inner.y, 5, "green", "red");

  HeightPoint = InteractionPoint(Initials.heightp.x, Initials.heightp.y);

  Constants = copy(Initials.constants);
  var pltRanges = {t: {mn: 0, mx: 100}, x: {mn: -BigCirc.r, mx: BigCirc.r}, y:{mn: -BigCirc.r, mx: BigCirc.r}};
  // plot center is at x + w/2, y + w/2
  plt = Plot(BigCirc.x - BigCirc.r, BigCirc.y - BigCirc.r, 2*BigCirc.r, 2*BigCirc.r, "x", "y", pltRanges, "red", 500, true);



  push(all_objects, BigCirc, SmallCirc, TangentPoint, InnerPoint, HeightPoint,
       plt);
  inc_objects.push(plt);
  push(drag_points, TangentPoint, HeightPoint);

  // initialize timer

  tau = Timer(1, function(t) {
    update_constraints();
    global_redraw();
  }, function() {
    restoreAll([
      BigCirc, Initials.big,
      SmallCirc, Initials.small,
      TangentPoint, Initials.outer,
      InnerPoint, Initials.inner,
      Constants, Initials.constants,
    ]
    );

    plt.reset();
    T = 0;
    global_redraw();
  });
}

function drag_update() {
  BigCirc.r = BigCirc.y - HeightPoint.y;
  HeightPoint.x = BigCirc.x;
  plt.moveTo(BigCirc.x - BigCirc.r, BigCirc.y - BigCirc.r);
  plt.resize(2*BigCirc.r, 2*BigCirc.r);

  // recenter about new point
  var dx = TangentPoint.x - BigCirc.x;
  var dy = BigCirc.y - TangentPoint.y;
  SmallCirc.r = BigCirc.r/3;
  Constants.theta = -Math.atan2(dy, dx);
  fixed_constraints();
}

function update_constraints() {
  // recursive constraints
  recursive_constraints();
  fixed_constraints();

}
function recursive_constraints() {
  T = T + 0.01;
  Constants.theta = (Constants.theta - 0.005) % (2 * Math.PI);
}
function fixed_constraints() {
  Constants.omega = (-2 * Constants.theta + Math.PI) % (2 * Math.PI);

  TangentPoint.x = BigCirc.x + BigCirc.r * Math.cos(Constants.theta);
  TangentPoint.y = BigCirc.y + BigCirc.r * Math.sin(Constants.theta);
  SmallCirc.x = BigCirc.x + BigCirc.r*2/3 * Math.cos(Constants.theta);
  SmallCirc.y = BigCirc.y + BigCirc.r*2/3 * Math.sin(Constants.theta);

  InnerPoint.x = SmallCirc.x + SmallCirc.r * Math.cos(Constants.omega);
  InnerPoint.y = SmallCirc.y + SmallCirc.r * Math.sin(Constants.omega);

  plt.record({t: T, x: InnerPoint.x - BigCirc.x, y: BigCirc.y - InnerPoint.y});

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
