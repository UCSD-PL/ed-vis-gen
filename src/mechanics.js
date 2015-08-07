function init() {
  all_objects = [];  
  drag_points = [];
  rightClick_points = [];

  PigVelocity = {x:0, y:0};
  Initial ={ramp: {x1:100 , y1:163 , x2:100 , y2:250 , x3:250, y3:250},
            v: {x:0, y:0}, 
            mu: {mn:0, mx:1, val:.55},
            g: {mn:0, mx:2, val:1},
            ang: {mn:0, mx:Math.PI/2, val:Math.PI/6},
            pig: {x:175, y:207},
            mass: {mn:10000, mx:20000, val:15000}
            };
  
  Ramp = Triangle (
    Initial.ramp.x1, Initial.ramp.y1,
    Initial.ramp.x2, Initial.ramp.y2,
    Initial.ramp.x3, Initial.ramp.y3,
    "black", "rgba(0,0,0,0)");
  Pig = Image(Initial.pig.x, Initial.pig.y, 50, 50, "pig");
  

  CurrConstants = {mass: Initial.mass.val, g: Initial.g.val, ang: Initial.ang.val, mu: Initial.mu.val};
  // sliders
  addSlider("Mass", "sliders", Initial.mass.mn, Initial.mass.mx, Initial.mass.val, function(o) {
      CurrConstants.mass = getSliderValue("Mass");
  });
  addSlider("Angle", "sliders", Initial.ang.mn, Initial.ang.mx, Initial.ang.val, function(o) {
      CurrConstants.ang = getSliderValue("Angle");
  });
  addSlider("Friction", "sliders", Initial.mu.mn, Initial.mu.mx, Initial.mu.val, function(o) {
      CurrConstants.mu = getSliderValue("Friction");
  });
  addSlider("Gravity", "sliders", Initial.g.mn, Initial.g.mx, Initial.g.val, function(o) {
      CurrConstants.g = getSliderValue("Gravity");
  });
  
   /*
  FricVec = Arrow (Initial.x, Initial.y, -50, -50, "red");
  
  NormVec = Arrow (Initial.x, Initial.y, 50, -50, "red");
  
  GravVec = Arrow (Initial.x, Initial.y, 0, +150, "red");
  */

  Title = Text(50, 50, "Pig on a ramp with friction", "16pt Comic sans MS");

  // right now, start/stop/reset are handled as html buttons
  // TODO: implement these
  //Start = TextCircle(400, 100, 40, -15, 10, "Go", "black");
  //SI = InteractionPoint(400, 100);
  //Reset = TextCircle(400, 200, 40, -30, 10, "Reset", "black");
  //RI = InteractionPoint(400, 200);

  T = 0;

  tau = Timer(10, function(t){
    T = t/100;
    update_constraints();
    global_redraw();
  }, function() {
    T = 0;
    restore(Pig, Initial.pig);
    restore(PigVelocity, Initial.v);
    restore(Ramp, Initial.ramp)
    /*
    FricVec.dx = -50;
    FricVec.dy = -50;
    NormVec.dx = 50;
    NormVec.dy = -50;
    GravVec.dx = 0;
    GravVec.dy = 150;
    */

    setSliderValue("Mass", Initial.mass.val);
    setSliderValue("Friction", Initial.mu.val);
    setSliderValue("Angle", Initial.ang.val);
    setSliderValue("Gravity", Initial.g.val);

    for (var e in CurrConstants) {
      CurrConstants[e] = Initial[e].val;
    }

    update_constraints();
    global_redraw();
  }); // executes every 10ms (.01s)

  push(all_objects, /*FricVec, NormVec, GravVec,*/ Title, Pig, Ramp /*,Start, Reset*/);
  //push(drag_points, I1, I2, I3 /*,SI, RI*/);


}

function drag_update() {
  
}

function rightClick_update() {
}

function update_constraints() {
  // differential equations, implicit time version (i.e. dt = 1)
  // a = dv/dt = ∑ F/m => dv = ∑ F/m
  G = 9.8*CurrConstants.g;
  Grav = CurrConstants.mass*G;
  NormF = Grav*Math.cos(CurrConstants.ang);
  Fric = CurrConstants.mu*NormF;
  
  netForce = Math.max(0, Grav*Math.sin(CurrConstants.ang)-Fric);

  PigVelocity.x = PigVelocity.x + netForce*Math.cos(CurrConstants.ang) / CurrConstants.mass;
  PigVelocity.y = PigVelocity.y + netForce*Math.sin(CurrConstants.ang) / CurrConstants.mass;
  // v = dx/dt => dx = v
  Pig.x = Pig.x + PigVelocity.x;
  Pig.y = Pig.y + PigVelocity.y;
  /*
  // update the vector positions
  FricVec.x = Pig.x;
  FricVec.y = Pig.y;

  NormVec.x = Pig.x;
  NormVec.y = Pig.y;

  GravVec.x = Pig.x;
  GravVec.y = Pig.y;
  */

  // TODO - make ramp height actually change, possibly with interaction
  //      - show force vectors with arrows
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
