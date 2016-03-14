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

  LCircle = Circle(P1.x.value, P1.y.value, Initials.lhs.r, CLEAR_COLOR, "black");
  RCircle = Circle(P2.x.value, P2.y.value, Initials.rhs.r, CLEAR_COLOR, "black");

  // x0, y0, x1, y1
  var interPoints = intersection(P1.x.value, P1.y.value, LCircle.r, P2.x.value, P2.y.value, RCircle.r);
  LP = Circle(interPoints[0], interPoints[1], 5, "red", "red");
  RP = Circle(interPoints[2], interPoints[3], 5, "red", "red");
  Bisector = Line(interPoints, "red");

  R1 = InteractionPoint(LCircle.x - LCircle.r, LCircle.y);
  R2 = InteractionPoint(RCircle.x + RCircle.r, RCircle.y);

  C1R = makeVariable("C1R", LCircle.r);
  C2R = makeVariable("C2R", RCircle.r);

  // map cvar name -> var
  var newVars = { P1X: P1.x, P1Y: P1.y, R1X: R1.x, R1Y: R1.y,
                       P2X: P2.x, P2Y: P2.y, R2X: R2.x, R2Y: R2.y};
  for (var cv in newVars) {
    linear_vars[cv] = newVars[cv];
    linear_inits[cv] = newVars[cv].value;
  }


  init_stays();

  // add drag transitive dependencies to ipoints
  R1.links = ["C1R", "R1X", "C2R", "R2X"];
  P1.links = ["R1X", "P1X", "P1Y", "R1Y"];
  R2.links = ["C2R", "R2X", "C1R", "R1X"];
  P2.links = ["R2X", "P2X", "P2Y", "R2Y"];

  var c1e = fromConst(C1R);
  addEquation(P1.x, c1e.plus(R1.x));
  addEquation(P2.x, fromConst(R2.x).minus(C2R));
  addEquation(R1.y, P1.y);
  addEquation(R2.y, P2.y);
  addEquation(C1R, C2R);

  // window bound constraints
  var padding = 5;
  addGEQ(P1.x, c1e.plus(fromConst(padding)));
  addGEQ(P1.y, c1e.plus(fromConst(padding)));
  addLEQ(P1.x, fromConst(global_ctx.canvas.width-padding).minus(C1R));
  addLEQ(P1.y, fromConst(global_ctx.canvas.height-padding).minus(C1R));

  addGEQ(P2.x, fromConst(C2R).plus(fromConst(padding)));
  addGEQ(P2.y, fromConst(C2R).plus(fromConst(padding)));
  addLEQ(P2.x, fromConst(global_ctx.canvas.width-padding).minus(C2R));
  addLEQ(P2.y, fromConst(global_ctx.canvas.height-padding).minus(C2R));

  push(all_objects, P1, P2, Subject, LCircle, RCircle, R1, R2, LP, RP, Bisector);
  push(drag_points, P1, P2, R1, R2);

  // initialize timer

  tau = Timer(100, function(t) {
    update_constraints();
    global_redraw();
  }, function() {

    resetCVs();
    update_constraints();
    global_redraw();
  });

  update_constraints();
}

function on_release() {
}

function on_click() {
}

function drag_update() {
  update_constraints();
}

function update_constraints() {
  LCircle.x = P1.x.value;
  LCircle.y = P1.y.value;
  LCircle.r = C1R.value;

  RCircle.x = P2.x.value;
  RCircle.y = P2.y.value;
  RCircle.r = C2R.value;

  Subject.points = [P1.x.value, P1.y.value, P2.x.value, P2.y.value];

  var interPoints = intersection(P1.x.value, P1.y.value, LCircle.r, P2.x.value, P2.y.value, RCircle.r);
  if (interPoints) {
    // intersection exists
    LP.x = interPoints[0];
    LP.y = interPoints[1];
    LP.r = 5;
    RP.x = interPoints[2];
    RP.y = interPoints[3];
    RP.r = 5;
    Bisector.points = interPoints;
  } else {
    LP.r = 0;
    RP.r = 0;
    Bisector.points = [];
  }


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
