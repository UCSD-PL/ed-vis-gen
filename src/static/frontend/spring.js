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
    type: 'spring',

    /**
     * Constructor
     * @param {Object} [options] Options object
     * @return {Object} thisArg
     */
    initialize: function(options) {
      options = options || { };

      this.callSuper('initialize', options);

      this.set('width', options.width || 100)
      //height is equvalent to dy
          .set('height', options.height || 100)
     // dx is input as attribute
          .set('dx', options.dx || 0);
    },

    /**
     * Render function of spring object
     * @private
     * @param {CanvasRenderingContext2D} ctx Context to render on
     */
    _render: function(ctx) {
      var widthBy2 = this.width / 2,
          heightBy2 = this.height / 2;

      ctx.beginPath();


      //dx is an input attribute
      var dx = this.dx;
      //height is equvalent to dy
      var dy = this.height;

      // intuition: draw a circle and translate over time.
      // circle drawing parameters
      var A = 10;
      var tau = Math.PI/50;
      var deltay = -A * Math.cos(0);
      var offset = 0;
      var iMAX = 1000;
      var dist = 10;
      var theta = Math.atan2(dy,dx);
      var dx2 = dist * Math.cos(theta);
      var dy2 = dist * Math.sin(theta);
      // The top of spring
      ctx.moveTo(0, -heightBy2);
      // Translate the cirle
      ctx.lineTo(0+dx2, (-heightBy2)+dy2);
      // i is the amount of translation
      for (let i = 100; i < iMAX - 100; ++i){
        var p1 = 0 + i * (dx - dx2) / iMAX + A * Math.sin(tau * i + offset);
        var q1 = (-heightBy2) + i * (dy - dy2) / iMAX + A * Math.cos(tau * i + offset);
        ctx.lineTo(p1, q1 + deltay);
      }
      // The bottom of spring
      ctx.lineTo(0, heightBy2);
      //Render the stroke
      ctx.strokeStyle = this.stroke || ctx.fillStyle;
      this.stroke && this._renderStroke(ctx);


    },



    /* _TO_SVG_START_ */
    /**
     * Returns SVG representation of an instance
     * @param {Function} [reviver] Method for further parsing of svg representation.
     * @return {String} svg representation of an instance
     */
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
