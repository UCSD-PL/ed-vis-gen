(function(global) {

  'use strict';

  var fabric = global.fabric || (global.fabric = { }),
      extend = fabric.util.object.extend,
      coordProps = { x1: 1, x2: 1, y1: 1, y2: 1 },
      supportsLineDash = fabric.StaticCanvas.supports('setLineDash');

  if (fabric.Spring) {
    fabric.warn('fabric.Spring is already defined');
    return;
  }

  /**
   * Spring class
   * @class fabric.Spring
   * @extends fabric.Object
   * @see {@link fabric.Spring#initialize} for constructor definition
   */
  fabric.Spring = fabric.util.createClass(fabric.Object, /** @lends fabric.Spring.prototype */ {

    /**
     * Type of an object
     * @type String
     * @default
     */
    type: 'Spring',

    /**
     * x value or first Spring edge
     * @type Number
     * @default
     */
    x1: 0,

    /**
     * y value or first Spring edge
     * @type Number
     * @default
     */
    y1: 0,

    /**
     * x value or second Spring edge
     * @type Number
     * @default
     */
    x2: 0,

    /**
     * y value or second Spring edge
     * @type Number
     * @default
     */
    y2: 0,

    /**
     * Constructor
     * @param {Array} [points] Array of points
     * @param {Object} [options] Options object
     * @return {fabric.Spring} thisArg
     */
    initialize: function(points, options) {
      options = options || { };

      if (!points) {
        points = [0, 0, 0, 0];
      }

      this.callSuper('initialize', options);

      this.set('x1', points[0]);
      this.set('y1', points[1]);
      this.set('x2', points[2]);
      this.set('y2', points[3]);

      this._setWidthHeight(options);
    },

    /**
     * @private
     * @param {Object} [options] Options
     */
    _setWidthHeight: function(options) {
      options || (options = { });

      this.width = Math.abs(this.x2 - this.x1);
      this.height = Math.abs(this.y2 - this.y1);

      this.left = 'left' in options
        ? options.left
        : this._getLeftToOriginX();

      this.top = 'top' in options
        ? options.top
        : this._getTopToOriginY();
    },

    /**
     * @private
     * @param {String} key
     * @param {Any} value
     */
    _set: function(key, value) {
      this.callSuper('_set', key, value);
      if (typeof coordProps[key] !== 'undefined') {
        this._setWidthHeight();
      }
      return this;
    },

    /**
     * @private
     * @return {Number} leftToOriginX Distance from left edge of canvas to originX of Spring.
     */
    _getLeftToOriginX: makeEdgeToOriginGetter(
      { // property names
        origin: 'originX',
        axis1: 'x1',
        axis2: 'x2',
        dimension: 'width'
      },
      { // possible values of origin
        nearest: 'left',
        center: 'center',
        farthest: 'right'
      }
    ),

    /**
     * @private
     * @return {Number} topToOriginY Distance from top edge of canvas to originY of Spring.
     */
    _getTopToOriginY: makeEdgeToOriginGetter(
      { // property names
        origin: 'originY',
        axis1: 'y1',
        axis2: 'y2',
        dimension: 'height'
      },
      { // possible values of origin
        nearest: 'top',
        center: 'center',
        farthest: 'bottom'
      }
    ),

    /**
     * @private
     * @param {CanvasRenderingContext2D} ctx Context to render on
     */
    _render: function(ctx, noTransform) {
      ctx.beginPath();

      if (noTransform) {
        //  Spring coords are distances from left-top of canvas to origin of Spring.
        //  To render Spring in a path-group, we need to translate them to
        //  distances from center of path-group to center of Spring.
        var cp = this.getCenterPoint();
        ctx.translate(
          cp.x - this.strokeWidth / 2,
          cp.y - this.strokeWidth / 2
        );
      }

      if (!this.strokeDashArray || this.strokeDashArray && supportsSpringDash) {
        // move from center (of virtual box) to its left/top corner
        // we can't assume x1, y1 is top left and x2, y2 is bottom right
        var p = this.calcLinePoints();
        var x1 = p.x1,
            y1 = p.y1,
            x2 = p.x2,
            y2 = p.y2;
        var dx = x2 - x1;
        var dy = y2 - y1;
        var A = 10;
        var tau = Math.PI/50;
        var deltay= -A * Math.cos(0);
        var offset = 0;
        var iMAX = 1000;
        var dist = 10;
        var theta = Math.atan2(dy,dx);
        var dx2 = dist * Math.cos(theta);
        var dy2 = dist * Math.sin(theta);

        
        ctx.moveTo(x1, y1);
        ctx.lineTo(x1+dx2, y1+dy2);
        for (let i = 100; i < iMAX - 100; ++i){
          var p1 = x1 + i * (dx - dx2) / iMAX + A * Math.sin(tau * i + offset);
          var q1 = y1 + i * (dy - dy2) / iMAX + A * Math.cos(tau * i + offset);
          ctx.lineTo(p1, q1 + deltay);
        }


        ctx.lineTo(x2, y2);
      }

      ctx.lineWidth = this.strokeWidth;

      // TODO: test this
      // make sure setting "fill" changes color of a Spring
      // (by copying fillStyle to strokeStyle, since Spring is stroked, not filled)
      var origStrokeStyle = ctx.strokeStyle;
      ctx.strokeStyle = this.stroke || ctx.fillStyle;
      this.stroke && this._renderStroke(ctx);
      ctx.strokeStyle = origStrokeStyle;
    },

    /**
     * @private
     * @param {CanvasRenderingContext2D} ctx Context to render on
     */


    /**
     * Returns object representation of an instance
     * @methd toObject
     * @param {Array} [propertiesToInclude] Any properties that you might want to additionally include in the output
     * @return {Object} object representation of an instance
     */
    toObject: function(propertiesToInclude) {
      return extend(this.callSuper('toObject', propertiesToInclude), this.calcLinePoints());
    },

    /**
     * Recalculates Spring points given width and height
     * @private
     */
    calcLinePoints: function() {
      var xMult = this.x1 <= this.x2 ? -1 : 1,
          yMult = this.y1 <= this.y2 ? -1 : 1,
          x1 = (xMult * this.width * 0.5),
          y1 = (yMult * this.height * 0.5),
          x2 = (xMult * this.width * -0.5),
          y2 = (yMult * this.height * -0.5);

      return {
        x1: x1,
        x2: x2,
        y1: y1,
        y2: y2
      };
    },

    /* _TO_SVG_START_ */
    /**
     * Returns SVG representation of an instance
     * @param {Function} [reviver] Method for further parsing of svg representation.
     * @return {String} svg representation of an instance
     */
    toSVG: function(reviver) {
      var markup = this._createBaseSVGMarkup(),
          p = { x1: this.x1, x2: this.x2, y1: this.y1, y2: this.y2 };

      if (!(this.group && this.group.type === 'path-group')) {
        p = this.calcLinePoints();
      }
      markup.push(
        '<Spring ',
          'x1="', p.x1,
          '" y1="', p.y1,
          '" x2="', p.x2,
          '" y2="', p.y2,
          '" style="', this.getSvgStyles(),
          '" transform="', this.getSvgTransform(),
          this.getSvgTransformMatrix(),
        '"/>\n'
      );

      return reviver ? reviver(markup.join('')) : markup.join('');
    },
    /* _TO_SVG_END_ */

    /**
     * Returns complexity of an instance
     * @return {Number} complexity
     */
    complexity: function() {
      return 1;
    }
  });

  /* _FROM_SVG_START_ */
  /**
   * List of attribute names to account for when parsing SVG element (used by {@link fabric.Spring.fromElement})
   * @static
   * @memberOf fabric.Spring
   * @see http://www.w3.org/TR/SVG/shapes.html#SpringElement
   */
  fabric.Spring.ATTRIBUTE_NAMES = fabric.SHARED_ATTRIBUTES.concat('x1 y1 x2 y2'.split(' '));

  /**
   * Returns fabric.Spring instance from an SVG element
   * @static
   * @memberOf fabric.Spring
   * @param {SVGElement} element Element to parse
   * @param {Object} [options] Options object
   * @return {fabric.Spring} instance of fabric.Spring
   */
  fabric.Spring.fromElement = function(element, options) {
    var parsedAttributes = fabric.parseAttributes(element, fabric.Spring.ATTRIBUTE_NAMES),
        points = [
          parsedAttributes.x1 || 0,
          parsedAttributes.y1 || 0,
          parsedAttributes.x2 || 0,
          parsedAttributes.y2 || 0
        ];
    return new fabric.Spring(points, extend(parsedAttributes, options));
  };
  /* _FROM_SVG_END_ */

  /**
   * Returns fabric.Spring instance from an object representation
   * @static
   * @memberOf fabric.Spring
   * @param {Object} object Object to create an instance from
   * @return {fabric.Spring} instance of fabric.Spring
   */
  fabric.Spring.fromObject = function(object) {
    var points = [object.x1, object.y1, object.x2, object.y2];
    return new fabric.Spring(points, object);
  };

  /**
   * Produces a function that calculates distance from canvas edge to Spring origin.
   */
  function makeEdgeToOriginGetter(propertyNames, originValues) {
    var origin = propertyNames.origin,
        axis1 = propertyNames.axis1,
        axis2 = propertyNames.axis2,
        dimension = propertyNames.dimension,
        nearest = originValues.nearest,
        center = originValues.center,
        farthest = originValues.farthest;

    return function() {
      switch (this.get(origin)) {
      case nearest:
        return Math.min(this.get(axis1), this.get(axis2));
      case center:
        return Math.min(this.get(axis1), this.get(axis2)) + (0.5 * this.get(dimension));
      case farthest:
        return Math.max(this.get(axis1), this.get(axis2));
      }
    };

  }

})(typeof exports !== 'undefined' ? exports : this);