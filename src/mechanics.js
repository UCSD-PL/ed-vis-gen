function init() {
  all_objects = [];  
  drag_points = [];
  rightClick_points = [];
  inc_objects = [];

  PigVelocity = {x:0, y:0};
  Initial ={ramp: {x1:100 , y1:163 , x2:100 , y2:250 , x3:250, y3:250},
            v: {x:0, y:0}, 
            mu: {mn:0, mx:1, val:.55},
            g: {mn:0, mx:2, val:1},
            ang: {val:Math.PI/6},
            pig: {x:100, y:140},
            mass: {mn:100, mx:200, val:150},
            fricvec: {x: 100, y: 140, dx: -51, dy: -51},
            normvec: {x: 100, y: 140, dx: 92, dy: -92},
            gravvec: {x: 100, y: 140, dx: 0, dy: +150},
            i1: {x:100, y:163}
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
  addSlider("Friction", "sliders", Initial.mu.mn, Initial.mu.mx, Initial.mu.val, function(o) {
      CurrConstants.mu = getSliderValue("Friction");
  });
  addSlider("Gravity", "sliders", Initial.g.mn, Initial.g.mx, Initial.g.val, function(o) {
      CurrConstants.g = getSliderValue("Gravity");
  });
  
  Height = InteractionPoint(Initial.i1.x, Initial.i1.y);
  
  FricVec = Arrow (Initial.fricvec.x, Initial.fricvec.y, Initial.fricvec.dx, Initial.fricvec.dy, "red");
  
  NormVec = Arrow (Initial.normvec.x, Initial.normvec.y, Initial.normvec.dx, Initial.normvec.dy, "red");
  
  GravVec = Arrow (Initial.gravvec.x, Initial.gravvec.y, Initial.gravvec.dx, Initial.gravvec.dy, "red");
  

  Title = Text(50, 50, "Pig on a ramp with friction", "16pt Comic sans MS");


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
    restoreAll([
      // Vectors
      NormVec, Initial.normvec,
      FricVec, Initial.fricvec,
      GravVec, Initial.gravvec,
      Height, Initial.i1
      ]);

    setSliderValue("Mass", Initial.mass.val);
    setSliderValue("Friction", Initial.mu.val);
    setSliderValue("Gravity", Initial.g.val);

    for (var e in CurrConstants) {
      CurrConstants[e] = Initial[e].val;
    }

    update_constraints();
    global_redraw();
  }); // executes every 10ms (.01s)

  push(all_objects, FricVec, NormVec, GravVec, Title, Pig, Ramp, Height);
  push(drag_points, Height);


}

function drag_update() {
  Height.x = Initial.i1.x;
  
  var lastRamp = Ramp.y1;
  Ramp.y1 = Height.y;
  CurrConstants.ang = Math.atan((Ramp.y2-Ramp.y1)/(Ramp.x2-Ramp.x3));
  

  // Get pig to drop the correct amount
  // non-trivial geometry problem
  var bigHeight = Ramp.y2 - lastRamp;
  var bigDelta = Ramp.y1 - lastRamp;
  var smallHeight = Ramp.y2 - Pig.y;
  var smallDelta = smallHeight*bigDelta/bigHeight;
  Pig.y += bigDelta;

  FricVec.x = GravVec.x = NormVec.x = Pig.x;
  FricVec.y = GravVec.y = NormVec.y = Pig.y;

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

  // calculating appropriate vector lengths
  FricVec.dx = FricVec.dy = -.707*Fric/10;
  GravVec.dy = +Grav/10;
  NormVec.dy = -(NormVec.dx = NormF*.707/10)

  
  netForce = Math.max(0, Grav*Math.sin(CurrConstants.ang)-Fric);

  PigVelocity.x = PigVelocity.x + netForce*Math.cos(CurrConstants.ang) / CurrConstants.mass;
  PigVelocity.y = PigVelocity.y + netForce*Math.sin(CurrConstants.ang) / CurrConstants.mass;
  // v = dx/dt => dx = v
  Pig.x = Pig.x + PigVelocity.x;
  Pig.y = Pig.y + PigVelocity.y;
  
  // update the vector positions
  FricVec.x = Pig.x;
  FricVec.y = Pig.y;

  NormVec.x = Pig.x;
  NormVec.y = Pig.y;

  GravVec.x = Pig.x;
  GravVec.y = Pig.y;
  
  if (Pig.x > Ramp.x3) {tau.stop();}
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
