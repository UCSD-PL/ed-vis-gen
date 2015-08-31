function init() {
  all_objects = [];
  drag_points = [];
  inc_objects = [];

  //VARIABLES:
      PX_IX = makeVariable("PX_IX", 50.0);
      PY = makeVariable("PY", 50.0);
      PX2 = makeVariable("PX2", 70.0);
      PY2 = makeVariable("PY2", 90.0);
      PX = makeVariable("PX", 50.0);
      PY_IY = makeVariable("PY_IY", 50.0);
  //IPOINTS:
      IP6 = InteractionPoint( PX_IX, PY_IY );
      IP6.links = ["PX_IX", "PX2", "PX", "PY", "PY2", "PY_IY"];
  //SHAPES:
      S0 = Rectangle( PX.value, PY.value, PX2.value, PY2.value, "rgba(0,0,0,0)",
          "black" );
      S0W = makeVariable("S0W", 20);
      S0H = makeVariable("S0H", 40);
  init_stays(); // SUPER IMPORTANT NEED THIS CALL
  //EQUATIONS:
      addEquation(    fromConst(0.0).plus(fromVar(PX_IX).times(1.0)),
          fromConst(0.0).plus(fromVar(PX).times(1.0)));
      addEquation(    fromConst(0.0).plus(fromVar(PY_IY).times(1.0)),
                      fromConst(0.0).plus(fromVar(PY).times(1.0)));
      addEquation(fromVar(S0W), fromVar(PX2).minus(fromVar(PX)));
      addEquation(fromVar(S0H), fromVar(PY2).minus(fromVar(PY)));
  push(all_objects, IP6, S0);
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

  S0.x1 = PX.value;
  S0.y1 = PY.value;
  S0.x2 = PX2.value;
  S0.y2 = PY2.value;

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
