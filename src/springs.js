function init() {
  all_objects = [];
  drag_points = [];

  S1 = Spring(200, 200, 0, -100, "black");
  I1 = InteractionPoint (200, 200);
  I2 = InteractionPoint (200, 100);

  T = 0;

  push(all_objects, S1, I1, I2);
  push(drag_points, I1, I2);
}

function drag_update() {
  S1.x = I1.x;
  S1.y = I1.y;

  S1.dx = (I2.x - S1.x);
  S1.dy = (I2.y - S1.y);
}

function update_constraints() {

}
