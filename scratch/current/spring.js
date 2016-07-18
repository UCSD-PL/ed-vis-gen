(function(global) {
  'use strict';
  var fabric = global.fabric || (global.fabric = { });
  if (fabric.Spring) {
    fabric.warn('fabric.Spring is already defined');
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
    type: 'Spring',
    x1:0,
    y1:0,
    x2:0,
    y2:0,
    /**
     * Constructor
     * @param {Object} [options] Options object
     * @return {Object} thisArg
     */
    initialize: function(points, options) {
      options = options || { };
      this.callSuper('initialize', options);
      this.set('width', options.width || 100);
      this.set('height', options.height || 100);
      this.set('x1', points[0]);
      this.set('y1', points[1]);
      this.set('x2', points[2]);
      this.set('y2', points[3]);
    },
    /**
     * @private
     * @param {CanvasRenderingContext2D} ctx Context to render on
     */
    _render: function(ctx) {
      var x1 = this.x1;
      var y1 = this.y1;
      var x2 = this.x2;
      var y2 = this.y2;
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
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x1+dx2, y1+dy2);
      for (let i = 100; i < iMAX - 100; ++i){
        var p = x1 + i * (dx - dx2) / iMAX + A * Math.sin(tau * i + offset);
        var q = y1 + i * (dy - dy2) / iMAX + A * Math.cos(tau * i + offset);
        ctx.lineTo(p, q + deltay);
      }
      ctx.lineTo(x2, y2);
      ctx.closePath();
      this._renderStroke(ctx);
    },
    /**
     * @private
     * @param {CanvasRenderingContext2D} ctx Context to render on
    _renderDashedStroke: function(ctx) {
      var widthBy2 = this.width / 2,
          heightBy2 = this.height / 2;
      ctx.beginPath();
      fabric.util.drawDashedLine(ctx, -widthBy2, heightBy2, 0, -heightBy2, this.strokeDashArray);
      fabric.util.drawDashedLine(ctx, 0, -heightBy2, widthBy2, heightBy2, this.strokeDashArray);
      fabric.util.drawDashedLine(ctx, widthBy2, heightBy2, -widthBy2, heightBy2, this.strokeDashArray);
      ctx.closePath();
    },
    /* _TO_SVG_START_ */
    /**
     * Returns SVG representation of an instance
     * @param {Function} [reviver] Method for further parsing of svg representation.
     * @return {String} svg representation of an instance
    toSVG: function(reviver) {
      var markup = this._createBaseSVGMarkup(),
          widthBy2 = this.width / 2,
          heightBy2 = this.height / 2,
          points = [
            -widthBy2 + ' ' + heightBy2,
            '0 ' + -heightBy2,
            widthBy2 + ' ' + heightBy2
          ]
          .join(',');
      markup.push(
        '<polygon ',
          'points="', points,
          '" style="', this.getSvgStyles(),
          '" transform="', this.getSvgTransform(),
        '"/>'
      );
      return reviver ? reviver(markup.join('')) : markup.join('');
    },
    /* _TO_SVG_END_ */
    /**
     * Returns complexity of an instance
     * @return {Number} complexity of this instance
     */
    complexity: function() {
      return 1;
    }
  });
  /**
   * Returns fabric.Spring instance from an object representation
   * @static
   * @memberOf fabric.Spring
   * @param {Object} object Object to create an instance from
   * @return {Object} instance of Canvas.Spring
   */
  fabric.Spring.fromObject = function(object) {
    return new fabric.Spring(object);
  };
})(typeof exports !== 'undefined' ? exports : this);
