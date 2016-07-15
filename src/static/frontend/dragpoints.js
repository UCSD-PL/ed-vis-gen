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
   * Circle class
   * @class fabric.Circle
   * @extends fabric.Object
   * @see {@link fabric.Circle#initialize} for constructor definition
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
    radius: 3,

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
    //lockMovementX: true,
    //lockMovementY: true,
    lockScalingX: true,
    lockScalingY: true,
    lockRotation: true,
    hasBorders: false,
    //hasControls: false,
    /**
     * Constructor
     * @param {Object} [options] Options object
     * @return {Object} thisArg
     */
    initialize: function(options) {
      options = options || { };

      this.callSuper('initialize', options);
      this.set('radius', 3);
      this.set('shapeName', options.shapeName || '');
      if (options.shape != null) {
        this.set('X', options.shape.left);
        this.set('Y', options.shape.top);
        this.set('DX', options.DX);
        this.set('DY', options.DY);
        this.set('left', options.shape.left + options.shape.width*options.DX);
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
     * @return {fabric.Circle} thisArg
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
        if (ctx.name === drag.shapeName) {
          drag.set({
            shape: ctx
          });
          drag.set({
            X: ctx.getLeft(),
            Y: ctx.getTop(),
            left: ctx.getLeft() + ctx.getWidth()*drag.get('DX'),
            top: ctx.getTop() + ctx.getHeight()*drag.get('DY')
          });
          /*
          ctx.on('modified', function() {
            drag.set({
              X: ctx.left,
              Y: ctx.top,
              left: ctx.left + ctx.width*drag.DX,
              top: ctx.top + ctx.height*drag.DY
            });*
       });*/
       console.log("OMG");
       console.log(drag);
       drag.bringToFront();
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
        X: this.get('X'), //optional
        Y: this.get('Y'), //optional
        DX: this.get('DX'), //optional
        DY: this.get('DY'), //optional
        left: this.get('X') + this.shape.get('width')*this.get('DX'),
        top: this.get('Y') + this.shape.get('height')*this.get('DY'),
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
     * @return {fabric.Circle} thisArg
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
   * Returns {@link fabric.Circle} instance from an SVG element
   * @static
   * @memberOf fabric.Circle
   * @param {SVGElement} element Element to parse
   * @param {Object} [options] Options object
   * @throws {Error} If value of `r` attribute is missing or invalid
   * @return {fabric.Circle} Instance of fabric.Circle
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
   * Returns {@link fabric.Circle} instance from an object representation
   * @static
   * @memberOf fabric.Circle
   * @param {Object} object Object to create an instance from
   * @return {Object} Instance of fabric.Circle
   */
  fabric.DragPoint.fromObject = function(object) {
    return new fabric.DragPoint(object);
  };

})(typeof exports !== 'undefined' ? exports : this);
