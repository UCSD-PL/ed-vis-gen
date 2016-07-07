fabric.CustomObject = fabric.util.createClass(fabric.Circle, {
    type: 'dragpoint',

    draggable: false,

    top: 100,

    left: 100,

    fill: 'green',

    initialize: function (options) {
       options = options || {};

       this.callSuper('initialize', options);
   },

   _render: function(ctx) {

});

function renderDragPoints (check) {
  if (check === true) {
    var dp1 = new fabric.DragPoint({fill: 'black'});
    canvas.add(dp1);
    console.log('SOMETHING SHOULD BE HAPPENING');
  }
}
