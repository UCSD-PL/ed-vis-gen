(function(global) {

  'use strict';

  var fabric = global.fabric || (global.fabric = { }),
      extend = fabric.util.object.extend,
      coordProps = { x1: 1, x2: 1, y1: 1, y2: 1 },
      supportsLineDash = fabric.StaticCanvas.supports('setLineDash');

  if (fabric.Line) {
    fabric.warn('fabric.Line is already defined');
    return;
  }

  /**
   * Spring class
   * @class fabric.Spring
   * @extends fabric.Object
   * @return {fabric.Spring} thisArg
   * @see {@link fabric.Spring#initialize} for constructor definition
   */
  fabric.Spring = fabric.util.createClass(fabric.Object, /** @lends fabric.Spring.prototype */ {

    /**
     * Type of an object
     * @type String
     * @default
     */
    type: 'spring',

    /**
    * x value or first line edge
    * @type Number
    * @default
    */
    x1: 0,

    /**
    * y value or first line edge
    * @type Number
    * @default
    */
    y1: 0,

    /**
    * x value or second line edge
    * @type Number
    * @default
    */
    x2: 0,

    /**
    * y value or second line edge
    * @type Number
    * @default
    */
    y2: 0,



    /**
     * Constructor
     * @param {Array} [points] Array of points (start and end points coord)
     * @param {Object} [options] Options object
     * @return {fabric.Spring} thisArg
     */
    initialize: function(points, options) {
      options = options || { };

      this.callSuper('initialize', options);

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
         * @return {Number} leftToOriginX Distance from left edge of canvas to originX of Line.
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
         * @return {Number} topToOriginY Distance from top edge of canvas to originY of Line.
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

      //constant variables
      var A = 10;
      var tau = Math.PI/50;
      var deltay = - A * Math.cos(0);
      var offset  = 0;
      var iMAX = 1000;
      var dist = 10;

      //coords variables
      var x = this.x1;
      var y = this.y1
      var dx = this.width;
      var dy = this.height;
      var theta = Math.atan2(dy,dx);
      var dx2 = dist * Math.cos(theta);
      var dy2 = dist * Math.sin(theta);

      ctx.lineTo(this.x1, this.y1);
      ctx.lineTo(this.x1+ dx2, this.y2+ dy2);

      // i == amount of translation
      for (let i = 100; i < iMAX - 100; ++i) {
        let p = x + i * (dx-dx2) / iMAX + A * Math.sin(tau * i * offset);
        let q = y + i * (dy-dy2) / iMAX + A * Math.cos(tau * i * offset);
        ctx.lineTo(p, q + deltay);
      }

      ctx.lineTo(this.x2, this.y2);
      ctx.stroke();
      ctx.restore();

      var widthBy2 = this.width / 2,
          heightBy2 = this.height / 2;


      ctx.beginPath();
      ctx.moveTo(-widthBy2, heightBy2);
      ctx.lineTo(0, -heightBy2);
      ctx.lineTo(widthBy2, heightBy2);
      ctx.closePath();

      this._renderFill(ctx);
      this._renderStroke(ctx);
    }
  });

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

})
/**
});
*/
