function c_main(height, width, shouldSimInteractions, shouldSimPhysics, shouldShowSnaps) {
  common_init(height, width, true);
  init();
  drawSnaps = shouldShowSnaps
  global_redraw();
  displaySimID = -1;
  cursor = null;


  if (shouldSimPhysics) {
    start();
  }

}


function startDisplay() {
  displaySimID = simInteractions();
}

function stopDisplay() {
  clearInterval(displaySimID);
  doMouseUp();
  all_objects.splice(all_objects.indexOf(cursor), 1);
  reset();
}

function simInteractions() {
  //console.log("point at: " + drag_points[0].x.value + ", " + drag_points[0].y.value);
  // the canvas is offset within the iframe, so we add the offset into the generated point
  var canv = document.getElementById("mainCanvas");
  var offset = canv.getBoundingClientRect();
  return circularSim(offset, {x: drag_points[0].x.value, y: drag_points[0].y.value}, canv);

}
