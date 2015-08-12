function init() {
  all_objects = [];
  drag_points = [];
  inc_objects = [];

  // initial positions for everything that needs to be restored
  // the compiler should build this up in the future
  Initials = {p1: {x: 100, y: 100},
              p2: {x: 100, y: 200},
              lhs: {x: 100, y: 100, r: 70},
              rhs: {x: 100, y: 200, r: 70},
            };



  P1 = InteractionPoint(Initials.p1.x, Initials.p1.y);
  P2 = InteractionPoint(Initials.p2.x, Initials.p2.y);

  Subject = Line([Initials.p1.x, Initials.p1.y, Initials.p2.x, Initials.p2.y], "black");

  LCircle = Circle(P1.x, P1.y, Initials.lhs.r, CLEAR_COLOR, "black");
  RCircle = Circle(P2.x, P2.y, Initials.rhs.r, CLEAR_COLOR, "black");

  R1 = InteractionPoint(LCircle.x - LCircle.r, LCircle.y);
  R2 = InteractionPoint(RCircle.x + RCircle.r, RCircle.y);


  push(all_objects, P1, P2, Subject, LCircle, RCircle, R1, R2);
  push(drag_points, P1, P2, R1, R2);

  P1.links.push(LCircle, R1);
  P2.links.push(RCircle, R2);

  eps = 2;

  // initialize timer

  tau = Timer(1, function(t) {
    update_constraints();
    global_redraw();
  }, function() {
    restoreAll([
      P1, Initials.p1,
      P2, Initials.p2,
    ]
    );

    drag_update();

  });
}

function drag_update() {


  var dy = P2.y - P1.y;
  var dx = P2.x - P1.x;
  var newDist = sqrtSquaredSum([dy, dx]);
  // corresponds to constraints with >=, e.g.
  // LCircle.r >= newDist + eps

  Subject.points = [P1.x, P1.y, P2.x, P2.y];

  LCircle.r = LCircle.x - R1.x; // update radius
  R1.y = LCircle.y; // constrain point
  RCircle.r = R2.x - RCircle.x;
  R2.y = RCircle.y;

  LCircle.r = RCircle.r;
  RCircle.r = LCircle.r;

  if ( newDist/2 >= LCircle.r) {
    LCircle.r = newDist/2 + eps;
    R1.x = LCircle.x - LCircle.r;
    RCircle.r = newDist/2 + eps;
    R2.x = RCircle.x + RCircle.r;
  }

  fixed_constraints();
}

function update_constraints() {
  // recursive constraints
  recursive_constraints();
  fixed_constraints();

}
function recursive_constraints() {
}
function fixed_constraints() {

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
