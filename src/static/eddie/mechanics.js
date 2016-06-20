function init() {
  all_objects = [];  
  drag_points = [];
  rightClick_points = [];
  inc_objects = [];

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
            h: {x:100, y:163},
            vel: {x:0, y:0}
            };
  
  
  // ramp and pig
  RX = makeVariable("RX", Initial.ramp.x1);
  RY = makeVariable("RY", Initial.ramp.y1);
  Ramp = Triangle (
    RX.value, RY.value,
    Initial.ramp.x2, Initial.ramp.y2,
    Initial.ramp.x3, Initial.ramp.y3,
    "black", "rgba(0,0,0,0)");
  PX = makeVariable("PX", Initial.pig.x);
  PY = makeVariable("PY", Initial.pig.y);
  Pig = Image(PX.value, PY.value, 50, 50, "pig");
  VX = makeVariable("VX", Initial.vel.x);
  VY = makeVariable("VY", Initial.vel.y);

  Mass = makeVariable("Mass", Initial.mass.val);
  Fric = makeVariable("Fric", Initial.mu.val);
  Grav = makeVariable("Grav", Initial.g.val);

  // sliders
  addSlider("Mass", "sliders", Initial.mass.mn, Initial.mass.mx, Initial.mass.val, function(o) {
      getSliderValue("Mass", Mass);
  });
  addSlider("Friction", "sliders", Initial.mu.mn, Initial.mu.mx, Initial.mu.val, function(o) {
      getSliderValue("Friction", Fric);
  });
  addSlider("Gravity", "sliders", Initial.g.mn, Initial.g.mx, Initial.g.val, function(o) {
      getSliderValue("Gravity", Grav);
  });
  
  /*
  // Interaction point
  HX = makeVariable("HX", Initial.h.x);
  HY = makeVariable("HY", Initial.h.y);
  Height = InteractionPoint(HX, HY);
  */

  // Force Vectors
  FDX = makeVariable("FDX", Initial.fricvec.dx);
  FDY = makeVariable("FDY", Initial.fricvec.dy);
  FricVec = Arrow (Initial.fricvec.x, Initial.fricvec.y, Initial.fricvec.dx, Initial.fricvec.dy, "red");
  
  NDX = makeVariable("NDX", Initial.normvec.dx);
  NDY = makeVariable("NDY", Initial.normvec.dy);
  NormVec = Arrow (Initial.normvec.x, Initial.normvec.y, Initial.normvec.dx, Initial.normvec.dy, "red");
  
  GDX = makeVariable("GDX", Initial.gravvec.dx);
  GDY = makeVariable("GDY", Initial.gravvec.dy);
  GravVec = Arrow (Initial.gravvec.x, Initial.gravvec.y, Initial.gravvec.dx, Initial.gravvec.dy, "red");
  


  Title = Text(50, 50, "Pig on a ramp with friction", "16pt Comic sans MS");

  /*Height.links = ["PX", "PY", "RX", "RY", "Ang"];
  */
  init_stays(); // http://imgur.com/yOtPUOt
  /*
  // Equations go here
  // Not sure what they are yet though
  
  // one keeps the x coord of the interaction point the same
  addEquation(HX, fromConst(Initial.h.x));
  */



  push(all_objects, FricVec, NormVec, GravVec, Title, Pig, Ramp);// Height);
  //push(drag_points, Height);

  tau = Timer(10, function(t){
    update_rec_constraints(
      recursive_constraints, // function handling pig motion
      ["PX", "PY", "VX", "VY",  "FDX", "FDY",
       "NDX", "NDY",, "GDX", "GDY"]); // list of modified variables here)
    update_drawing();
    global_redraw();
  }, function() {
    
    resetCVs();

    setSliderValue("Mass", Initial.mass.val);
    setSliderValue("Friction", Initial.mu.val);
    setSliderValue("Gravity", Initial.g.val);


    update_drawing();
    global_redraw();
  }); // executes every 10ms (.01s)


}

function drag_update() {
  update_drawing();  

  /*Height.x = Initial.h.x;
  
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
  */
}

function rightClick_update() {
}

function recursive_constraints(args) {
  //TODO

  var px = args.PX;
  var py = args.PY;
  var vx = args.VX;
  var vy = args.VY;

  var g = Grav.value;
  var m = Mass.value;
  var mu = Fric.value;
  
  var fdx = FDX;
  var fdy = FDY;
  var ndx = NDX;
  var ndy = NDY;
  var gdx = GDX;
  var gdy = GDY;

  var ang = Initial.ang.val;
  
  // differential equations, implicit time version (i.e. dt = 1)
  // a = dv/dt = ∑ F/m => dv = ∑ F/m
  
  G = 9.8*g;
  GravF = m*G;
  NormF = GravF*Math.cos(ang);
  FricF = mu*NormF;

  // calculating appropriate vector lengths
  fdx = fdy = -.707*FricF/10;
  gdy = +GravF/10;
  ndy = -(ndx = NormF*.707/10)

  netForce = Math.max(0, GravF*Math.sin(ang)-FricF);

  vx = vx + netForce*Math.cos(ang) / m;
  vy = vy + netForce*Math.sin(ang) / m;
  // v = dx/dt => dx = v
  px = px + vx;
  py = py + vy;

  return { PX:px, PY:py, VX:vx, VY:vy, FDX:fdx,
           FDY:fdy, GDY:gdy, NDX:ndx, NDY:ndy}
}



function update_drawing() {
  Pig.x = PX.value;
  Pig.y = PY.value;

  FricVec.x = PX.value;
  FricVec.y = PY.value;
  FricVec.dx = FDX.value;
  FricVec.dy = FDY.value;

  NormVec.x = PX.value;
  NormVec.y = PY.value;
  NormVec.dx = NDX.value;
  NormVec.dy = NDY.value;

  GravVec.x = PX.value;
  GravVec.y = PY.value;
  GravVec.dx = GDX.value;
  GravVec.dy = GDY.value;

}





function update_constraints() {
  update_drawing(); 
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
