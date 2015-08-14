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


  R1X = new c.Variable({name: "R1.x", value: R1.x});
  R1Y = new c.Variable({name: "R1.y", value: R1.y});
  P1X = new c.Variable({name: "P1.x", value: P1.x});
  P1Y = new c.Variable({name: "P1.y", value: P1.y});
  C1R = new c.Variable({name: "C1.r", value: LCircle.r});

  R2X = new c.Variable({name: "R2.x", value: R2.x});
  R2Y = new c.Variable({name: "R2.y", value: R2.y});
  P2X = new c.Variable({name: "P2.x", value: P2.x});
  P2Y = new c.Variable({name: "P2.y", value: P2.y});
  C2R = new c.Variable({name: "C2.r", value: RCircle.r});

  CVars = {P1X: P1X, P1Y: P1Y, R1X: R1X, R1Y: R1Y, C1R: C1R};
  StayEqs = {P1X: P1X, P1Y: P1Y, R1X: R1X, R1Y: R1Y, C1R: C1R}

  constrainedPoints = {R1: {  ipoint: R1,
                              vs: {x: R1X,
                                   y: R1Y},
                              stayVars: ["C1R", "R1X"]

                           },
                       P1: {  ipoint: P1,
                              vs: {x: P1X,
                                   y: P1Y},
                              stayVars: ["R1X", "P1X", "P1Y", "R1Y"]
                            },
                       R2: {  ipoint: R2,
                              vs: {x: R2X,
                                   y: R2Y}
                           },
                       P2: {  ipoint: P2,
                              vs: {x: P2X,
                                   y: P2Y}
                            },
                      };


  var radConstraint = c.Expression
    .fromVariable(C1R).plus(c.Expression.fromVariable(R1X));

  var e1 = new c.Equation(P1X, radConstraint);
  var e2 = new c.Equation(R1Y, c.Expression.fromVariable(P1Y));
  solver.addConstraint(e1);
  solver.addConstraint(e2);

  // window bound constraints
  addWindowConstraints(solver, global_ctx.canvas, [R1X, P1X], [R1Y, P1Y]);

  //solver.addPointStays([{x: R1X, y: R1Y}, {x: P1X, y: P1Y}]);
  // p1 < r1 < rad => translation on r1, stretch + translation on p1
  // p1 < rad < r1 => translation on r1, stretch on p1
  // r1 < rad < p1 => stretch + translation when moving right,
  //                  stretch r1 on left, translation p1 on left
  // rad < r1 < p1 => right-translation r1, left stretch r1, stretch p1
  // rad < p1 < r1 => ^^
  // r1 < p1 < rad => translation r1, left-translate p1, right-stretch p1


  // solver.addStay(P1X);
  // solver.addStay(P1Y);
  // solver.addConstraint(constrainedPoints.R1.stays[0]); // C1R
  // console.log(constrainedPoints.R1.stays[0].toString());
  // solver.addConstraint(constrainedPoints.P1.stays[0]); // R1X
  // solver.addStay(R1Y);



  //console.log(solver.toString());



  push(all_objects, P1, P2, Subject, LCircle, RCircle, R1, R2);
  push(drag_points, P1, P2, R1, R2);

  //P1.links.push(LCircle);
  P2.links.push(RCircle);

  eps = 2;

  // initialize timer

  tau = Timer(100, function(t) {
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

function on_release() {


  for (var cVar in constrainedPoints) {
    var rec = constrainedPoints[cVar];
    var ip = rec.ipoint;
    if (dragged_obj === ip) {
      solver.endEdit();
      //solver.solve();
      break;
    }
  }

  for (var cVar in StayEqs) {
    solver.removeConstraint(StayEqs[cVar]);
  }
  StayEqs = {};
}

function on_click() {

  for (var cVar in CVars) {
    StayEqs[cVar] = makeStay(CVars[cVar]);
  }

  for (var cVar in constrainedPoints) {
    var rec = constrainedPoints[cVar];
    var ip = rec.ipoint;
    if (dragged_obj === ip) {
      rec.stayVars.forEach(function(cvar) {
        delete StayEqs[cvar];
      });
      startEdit(solver, rec.vs);
      break;
    }
  }

  console.log("adding stays:");
  for (var cVar in StayEqs) {
    solver.addConstraint(StayEqs[cVar]);
    console.log(StayEqs[cVar].toString());
  }

}

function drag_update() {

  // @OPT: be smart about edits in common
  for (var cVar in constrainedPoints) {
    var ip = constrainedPoints[cVar].ipoint;
    if (dragged_obj === ip) {
      var cvs = constrainedPoints[cVar].vs;
      forceUpdate(solver, cvs, ip.x, ip.y);
      //console.log(solver.toString());
      //solver.endEdit();
      solver.resolve();
      //startEdit(solver, constrainedPoints[cVar].vs);
      // console.log("values:");
      // console.log("" + ip.x + " =? " + cvs.x.value);
      // console.log("" + ip.y + " =? " + cvs.y.value);
      break;
    }
  }

  for (var cVar in CVars) {
    if (cVar in StayEqs) {
      console.log("clearing stay:");
      solver.removeConstraint(StayEqs[cVar]);
      console.log(StayEqs[cVar].toString());
      StayEqs[cVar] = makeStay(CVars[cVar]);
      solver.addConstraint(StayEqs[cVar]);
      console.log("adding stay: " + StayEqs[cVar].toString());

    }
  }



  //
  // var dy = P2.y - P1.y;
  // var dx = P2.x - P1.x;
  // var newDist = sqrtSquaredSum([dy, dx]);
  // // corresponds to constraints with >=, e.g.
  // // LCircle.r >= newDist + eps
  //
  // Subject.points = [P1.x, P1.y, P2.x, P2.y];
  //
  // LCircle.r = LCircle.x - R1.x; // update radius
  // RCircle.r = R2.x - RCircle.x;
  //
  // LCircle.r = RCircle.r;
  // RCircle.r = LCircle.r;
  //
  // if ( newDist/2 >= LCircle.r) {
  //   LCircle.r = newDist/2 + eps;
  //   RCircle.r = newDist/2 + eps;
  // }

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

  P1.x = P1X.value;
  P1.y = P1Y.value;
  R1.x = R1X.value;
  R1.y = R1Y.value;
  LCircle.x = P1.x;
  LCircle.y = P1.y;
  LCircle.r = C1R.value;

  // P2.x = P2X.value;
  // P2.y = P2Y.value;
  // R2.x = R2X.value;
  // P1.x = P1X.value;
  // P1.y = P1Y.value;
  // R1.x = R1X.value;
  // R1.y = R1Y.value;
  // LCircle.x = P1.x;
  // LCircle.y = P1.y;
  // LCircle.r = C1R.value;

  Subject.points = [P1.x, P1.y, P2.x, P2.y];

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
