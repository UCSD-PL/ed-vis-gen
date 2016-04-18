// constructor for code handling sidebar shapes. code is responsible for drawing
// shapes...and I think that's it. the global controller should handle interactions,
// and the static html/css handles the shape containers and their layout.

// PRECONDITION: assumes EDDIE/* has been imported.
// POSTCONDITION: adds a shapeBuilder object to the global scope.
(function(scope) {
  var shapeBuilder = {};
  // assumes document has a 'left-pane' div holding the shapes
  // and each shape is a direct child of the left-pane div.
  shapeBuilder.buildAll = function() {
    $('#left-pane .shape').each( function(i, shapeDiv) {
      var shpCtor, args;
      switch (shapeDiv.id) {
        case "rectangle":
          shpCtor = Rectangle;
          args = [25, 25, 75, 75]; //x1, y1, x2, y2
          break;
        case "circle":
          shpCtor = Circle;
          args = [50, 50, 25]; //x, y, r
      }
    });
  }
  shapeBuilder.test = function () {
    shapeBuilder.buildAll();
  };

  scope.SB = shapeBuilder;
})(this); // TODO: if we add more static code, pass in static namespace instead of this
