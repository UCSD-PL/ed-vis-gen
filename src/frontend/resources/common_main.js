function c_main(height, width, shouldSimInteractions, shouldSimPhysics) {
  common_init(height, width, shouldSimPhysics);
  init();
  global_redraw();

  if (shouldSimPhysics) {
    start();
  }

  if (shouldSimInteractions) {
    //console.log("point at: " + drag_points[0].x.value + ", " + drag_points[0].y.value);
    // the canvas is offset within the iframe, so we add the offset into the generated point
    var canv = document.getElementById("mainCanvas");
    var offset = canv.getBoundingClientRect();
    circularSim(offset, {x: drag_points[0].x.value, y: drag_points[0].y.value}, canv);
  }

}
