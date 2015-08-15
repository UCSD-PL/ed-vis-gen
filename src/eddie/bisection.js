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

  // x0, y0, x1, y1
  var interPoints = intersection(P1.x, P1.y, LCircle.r, P2.x, P2.y, RCircle.r);
  LP = Circle(interPoints[0], interPoints[1], 5, "red", "red");
  RP = Circle(interPoints[2], interPoints[3], 5, "red", "red");
  Bisector = Line(interPoints, "red");

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

  // map cvar name -> var
  constrained_vars = { P1X: P1X, P1Y: P1Y, R1X: R1X, R1Y: R1Y, C1R: C1R,
                       P2X: P2X, P2Y: P2Y, R2X: R2X, R2Y: R2Y, C2R: C2R,};

  // add drag transitive dependencies to ipoints
  R1.links = ["C1R", "R1X", "C2R", "R2X"];
  P1.links = ["R1X", "P1X", "P1Y", "R1Y"];
  R2.links = ["C2R", "R2X", "C1R", "R1X"];
  P2.links = ["R2X", "P2X", "P2Y", "R2Y"];

  constrainedPoints = {R1: {  ipoint: R1,
                              vs: {x: R1X,
                                   y: R1Y}
                           },
                       P1: {  ipoint: P1,
                              vs: {x: P1X,
                                   y: P1Y}
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


  var fromVar = c.Expression.fromVariable;
  var fromConst = c.Expression.fromConstant;
  var c1e = fromVar(C1R);
  solver.addConstraint(new c.Equation(P1X, c1e.plus(R1X)));
  solver.addConstraint(new c.Equation(P2X, fromVar(R2X).minus(C2R)));
  solver.addConstraint(new c.Equation(R1Y, P1Y));
  solver.addConstraint(new c.Equation(R2Y, P2Y));
  solver.addConstraint(new c.Equation(C1R, C2R));

  // window bound constraints
  var geq = function (a1, a2){ return new c.Inequality(a1, c.GEQ, a2)};
  var leq = function (a1, a2){ return new c.Inequality(a1, c.LEQ, a2)};

  var padding = 5;
  solver.addConstraint(geq(P1X, c1e.plus(fromConst(padding))));
  solver.addConstraint(geq(P1Y, c1e.plus(fromConst(padding))));
  solver.addConstraint(leq(P1X, fromConst(global_ctx.canvas.width-padding).minus(C1R)));
  solver.addConstraint(leq(P1Y, fromConst(global_ctx.canvas.height-padding).minus(C1R)));

  solver.addConstraint(geq(P2X, fromVar(C2R).plus(fromConst(padding))));
  solver.addConstraint(geq(P2Y, fromVar(C2R).plus(fromConst(padding))));
  solver.addConstraint(leq(P2X, fromConst(global_ctx.canvas.width-padding).minus(C2R)));
  solver.addConstraint(leq(P2Y, fromConst(global_ctx.canvas.height-padding).minus(C2R)));

  push(all_objects, P1, P2, Subject, LCircle, RCircle, R1, R2, LP, RP, Bisector);
  push(drag_points, P1, P2, R1, R2);


  eps = 2;

  // initialize timer

  tau = Timer(100, function(t) {
    update_constraints();
    global_redraw();
  }, function() {
    restoreAll([
      P1, Initials.p1,
      P2, Initials.p2,
      LCircle, Initials.lhs,
      RCircle, Initials.rhs
    ]
    );

    var rootCVs =  [P1X, P1Y, P2X, P2Y, C1R, C2R];
    var rootInit = [P1.x, P1.y, P2.x, P2.y, LCircle.r, RCircle.r];
    // update solver primary variables (p1, p2, c1, c2)
    rootCVs.forEach(function (cvar) {
      solver.addEditVar(cvar);
    });
    solver.beginEdit();

    // relies on rootCVS and rootInit having same size, order
    rootCVs.forEach(function (cvar, i) {
        try {
        solver.suggestValue(cvar, rootInit[i]);
      } catch (err) {
        console.log("err on " + i + " " + err.toString());
      }
    });
    solver.resolve();
    solver.endEdit();

    //console.log(solver.toString());

    fixed_constraints();
    global_redraw();

  });

  update_constraints();
}

function on_release() {
}

function on_click() {

}

function drag_update() {

  // @OPT: be smart about edits in common

  for (var i in constrainedPoints) {
    var cmn = constrainedPoints[i];
    if (cmn.ipoint === dragged_obj) {
      console.log("suggested " + cmn.vs.x.toString() + " " + cmn.vs.y.toString());
      solver.suggestValue(cmn.vs.x, dragged_obj.x);
      solver.suggestValue(cmn.vs.y, dragged_obj.y);
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

  P2.x = P2X.value;
  P2.y = P2Y.value;
  R2.x = R2X.value;
  R2.y = R2Y.value;

  RCircle.x = P2.x;
  RCircle.y = P2.y;
  RCircle.r = C2R.value;

  Subject.points = [P1.x, P1.y, P2.x, P2.y];

  var interPoints = intersection(P1.x, P1.y, LCircle.r, P2.x, P2.y, RCircle.r);
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
