fabric.DragPoint = fabric.util.createClass(fabric.Object, {
  type: 'dragpoint',

  snappable: false,

  attribute: [],

  intialize: function(options) {
    options = options || {};

    this.callSuper('initialize', options);
  },

  _render: function (ctx) {
  }
});

fabric.DragPoint = fabric.util.createClass(fabric.Rect, {
  type: 'dragpoint',

  snappable: false,

  attribute: [],

  intialize: function(options) {
    options = options || {};

    this.callSuper('initialize', options);
  },

  _render: function (ctx) {
  }
});

//Add drag points
function addWithDragPoint (obj) {
  var dragP = new fabric.DragPoint({
    top: 100 + obj.getHeight()/2,
    left: 100 + obj.getWidth()/2,
    originX: 'center',
    originY: 'center',
    fill: 'black',
    radius: 3
    //lockRotation: true,
    //lockScalingX: true,
    //lockScalingY: true
  });
  var drag_group = new fabric.Group([obj, dragP]);
  canvas.add(drag_group);
}

//Add line
function addLine(){
 var line0 = new fabric.Line([50,100,50,300], { stroke:'cornflowerblue', strokeWidth: 2, top:100, left:100, lockRotation: true });
 addWithDragPoint(line0);
 updateLog();
}

//Add triangle
function addTriangle(){
  var triangle0 = new fabric.Triangle({ width: 30, height: 30, fill:'cornflowerblue', top:100, left:100, lockRotation: true});
  addWithDragPoint(triangle0);
  updateLog();
}

//Add Circle
function addCircle(){
  var circle0 = new fabric.Circle({ radius: 30, fill: 'dodgerblue', top: 100, left: 100, lockRotation: true});
  addWithDragPoint(circle0);
  updateLog();
}

//Add rectangle
function addRectangle(){
  var rectangle0 = new fabric.Rect({ width: 30, height:30, fill:'royalblue', top: 100, left:100, lockRotation: true});
  addWithDragPoint(rectangle0);
  updateLog();
}

canvas.on({
'object:scaling': onChange
})

function onChange(obj) {
  if (obj.target.item(1) != null) {
    var point = obj.target.item(1),
        group = obj.target,
        scaleX = point.width / group.getWidth(),
        scaleY = point.height / group.getHeight();
    point.setScaleX(scaleX);
    point.setScaleY(scaleY);
  }
}
