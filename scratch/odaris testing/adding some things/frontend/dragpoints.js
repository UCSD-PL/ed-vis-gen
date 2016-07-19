(function(global) {

  'use strict';

  var fabric = global.fabric || (global.fabric = { }),
      pi = Math.PI,
      extend = fabric.util.object.extend;

  if (fabric.DragPoint) {
    fabric.warn('fabric.DragPoint is already defined.');
    return;
  }

  /**
   * DragPoint class
   * @class fabric.DragPoint
   * @extends fabric.Object
   * @see {@link fabric.DragPoint#initialize} for constructor definition
   */
  fabric.DragPoint = fabric.util.createClass(fabric.Object, /** @lends fabric.Circle.prototype */ {
    /**
     * Type of an object
     * @type String
     * @default
     */
    type: 'dragPoint',

    /**
     * Type of an object
     * @type String
     * @default
     */
    name: "dragPoint",

    /**
    * Shape that the dragPoint hangs around width
    * @type fabric.Object
    * @default
    */
    shape: null,

    /**
    * Shape that the dragPoint hangs around width
    * @type fabric.Object
    * @default
    */
    shapeName: '',

    /**
    * the x-coordinate of the dragPoint's shape (shape.Left)
    * @type a variable (which should lead to a Number)
    */
    X: null,

    /**
    * the y-coordinate of the dragPoint's shape (shape.Top)
    * @type Number
    */
    Y: null,

    /**
    * the x-coordinate of the dragPoint in relation to its shape
    * @type Number
    */
    DX: null,

    /**
    * the y-coordinate of the dragPoint in relation to its shape
    * @type Number
    */
    DY: null,

    /**
     * Radius of this circle
     * @type Number
     * @default
     */
    radius: 5,

    /**
     * Start angle of the circle, moving clockwise
     * @type Number
     * @default 0
     */
    startAngle: 0,

    /**
     * End angle of the circle
     * @type Number
     * @default 2Pi
     */
    endAngle: pi * 2,

    /**
    * other defaults
    */
    originX: 'center',
    originY: 'center',
    fill: 'black',
    lockMovementX: true,
    lockMovementY: true,
    lockScalingX: true,
    lockScalingY: true,
    lockRotation: true,
    hasBorders: false,
    hasControls: false,
    /**
     * Constructor
     * @param {Object} [options] Options object
     * @return {Object} thisArg
     */
    initialize: function(options) {
      options = options || { };

      this.callSuper('initialize', options);
      this.set('radius', options.radius || 4);
      this.set('shapeName', options.shapeName || '');
      if (options.shape != null && options.shape.type != 'line') {
        this.set('X', options.shape.left);
        this.set('Y', options.shape.top);
        this.set('DX', options.DX || 0);
        this.set('DY', options.DY|| 0);
        this.set('left', options.shape.x2);
        this.set('top', options.shape.y2);
      }
      else if (options.shape != null && options.shape.type == 'line') {
        this.set('X', options.shape.left);
        this.set('Y', options.shape.top);
        this.set('DX', options.DX);
        this.set('DY', options.DY);
        this.set('left', options.shape.left + options.shape.strokeWidth*options.DX);
        this.set('top', options.shape.top + options.shape.height*options.DY);
      }
      else {
        this.set('X', 0);
        this.set('Y', 0);
        this.set('DX', 0);
        this.set('DY', 0);
        this.set('left', 10);
        this.set('top', 10);
      }

      this.startAngle = options.startAngle || this.startAngle;
      this.endAngle = options.endAngle || this.endAngle;

    },

    /**
     * @private
     * @param {String} key
     * @param {Any} value
     * @return {fabric.DragPoint} thisArg
     */
    _set: function(key, value) {
      this.callSuper('_set', key, value);

      if (key === 'radius') {
        this.setRadius(value);
      }

      return this;
    },

    /**
    * updates the coordinates of the drag point
    * @return
    */
    updateCoords: function(canvas) {
      var drag = this;
      canvas.forEachObject( function(ctx) {
        if (ctx === drag) return;
        if (ctx == drag.shape || ctx.name === drag.shapeName) {
            drag.set({
              shape: ctx
            });
            if (drag.shape.type === 'line') {
              drag.set({
                X: ctx.get('x1'),
                Y: ctx.get('y1'),
                left: drag.shape.x2,
                top: drag.shape.y2
              });
            }
            else {
              drag.set({
                X: ctx.getLeft(),
                Y: ctx.getTop(),
                left: ctx.getLeft() + ctx.getWidth()*drag.get('DX'),
                top: ctx.getTop() + ctx.getHeight()*drag.get('DY')
              });
            }
       console.log(drag);
       //drag.bringToFront();
       drag.setCoords(canvas);
     }});
      return;
   },

    /**
     * Returns object representation of an instance
     * @param {Array} [propertiesToInclude] Any properties that you might want to additionally include in the output
     * @return {Object} object representation of an instance
     */
    toObject: function(propertiesToInclude) {
      return extend(this.callSuper('toObject', propertiesToInclude), {
        radius: this.get('radius'),
        shape: this.get('shape'),
        shapeName: this.get('shapeName'),
        X: this.X,
        Y: this.Y,
        DX: this.get('DX'),
        DY: this.get('DY'),
        left: this.X + this.shape.width*this.DX,
        top: this.Y + this.shape.height*this.DY,
        startAngle: this.startAngle,
        endAngle: this.endAngle
      });
    },

    /* _TO_SVG_START_ */
    /**
     * Returns svg representation of an instance
     * @param {Function} [reviver] Method for further parsing of svg representation.
     * @return {String} svg representation of an instance
     */
    toSVG: function(reviver) {
      var markup = this._createBaseSVGMarkup(), x = 0, y = 0,
      angle = (this.endAngle - this.startAngle) % ( 2 * pi);

      if (angle === 0) {
        if (this.group && this.group.type === 'path-group') {
          x = this.left + this.radius;
          y = this.top + this.radius;
        }
        markup.push(
          '<circle ',
            'cx="' + x + '" cy="' + y + '" ',
            'r="', this.radius,
            '" style="', this.getSvgStyles(),
            '" transform="', this.getSvgTransform(),
            ' ', this.getSvgTransformMatrix(),
          '"/>\n'
        );
      }
      else {
        var startX = Math.cos(this.startAngle) * this.radius,
            startY = Math.sin(this.startAngle) * this.radius,
            endX = Math.cos(this.endAngle) * this.radius,
            endY = Math.sin(this.endAngle) * this.radius,
            largeFlag = angle > pi ? '1' : '0';

        markup.push(
          '<path d="M ' + startX + ' ' + startY,
          ' A ' + this.radius + ' ' + this.radius,
          ' 0 ', + largeFlag + ' 1', ' ' + endX + ' ' + endY,
          '" style="', this.getSvgStyles(),
          '" transform="', this.getSvgTransform(),
          ' ', this.getSvgTransformMatrix(),
          '"/>\n'
        );
      }

      return reviver ? reviver(markup.join('')) : markup.join('');
    },
    /* _TO_SVG_END_ */

    /**
     * @private
     * @param {CanvasRenderingContext2D} ctx context to render on
     * @param {Boolean} [noTransform] When true, context is not transformed
     */
    _render: function(ctx, noTransform) {
      ctx.beginPath();
      ctx.arc(noTransform ? this.left + this.radius : 0,
              noTransform ? this.top + this.radius : 0,
              this.radius,
              this.startAngle,
              this.endAngle, false);
      this._renderFill(ctx);
      this._renderStroke(ctx);
    },

    /**
     * Returns horizontal radius of an object (according to how an object is scaled)
     * @return {Number}
     */
    getRadiusX: function() {
      return this.get('radius') * this.get('scaleX');
    },

    /**
     * Returns vertical radius of an object (according to how an object is scaled)
     * @return {Number}
     */
    getRadiusY: function() {
      return this.get('radius') * this.get('scaleY');
    },

    /**
     * Sets radius of an object (and updates width accordingly)
     * @return {fabric.DragPoint} thisArg
     */
    setRadius: function(value) {
      this.radius = value;
      return this.set('width', value * 2).set('height', value * 2);
    },

    /**
     * Returns complexity of an instance
     * @return {Number} complexity of this instance
     */
    complexity: function() {
      return 1.01;
    }
  });

  /* _FROM_SVG_START_ */
  /**
   * List of attribute names to account for when parsing SVG element (used by {@link fabric.Circle.fromElement})
   * @static
   * @memberOf fabric.Circle
   * @see: http://www.w3.org/TR/SVG/shapes.html#CircleElement
   */
  fabric.DragPoint.ATTRIBUTE_NAMES = fabric.SHARED_ATTRIBUTES.concat('cx cy r'.split(' '));

  /**
   * Returns {@link fabric.DragPoint} instance from an SVG element
   * @static
   * @memberOf fabric.DragPoint
   * @param {SVGElement} element Element to parse
   * @param {Object} [options] Options object
   * @throws {Error} If value of `r` attribute is missing or invalid
   * @return {fabric.DragPoint} Instance of fabric.Circle
   */
  fabric.DragPoint.fromElement = function(element, options) {
    options || (options = { });

    var parsedAttributes = fabric.parseAttributes(element, fabric.DragPoint.ATTRIBUTE_NAMES);

    if (!isValidRadius(parsedAttributes)) {
      throw new Error('value of `r` attribute is required and can not be negative');
    }

    parsedAttributes.left = parsedAttributes.left || 0;
    parsedAttributes.top = parsedAttributes.top || 0;

    var obj = new fabric.DragPoint(extend(parsedAttributes, options));

    obj.left -= obj.radius;
    obj.top -= obj.radius;
    return obj;
  };

  /**
   * @private
   */
  function isValidRadius(attributes) {
    return (('radius' in attributes) && (attributes.radius >= 0));
  }
  /* _FROM_SVG_END_ */

  /**
   * Returns {@link fabric.DragPoint} instance from an object representation
   * @static
   * @memberOf fabric.DragPoint
   * @param {Object} object Object to create an instance from
   * @return {Object} Instance of fabric.DragPoint
   */
  fabric.DragPoint.fromObject = function(object) {
    return new fabric.DragPoint(object);
  };

})(typeof exports !== 'undefined' ? exports : this);
