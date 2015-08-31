function init() {
  all_objects = [];
  drag_points = [];
  inc_objects = [];

  //VARIABLES:
    PY = makeVariable("PY", 50.0);
    PYPH = makeVariable("PYPH", 70.0);
    W = makeVariable("W", 10.0);
    PX = makeVariable("PX", 50.0);
    PXMW = makeVariable("PXMW", 40.0);
    H = makeVariable("H", 20.0);
//IPOINTS:
    IP8 = InteractionPoint( PXMW, PYPH );
    IP8.links = ["PXMW", "PYPH", "PX", "PY"];
//SHAPES:
    S0 = Rectangle( PX.value-W.value, PY.value-H.value, W.value+PX.value, H.value+PY.value,
        "rgba(0,0,0,0)", "black" );
init_stays(); // SUPER IMPORTANT NEED THIS CALL
//EQUATIONS:
    addEquation(    fromConst(0.0).plus(fromVar(PXMW).times(1.0)),
        fromConst(0.0).plus(fromVar(PX).times(1.0).plus(fromVar(W).times(-1.0))));
    addEquation(    fromConst(0.0).plus(fromVar(PYPH).times(1.0)),
                    fromConst(0.0).plus(fromVar(H).times(1.0).plus(fromVar(PY).times(1.0))));
  push(all_objects, IP8, S0);
  push(drag_points, IP8);

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

  S0.x1 = PX.value - W.value;
  S0.y1 = PY.value - H.value;
  S0.x2 = PX.value + W.value;
  S0.y2 = PY.value + H.value;

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
