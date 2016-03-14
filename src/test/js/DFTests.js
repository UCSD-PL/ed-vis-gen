'use strict';

// unit tests for javascript, run with mocha.

var assert = require('assert');
var dfparser = require('../../frontend/eddiflow/out/dfparser.js');
var ef = require('../../frontend/eddiflow/out/dfnetwork.js');

describe('dataflow parser', function(){
  it('should build', function(){
    assert(dfparser.parse);
  });

  it('should parse primitives (ints/identifiers)', function() {
    var makeInt = function () {
      return Math.floor(Math.random() * Math.pow(2, 30));
    };

    var nextStr;
    var nextRes;
    var parseResult;
    for (var i = 0; i < 1000; ++i) {
      nextRes = makeInt();
      nextStr = nextRes.toString();
      parseResult = dfparser.parse(nextStr);
      assert(parseResult.body == nextRes);
    }

    var makeID = function () {
      return '_' + Math.random().toString(36).substr(2, 9);
    };

    for (var i = 0; i < 1000; ++i) {
      nextRes = makeID();
      parseResult = dfparser.parse(nextRes);
      assert(parseResult.body == nextRes);
    }
  });


});

describe('dataflow engine', function() {
  // helper to evaluate a series of decls and suggestions.
  // description: string
  // decls: {name: [body, value]}
  // suggests: {name: value}
  // results: {name: value}
  var evalStmts = function(description, decls, suggests, results) {
    var network = new ef(dfparser);

    for (var vrbl in decls){
      network.addDecl(vrbl, decls[vrbl][0], decls[vrbl][1]);
    }

    network.finalizeDecls();

    for (var vrbl in suggests) {
      network.suggestValue(vrbl, suggests[vrbl]);
    }

    network.resolve();

    it(description, function() {
      for (var vrbl in results) {
        //console.log('checking ' + results[vrbl].toString() + " vs " + network.getValue(vrbl));
        assert(results[vrbl] == network.getValue(vrbl));
      }
    });
  };

  // test simple DAGS
  (function() {
    var msg = 'should evaluate DAGS';
    var decls = {x: ["1", 1], y: ["x+1", 2]};
    var suggests = {x: 2};
    var output = {x: 2, y: 3};
    evalStmts(msg, decls, suggests, output);
  })();

  // test trickier dags
  (function() {
    var msg = 'should evaluate DAGS';
    var decls = {x: ["1", 1], y: ["x+1", 2], z: ["y + 2", 4]};
    var suggests = {x: 2};
    var output = {x: 2, y: 3, z: 5};
    evalStmts(msg, decls, suggests, output);
  })();

  // test simple cycles
  (function() {
    var msg = 'should evaluate cycles';
    var decls = {x: ["y-1", 1], y: ["x+1", 2]};
    var suggests = {x: 2};
    var output = {x: 2, y: 3};
    evalStmts(msg, decls, suggests, output);
  })();
  // test trickier cycles
  (function() {
    var msg = 'should evaluate trickier cycles';
    var decls = {x: ["y-1", 1], y: ["z+2", 2], z: ["x-1", 0]};
    var suggests = {x: 2};
    var output = {x: 2, y: 3, z: 1};
    evalStmts(msg, decls, suggests, output);
  })();

  (function() {
    var msg = 'should evaluate multiple decls';
    var decls = {x: ["y-1", 1], y: ["z+2", 2], z: ["x-1", 0], y: ['x+1', 2]};
    var suggests = {x: 2};
    var output = {x: 2, y: 3, z: 1};
    evalStmts(msg, decls, suggests, output);
  })();


  // // slope equation testing
  (function() {
    var msg = 'should evaluate trickier cycles';
    var decls = {
      // line: y = 2x - 25. points: (25, 25), (50, 75), (125, 225)
      // x coordinates. x0 and x1 are fixed, x2 is floating.
      x0: ["25", 25], x1: ["50", 50], x2: ["dx2 + x0", 125],
      y0: ["y1 - dy1", 25], y0: ["y2-dy2", 25],
      // y coordinates. y1 is fixed and y2 is floating, but only in one equation.
      y1: ['75', 75], y2: ['dy2 + y0', 225],
      // slope calculations, offsets from initial point.
      dy2: ['200', 200], dx2: ['x2 - x0', 100],
      dx2: ['dx1 * dy2 / dy1', 100],
      dy1: ['y1 - y0', 50], dy1: ['dy2 * dx1/dx2', 50],
      dx1: ['25', 25]
    };
    // adjustment: change slope to 1
    // x0* ==> 25
    // x1* ==> 50
    // x2  ==> 175
    // y0  ==> 50
    // y1* ==> 75
    // y2  ==> 150
    // dx1*==> 25
    // dx2 ==> 2*dx2 (200)
    // dy1 ==> dy1/2 (25)
    // dy2*==> 100

    // just suggest x2 and y2!!!
    var suggests = {x2: 175, y2: 150};
    var output = {
      x0: 25, x1: 50, x2: 125,
      y0: 50, y1: 75, y2: 150,
      dx1: 25, dx2: 75,
      dy1: 25, dy2: 75
    };
    evalStmts(msg, decls, suggests, output);
  })();



});
