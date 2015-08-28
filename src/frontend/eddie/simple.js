function init() {
  all_objects = [];
  drag_points = [];
  inc_objects = [];

  //VARIABLES:
      PX_IX = makeVariable("PX_IX", 50.0);
      PY = makeVariable("PY", 50.0);
      PR = makeVariable("PR", 20.0);
      PX = makeVariable("PX", 50.0);
      PY_IY = makeVariable("PY_IY", 50.0);
  //IPOINTS:
      IP6 = InteractionPoint( PX_IX, PY_IY );
      IP6.links = ["PX_IX", "PY_IY", "PX", "PY"];
  //SHAPES:
      S7 = Circle( PX.value, PY.value, PR.value, "rgba(0,0,0,0)", "black" );
  init_stays(); // SUPER IMPORTANT NEED THIS CALL
  //EQUATIONS:
      addEquation(    fromConst(0.0).plus(fromVar(PX_IX).times(1.0)),
          fromConst(0.0).plus(fromVar(PX).times(1.0)));
      addEquation(    fromConst(0.0).plus(fromVar(PY_IY).times(1.0)),
                      fromConst(0.0).plus(fromVar(PY).times(1.0)));
  push(all_objects, IP6, S7);
  push(drag_points, IP6);

  // initialize timer

  tau = Timer(20, function(t) {
    update_constraints();
    global_redraw();
  }, function() {
    update_constraints();
    global_redraw();
  });
}

function drag_update() {
  update_constraints();
}

function update_constraints() {

  S7.x = PX.value;
  S7.y = PY.value;
  S7.r = PR.value;

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

function on_release() {
}

function on_click() {
}
