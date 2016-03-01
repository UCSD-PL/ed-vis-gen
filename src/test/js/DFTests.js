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
  // test simple cycles
  (function() {
    var msg = 'should evaluate trickier cycles';
    var decls = {x: ["y-1", 1], y: ["z+2", 2], z: ["x-1", 0]};
    var suggests = {x: 2};
    var output = {x: 2, y: 3, z: 1};
    evalStmts(msg, decls, suggests, output);
  })();


});
