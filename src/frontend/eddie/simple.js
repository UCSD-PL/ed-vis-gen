function init() {
  all_objects = [];
  drag_points = [];
  inc_objects = [];

  //prog19
  //VARIABLES:
    PY = makeVariable("PY", 50.0);
    W = makeVariable("W", 10.0);
    PX = makeVariable("PX", 50.0);
    PY_IYB = makeVariable("PY_IYB", 70.0);
    H = makeVariable("H", 20.0);
    PX_IXB = makeVariable("PX_IXB", 50.0);
//IPOINTS:
    IP14 = InteractionPoint( PX_IXB, PY_IYB );
    IP14.links = ["PX_IXB", "PX"];
//SHAPES:
    S0 = Circle( PX.value, PY.value, H.value, "black", "rgba(0,0,0,0)" );
init_stays(); // SUPER IMPORTANT NEED THIS CALL
//EQUATIONS:
    addEquation(    fromConst(0.0).plus(fromVar(PY_IYB).times(1.0)),
        fromConst(0.0).plus(fromVar(H).times(1.0).plus(fromVar(PY).times(1.0))));
    addEquation(    fromConst(0.0).plus(fromVar(PX_IXB).times(1.0)),
                    fromConst(0.0).plus(fromVar(PX).times(1.0)));

  push(all_objects, IP14, S0);
  push(drag_points, IP14);

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

  // rectangle
  S0.x1 = PX.value - W.value;
  S0.y1 = PY.value - H.value;
  S0.x2 = PX.value + W.value;
  S0.y2 = PY.value + H.value;
  // circle
  S0.x = PX.value;
  S0.y = PY.value;
  S0.r = H.value;

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
