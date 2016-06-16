//



function common_init(height, width, alwaysRun) {

  // canvas operations are expensive, so we distinguish between a global canvas
  // "mainCanvas", which gets (globally) wiped and redrawn every frame, and
  // an incremental canvas "incCanvas", which never gets wiped. In return,
  // drawn on the incremental canvas must clean up after themselves and implement
  // an "incDraw" method.

  // for the moment, only plots draw on the incremental canvas, but a further
  // optimization would be to put all static objects in a background canvas
  // and make everything dynamic live in the incremental canvas.
  var canvas = document.getElementById("mainCanvas");
  var ctx = canvas.getContext("2d");
  global_ctx = ctx;
  ctx.canvas.width  = width-20;
  ctx.canvas.height = height-20;
  // ctx = document.getElementById("incCanvas").getContext("2d");
  // inc_ctx = ctx;
  // ctx.canvas.width  = 1000;
  // ctx.canvas.height = 1000;

  canvas.addEventListener("eddiemousedown", doMouseDown);
  canvas.addEventListener("eddiemouseup", doMouseUp);
  canvas.addEventListener("eddiemousemove", doMouseMove);

  shouldShowSnaps = false;
  resetState();

  if (alwaysRun) {
  } else {
    // only run physics engine when selected
    document.body.onmouseover = function() {
      timers.map(function(t) {
        if (t.shouldRun) {
          t.start();
        }
      });
    };
    document.body.onmouseout = function() {
      timers.map(function(t) {
        if (t.shouldRun) {
          t.stop();
        }
      });
    };
  }

}

function resetState() {
  dragged_obj = null;

  solver = new c.SimplexSolver();
  solver.autoSolve = false;
  //dfnetwork = new DFNetwork(dfparser);

  linear_vars = {};
  linear_inits = {};

  df_vars = {};
  df_inits = {};

  stay_equations = {};

  all_objects = [];
  drag_points = [];
  inc_objects = [];
  timers = [];

  chartInit(250, 300);

  snapRegions = [];
  snap_points = [];

}

function removePoint(point) {
  removeFromArr(all_objects, point);
  removeFromArr(drag_points, point);
}

function doMouseDown(e) {
  switch (e.detail.button) {
    case 0: // left click
      doLeftClick(e);
      break;
    case 2: // right click
      doRightClick(e);
      break;
    default:
      console.log("ERROR: unsupported event");// error in event interface
      console.log(e);
  }
}

function doLeftClick(e) {
  dragged_obj = null;
  var x = e.detail.x;
  var y = e.detail.y;
  // console.log('clicked: ' + x + ", " + y);
  // console.log('targets: ' + drag_points.toString());
  for (var i = 0; i < drag_points.length; i++) {
    if (withinRadius(x, y, drag_points[i])) {
      dragged_obj = drag_points[i];
      on_click();
      break;
    }
  }

  if (dragged_obj) {
    // suggest each constrained variable as possible to edit
    //console.log("clicked on: " + dragged_obj.x.name);
    // console.log("before edit");
    // console.log(solver.getDebugInfo());
    remove_stays();


    // make a correct stay equation for the current values


    // only *actually* add stays that are desired
    //console.log("removing stays:");
    dragged_obj.links.forEach(function (cv) {
      //console.log(cv);
      delete stay_equations[cv];
    });

    add_stays();

    addEdit(solver, dragged_obj.x);
    addEdit(solver, dragged_obj.y);
    solver.beginEdit();
    // console.log("after edit");
    // console.log(solver.getDebugInfo());
  }
}

function doRightClick(e) {
}

function doMouseUp() {
  //console.log("released");
  // console.log("released at: " + e.detail.x + ", " + e.detail.y);
  //drag_update();
  if (dragged_obj != null) {
    var newOutput = on_release(getCurrValues());
    solver.endEdit();
    // copy vals to arg object
    // clear stay constraints in solver
    remove_stays();
    for (var cv in linear_vars) {
      stay_equations[cv] = makeStay(linear_vars[cv]);
    }
    add_stays();
    //console.log("after cleanup: ");
    //console.log(solver.getDebugInfo());
    dragged_obj = null;
  }
}

// precondition: stay equations are outdated
// postcondition: stay equations are updated
function doMouseMove(e) {
  if (dragged_obj != null) {

    //console.log("move at: " + e.detail.x + ", " + e.detail.y);
    solver.suggestValue(dragged_obj.x, e.detail.x);
    solver.suggestValue(dragged_obj.y, e.detail.y);

    // console.log("before move");
    // console.log(solver.getDebugInfo());
    refresh_stays();

    // get edits from app
    drag_update();
    // after edits are suggested, recalculate values
    solver.solve();
    // dfnetwork.resolve();
    // update drawing WRT current constrained values
    update_constraints();
    global_redraw();

    // remove old stays and update stay equations
    refresh_stays();
    // console.log("after move");
    // console.log(solver.getDebugInfo());
  }
}

function refresh_stays() {
  remove_stays();
  add_stays();
}

function add_stays() {
  //console.log("adding stays:");
  for (var cv in stay_equations) {
    solver.addConstraint(stay_equations[cv]);
    //console.log(cv + " : " + stay_equations[cv].toString());
  }
}

function remove_stays() {
  //console.log("clearing stays:")
  for (var cv in stay_equations) {
    solver.removeConstraint(stay_equations[cv]);
    stay_equations[cv] = makeStay(linear_vars[cv]);
    //console.log(cv + " : " + stay_equations[cv].toString());
  }
}

function global_redraw() {
  var ctx = global_ctx;
  ctx.clearRect(0,0, ctx.canvas.width, ctx.canvas.height);

  recordChartValues();
  draw_all(ctx);
  drawCharts();


  inc_objects.forEach(function(e) {
    //e.incDraw(inc_ctx);
  });
}

function draw_all(ctx) {
  for (var i = 0; i < all_objects.length; i++) {
    all_objects[i].draw(ctx);
  }

  if (drawSnaps) {
    // console.log(snap_points);
    snap_points.forEach(o => o.draw(ctx));
  }
}

function getCurrValues() {
  return _.mapObject(linear_vars, function(v){ return v.value; });
}

// given a function for recursive constraints, which expects an object of
// {"cvname":cvalue}, pass all current cvalues to the function, suggest the values
// to the solver, and update. second argument specifies which stay equations
//
function update_rec_constraints(work, fvs) {

  // if we're dragging an object, and the object would interfere with the simulation,
  // break.
  var clash = false;
  if (dragged_obj != null) {

    fvs.forEach(function (cv) {
      if (dragged_obj.links.indexOf(cv) != -1) {
        clash = true;
        return; // i would like a nonlocal return but only sorin's thesis language
                // and apparently scala supports them
      }
    });
  }

  var newVs = work(getCurrValues());

  var noEdits = false //_.isEmpty(newVs);
  if (clash || noEdits) { return; }


  remove_stays();
  fvs.forEach(function (cv) {delete stay_equations[cv];});

  for (var cv in newVs) {
    addEdit(solver, linear_vars[cv]);
  }
  //add_stays();
  solver.beginEdit();
  //var logstr = "adding values: "
  for (var cv in newVs) {
    //logstr += (cv + " -> " + newVs[cv]);
    solver.suggestValue(linear_vars[cv], newVs[cv]);
  }
  //refresh_stays();
  //console.log(logstr);
  add_stays();
  solver.solve();
  solver.endEdit();

  //refresh_stays();
  //add_stays();
  remove_stays();
  for (var cv in linear_vars) {
    stay_equations[cv] = makeStay(linear_vars[cv]);
  }
  add_stays();
}
