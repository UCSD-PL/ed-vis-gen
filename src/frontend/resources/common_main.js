function c_main(height, width) {
  common_init(height, width);
  init();
  global_redraw();

  if ('0' in drag_points) {
    //console.log("point at: " + drag_points[0].x.value + ", " + drag_points[0].y.value);
    // the canvas is offset within the iframe, so we add the offset into the generated point
    var canv = document.getElementById("mainCanvas");
    var offset = canv.getBoundingClientRect();
    circularSim({x: drag_points[0].x.value + offset.left, y: drag_points[0].y.value + offset.top}, canv);
  }
}
