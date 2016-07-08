(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * Parts Copyright (C) 2011-2012, Alex Russell (slightlyoff@chromium.org)
 * Parts Copyright (C) Copyright (C) 1998-2000 Greg J. Badros
 *
 * Use of this source code is governed by http://www.apache.org/licenses/LICENSE-2.0
 *
 * This is a compiled version of Cassowary/JS. For source versions or to
 * contribute, see the github project:
 *
 *  https://github.com/slightlyoff/cassowary-js-refactor
 *
 */

(function() {
!function(a){"use strict";var b="undefined"!=typeof a.HTMLElement,c=function(a){for(var b=null;a&&a!=Object.prototype;){if(a.tagName){b=a.tagName;break}a=a.prototype}return b||"div"},d=1e-8,e={},f=function(a,b){if(a&&b){if("function"==typeof a[b])return a[b];var c=a.prototype;if(c&&"function"==typeof c[b])return c[b];if(c!==Object.prototype&&c!==Function.prototype)return"function"==typeof a.__super__?f(a.__super__,b):void 0}},g=!1;try{var h=new Map;h.set("foo","bar");var i=h.values();i.next(),h.forEach(function(){});var k=new Map(h);if(k.get("foo")!=h.get("foo"))throw"ctor fail";g=!0}catch(l){}var m=a.c=function(){return m._api?m._api.apply(this,arguments):void 0};m._functionalMap=g,m.GEQ=1,m.LEQ=2;var n=b?function(b,d,e){if(d&&d.prototype instanceof a.HTMLElement){var g=b,h=c(e),i=function(a){return a.__proto__=e,g.apply(a,arguments),e.created&&a.created(),e.decorate&&a.decorate(),a};m.extend(e,{upgrade:i}),b=function(){return i(a.document.createElement(h))},b.prototype=e,m.extend(b,{ctor:g})}return b}:function(a){return a};m.inherit=function(a){var b=null,c=null;a["extends"]&&(c=a["extends"],delete a["extends"]),a.initialize&&(b=a.initialize,delete a.initialize);var d=b||function(){};Object.defineProperty(d,"__super__",{value:c?c:Object,enumerable:!1,configurable:!0,writable:!1}),a._t&&(e[a._t]=d);var f=d.prototype=Object.create(c?c.prototype:Object.prototype);return m.extend(f,a),n(d,c,f,a)},m.own=function(b,c,d){return Object.getOwnPropertyNames(b).forEach(c,d||a),b},m.extend=function(a,b){return m.own(b,function(c){var d=Object.getOwnPropertyDescriptor(b,c);if("function"==typeof d.get||"function"==typeof d.set)Object.defineProperty(a,c,d);else if("function"==typeof d.value||"_"===c.charAt(0))d.writable=!0,d.configurable=!0,d.enumerable=!1,Object.defineProperty(a,c,d);else try{a[c]=b[c]}catch(e){}}),a},m.assert=function(a,b){if(!a)throw new m.InternalError("Assertion failed: "+b)};var o=function(a){return"number"==typeof a?m.Expression.fromConstant(a):a instanceof m.Variable?m.Expression.fromVariable(a):a};m.plus=function(a,b){return a=o(a),b=o(b),a.plus(b)},m.minus=function(a,b){return a=o(a),b=o(b),a.minus(b)},m.times=function(a,b){return a=o(a),b=o(b),a.times(b)},m.divide=function(a,b){return a=o(a),b=o(b),a.divide(b)},m.approx=function(a,b){return a=+a,b=+b,a===b?!0:0==a?Math.abs(b)<d:0==b?Math.abs(a)<d:Math.abs(a-b)<Math.abs(a)*d};var p=1;m._inc=function(){return p++},m.parseJSON=function(a){return JSON.parse(a,function(a,b){if("object"!=typeof b||"string"!=typeof b._t)return b;var c=b._t,d=e[c];if(c&&d){var g=f(d,"fromJSON");if(g)return g(b,d)}return b})},"function"==typeof define&&define.amd?define(m):"object"==typeof module&&module.exports?module.exports=m:a.c=m}(this),function(a){"use strict";if(a._functionalMap)a.HashTable=a.inherit({initialize:function(b){this.hashCode=a._inc(),this._store=b instanceof a.HashTable?new Map(b._store):new Map},clone:function(){return new a.HashTable(this)},get:function(a){var b=this._store.get(a.hashCode);return void 0===b?null:b[1]},clear:function(){this._store.clear()},get size(){return this._store.size},set:function(a,b){return this._store.set(a.hashCode,[a,b])},has:function(a){return this._store.has(a.hashCode)},"delete":function(a){return this._store.delete(a.hashCode)},each:function(a,b){this._store.forEach(function(c){return a.call(b||null,c[0],c[1])},b)},escapingEach:function(a,b){if(this._store.size)for(var c,e,f=this._store.values(),e=f.next();!e.done;){if(c=a.call(b||null,e.value[0],e.value[1])){if(void 0!==c.retval)return c;if(c.brk)break}e=f.next()}},equals:function(b){if(b===this)return!0;if(!(b instanceof a.HashTable)||b._size!==this._size)return!1;for(var c in this._store.keys())if(void 0==b._store.get(c))return!1;return!0}});else{var b={},c=function(a,b){Object.keys(a).forEach(function(c){b[c]=a[c]})};a.HashTable=a.inherit({initialize:function(){this.size=0,this._store={},this._deleted=0},set:function(a,b){var c=a.hashCode;"undefined"==typeof this._store[c]&&this.size++,this._store[c]=[a,b]},get:function(a){if(!this.size)return null;a=a.hashCode;var b=this._store[a];return"undefined"!=typeof b?b[1]:null},clear:function(){this.size=0,this._store={}},_compact:function(){var a={};c(this._store,a),this._store=a},_compactThreshold:100,_perhapsCompact:function(){this._size>30||this._deleted>this._compactThreshold&&(this._compact(),this._deleted=0)},"delete":function(a){a=a.hashCode,this._store.hasOwnProperty(a)&&(this._deleted++,delete this._store[a],this.size>0&&this.size--)},each:function(a,b){if(this.size){this._perhapsCompact();var c=this._store;for(var d in this._store)this._store.hasOwnProperty(d)&&a.call(b||null,c[d][0],c[d][1])}},escapingEach:function(a,c){if(this.size){this._perhapsCompact();for(var d=this,e=this._store,f=b,g=Object.keys(e),h=0;h<g.length;h++)if(function(b){d._store.hasOwnProperty(b)&&(f=a.call(c||null,e[b][0],e[b][1]))}(g[h]),f){if(void 0!==f.retval)return f;if(f.brk)break}}},clone:function(){var b=new a.HashTable;return this.size&&(b.size=this.size,c(this._store,b._store)),b},equals:function(b){if(b===this)return!0;if(!(b instanceof a.HashTable)||b._size!==this._size)return!1;for(var c=Object.keys(this._store),d=0;d<c.length;d++){var e=c[d];if(this._store[e][0]!==b._store[e][0])return!1}return!0},toString:function(){var b="";return this.each(function(a,c){b+=a+" => "+c+"\n"}),b},toJSON:function(){return{_t:"c.HashTable"}},fromJSON:function(){var c=new a.HashTable;return c}})}}(this.c||module.parent.exports||{}),function(a){"use strict";a.HashSet=a._functionalMap?a.inherit({_t:"c.HashSet",initialize:function(b){this.hashCode=a._inc(),this._store=b instanceof a.HashSet?new Map(b._store):new Map},add:function(a){return this._store.set(a.hashCode,a)},has:function(a){return this._store.has(a.hashCode)},get size(){return this._store.size},clear:function(){this._store.clear()},values:function(){for(var a=[],b=this._store.values(),c=b.next();!c.done;)a.push(c.value),c=b.next();return a},first:function(){var a=this._store.values(),b=a.next();return b.done?null:b.value},"delete":function(a){this._store.delete(a.hashCode)},each:function(a,b){var c=this;this._store.forEach(function(d){return a.call(b||null,d,d,c)},b)},escapingEach:function(a,b){this.size&&this._store.forEach(a,b)},toString:function(){var a=this.size+" {",b=!0;return this.each(function(c){b?b=!1:a+=", ",a+=c}),a+="}\n"},toJSON:function(){var a=[];return this.each(function(b){a[a.length]=b.toJSON()}),{_t:"c.HashSet",data:a}},fromJSON:function(b){var c=new a.HashSet;return b.data&&(c.size=b.data.length,c._store=b.data),c}}):a.inherit({_t:"c.HashSet",initialize:function(){this._store=[],this.size=0,this.hashCode=a._inc()},add:function(a){var b=this._store;b.indexOf(a),-1==b.indexOf(a)&&(b[b.length]=a),this.size=b.length},values:function(){return this._store},first:function(){return this._store[0]},has:function(a){return-1!=this._store.indexOf(a)},"delete":function(a){var b=this._store.indexOf(a);return-1==b?null:(this._store.splice(b,1)[0],this.size=this._store.length,void 0)},clear:function(){this._store.length=0},each:function(a,b){this.size&&this._store.forEach(a,b)},escapingEach:function(a,b){this.size&&this._store.forEach(a,b)},toString:function(){var a=this.size+" {",b=!0;return this.each(function(c){b?b=!1:a+=", ",a+=c}),a+="}\n"},toJSON:function(){var a=[];return this.each(function(b){a[a.length]=b.toJSON()}),{_t:"c.HashSet",data:a}},fromJSON:function(b){var c=new a.HashSet;return b.data&&(c.size=b.data.length,c._store=b.data),c}})}(this.c||module.parent.exports||{}),function(a){"use strict";a.Error=a.inherit({initialize:function(a){a&&(this._description=a)},_name:"c.Error",_description:"An error has occured in Cassowary",set description(a){this._description=a},get description(){return"("+this._name+") "+this._description},get message(){return this.description},toString:function(){return this.description}});var b=function(b,c){return a.inherit({"extends":a.Error,initialize:function(){a.Error.apply(this,arguments)},_name:b||"",_description:c||""})};a.ConstraintNotFound=b("c.ConstraintNotFound","Tried to remove a constraint never added to the tableu"),a.InternalError=b("c.InternalError"),a.NonExpression=b("c.NonExpression","The resulting expression would be non"),a.NotEnoughStays=b("c.NotEnoughStays","There are not enough stays to give specific values to every variable"),a.RequiredFailure=b("c.RequiredFailure","A required constraint cannot be satisfied"),a.TooDifficult=b("c.TooDifficult","The constraints are too difficult to solve")}(this.c||module.parent.exports||{}),function(a){"use strict";var b=1e3;a.SymbolicWeight=a.inherit({_t:"c.SymbolicWeight",initialize:function(){this.value=0;for(var a=1,c=arguments.length-1;c>=0;--c)this.value+=arguments[c]*a,a*=b},toJSON:function(){return{_t:this._t,value:this.value}}})}(this.c||module.parent.exports||{}),function(a){a.Strength=a.inherit({initialize:function(b,c,d,e){this.name=b,this.symbolicWeight=c instanceof a.SymbolicWeight?c:new a.SymbolicWeight(c,d,e)},get required(){return this===a.Strength.required},toString:function(){return this.name+(this.required?"":":"+this.symbolicWeight)}}),a.Strength.required=new a.Strength("<Required>",1e3,1e3,1e3),a.Strength.strong=new a.Strength("strong",1,0,0),a.Strength.medium=new a.Strength("medium",0,1,0),a.Strength.weak=new a.Strength("weak",0,0,1)}(this.c||("undefined"!=typeof module?module.parent.exports.c:{})),function(a){"use strict";a.AbstractVariable=a.inherit({isDummy:!1,isExternal:!1,isPivotable:!1,isRestricted:!1,_init:function(b,c){this.hashCode=a._inc(),this.name=(c||"")+this.hashCode,b&&("undefined"!=typeof b.name&&(this.name=b.name),"undefined"!=typeof b.value&&(this.value=b.value),"undefined"!=typeof b.prefix&&(this._prefix=b.prefix))},_prefix:"",name:"",value:0,valueOf:function(){return this.value},toJSON:function(){var a={};return this._t&&(a._t=this._t),this.name&&(a.name=this.name),"undefined"!=typeof this.value&&(a.value=this.value),this._prefix&&(a._prefix=this._prefix),this._t&&(a._t=this._t),a},fromJSON:function(b,c){var d=new c;return a.extend(d,b),d},toString:function(){return this._prefix+"["+this.name+":"+this.value+"]"}}),a.Variable=a.inherit({_t:"c.Variable","extends":a.AbstractVariable,initialize:function(b){this._init(b,"v");var c=a.Variable._map;c&&(c[this.name]=this)},isExternal:!0}),a.DummyVariable=a.inherit({_t:"c.DummyVariable","extends":a.AbstractVariable,initialize:function(a){this._init(a,"d")},isDummy:!0,isRestricted:!0,value:"dummy"}),a.ObjectiveVariable=a.inherit({_t:"c.ObjectiveVariable","extends":a.AbstractVariable,initialize:function(a){this._init(a,"o")},value:"obj"}),a.SlackVariable=a.inherit({_t:"c.SlackVariable","extends":a.AbstractVariable,initialize:function(a){this._init(a,"s")},isPivotable:!0,isRestricted:!0,value:"slack"})}(this.c||module.parent.exports||{}),function(a){"use strict";a.Point=a.inherit({initialize:function(b,c,d){if(b instanceof a.Variable)this._x=b;else{var e={value:b};d&&(e.name="x"+d),this._x=new a.Variable(e)}if(c instanceof a.Variable)this._y=c;else{var f={value:c};d&&(f.name="y"+d),this._y=new a.Variable(f)}},get x(){return this._x},set x(b){b instanceof a.Variable?this._x=b:this._x.value=b},get y(){return this._y},set y(b){b instanceof a.Variable?this._y=b:this._y.value=b},toString:function(){return"("+this.x+", "+this.y+")"}})}(this.c||module.parent.exports||{}),function(a){"use strict";var b=function(a,b){return"number"==typeof a?a:b};a.Expression=a.inherit({initialize:function(c,d,e){this.constant=b(e,0),this.terms=new a.HashTable,this.externalVariables=new a.HashSet,Object.defineProperty(this,"solver",{enumerable:!1,configurable:!0,writable:!0,value:null}),c instanceof a.AbstractVariable?(d=b(d,1),this.setVariable(c,d)):"number"==typeof c&&(isNaN(c)?console.trace():this.constant=c)},initializeFromHash:function(a,b){return this.constant=a,this.terms=b.clone(),this},multiplyMe:function(a){this.constant*=a;var b=this.terms;return b.each(function(c,d){b.set(c,d*a)}),this},clone:function(){var b=a.Expression.empty();return b.initializeFromHash(this.constant,this.terms),b.solver=this.solver,b},times:function(b){if("number"==typeof b)return this.clone().multiplyMe(b);if(this.isConstant)return b.times(this.constant);if(b.isConstant)return this.times(b.constant);throw new a.NonExpression},plus:function(b){return b instanceof a.Expression?this.clone().addExpression(b,1):b instanceof a.Variable?this.clone().addVariable(b,1):void 0},minus:function(b){return b instanceof a.Expression?this.clone().addExpression(b,-1):b instanceof a.Variable?this.clone().addVariable(b,-1):void 0},divide:function(b){if("number"==typeof b){if(a.approx(b,0))throw new a.NonExpression;return this.times(1/b)}if(b instanceof a.Expression){if(!b.isConstant)throw new a.NonExpression;return this.times(1/b.constant)}},addExpression:function(c,d,e){return c instanceof a.AbstractVariable&&(c=a.Expression.fromVariable(c)),d=b(d,1),this.constant+=d*c.constant,c.terms.each(function(a,b){this.addVariable(a,b*d,e),this._updateIfExternal(a)},this),this},addVariable:function(b,c,d){null==c&&(c=1);var e=this.terms.get(b);if(e){var f=e+c;0==f||a.approx(f,0)?(this.solver&&this.solver.noteRemovedVariable(b,d),this.terms.delete(b)):this.setVariable(b,f)}else a.approx(c,0)||(this.setVariable(b,c),this.solver&&this.solver.noteAddedVariable(b,d));return this},_updateIfExternal:function(a){a.isExternal&&(this.externalVariables.add(a),this.solver&&this.solver._noteUpdatedExternal(a))},setVariable:function(a,b){return this.terms.set(a,b),this._updateIfExternal(a),this},anyPivotableVariable:function(){if(this.isConstant)throw new a.InternalError("anyPivotableVariable called on a constant");var b=this.terms.escapingEach(function(a){return a.isPivotable?{retval:a}:void 0});return b&&void 0!==b.retval?b.retval:null},substituteOut:function(b,c,d){var e=this.solver;if(!e)throw new a.InternalError("Expressions::substituteOut called without a solver");var f=this.setVariable.bind(this),g=this.terms,h=g.get(b);g.delete(b),this.constant+=h*c.constant,c.terms.each(function(b,c){var i=g.get(b);if(i){var j=i+h*c;a.approx(j,0)?(e.noteRemovedVariable(b,d),g.delete(b)):f(b,j)}else f(b,h*c),e&&e.noteAddedVariable(b,d)})},changeSubject:function(a,b){this.setVariable(a,this.newSubject(b))},newSubject:function(a){var b=1/this.terms.get(a);return this.terms.delete(a),this.multiplyMe(-b),b},coefficientFor:function(a){return this.terms.get(a)||0},get isConstant(){return 0==this.terms.size},toString:function(){var b="",c=!1;if(!a.approx(this.constant,0)||this.isConstant){if(b+=this.constant,this.isConstant)return b;c=!0}return this.terms.each(function(a,d){c&&(b+=" + "),b+=d+"*"+a,c=!0}),b},equals:function(b){return b===this?!0:b instanceof a.Expression&&b.constant===this.constant&&b.terms.equals(this.terms)},Plus:function(a,b){return a.plus(b)},Minus:function(a,b){return a.minus(b)},Times:function(a,b){return a.times(b)},Divide:function(a,b){return a.divide(b)}}),a.Expression.empty=function(b){var c=new a.Expression(void 0,1,0);return c.solver=b,c},a.Expression.fromConstant=function(b,c){var d=new a.Expression(b);return d.solver=c,d},a.Expression.fromValue=function(b,c){b=+b;var d=new a.Expression(void 0,b,0);return d.solver=c,d},a.Expression.fromVariable=function(b,c){var d=new a.Expression(b,1,0);return d.solver=c,d}}(this.c||module.parent.exports||{}),function(a){"use strict";a.AbstractConstraint=a.inherit({initialize:function(b,c){this.hashCode=a._inc(),this.strength=b||a.Strength.required,this.weight=c||1},isEdit:!1,isInequality:!1,isStay:!1,get required(){return this.strength===a.Strength.required},toString:function(){return this.strength+" {"+this.weight+"} ("+this.expression+")"}});var b=a.AbstractConstraint.prototype.toString,c=function(b,c,d){a.AbstractConstraint.call(this,c||a.Strength.strong,d),this.variable=b,this.expression=new a.Expression(b,-1,b.value)};a.EditConstraint=a.inherit({"extends":a.AbstractConstraint,initialize:function(){c.apply(this,arguments)},isEdit:!0,toString:function(){return"edit:"+b.call(this)}}),a.StayConstraint=a.inherit({"extends":a.AbstractConstraint,initialize:function(){c.apply(this,arguments)},isStay:!0,toString:function(){return"stay:"+b.call(this)}});var d=a.Constraint=a.inherit({"extends":a.AbstractConstraint,initialize:function(b,c,d){a.AbstractConstraint.call(this,c,d),this.expression=b}});a.Inequality=a.inherit({"extends":a.Constraint,_cloneOrNewCle:function(b){return b.clone?b.clone():new a.Expression(b)},initialize:function(b,c,e,f,g){var h=b instanceof a.Expression,i=e instanceof a.Expression,j=b instanceof a.AbstractVariable,k=e instanceof a.AbstractVariable,l="number"==typeof b,m="number"==typeof e;if((h||l)&&k){var n=b,o=c,p=e,q=f,r=g;if(d.call(this,this._cloneOrNewCle(n),q,r),o==a.LEQ)this.expression.multiplyMe(-1),this.expression.addVariable(p);else{if(o!=a.GEQ)throw new a.InternalError("Invalid operator in c.Inequality constructor");this.expression.addVariable(p,-1)}}else if(j&&(i||m)){var n=e,o=c,p=b,q=f,r=g;if(d.call(this,this._cloneOrNewCle(n),q,r),o==a.GEQ)this.expression.multiplyMe(-1),this.expression.addVariable(p);else{if(o!=a.LEQ)throw new a.InternalError("Invalid operator in c.Inequality constructor");this.expression.addVariable(p,-1)}}else{if(h&&m){var s=b,o=c,t=e,q=f,r=g;if(d.call(this,this._cloneOrNewCle(s),q,r),o==a.LEQ)this.expression.multiplyMe(-1),this.expression.addExpression(this._cloneOrNewCle(t));else{if(o!=a.GEQ)throw new a.InternalError("Invalid operator in c.Inequality constructor");this.expression.addExpression(this._cloneOrNewCle(t),-1)}return this}if(l&&i){var s=e,o=c,t=b,q=f,r=g;if(d.call(this,this._cloneOrNewCle(s),q,r),o==a.GEQ)this.expression.multiplyMe(-1),this.expression.addExpression(this._cloneOrNewCle(t));else{if(o!=a.LEQ)throw new a.InternalError("Invalid operator in c.Inequality constructor");this.expression.addExpression(this._cloneOrNewCle(t),-1)}return this}if(h&&i){var s=b,o=c,t=e,q=f,r=g;if(d.call(this,this._cloneOrNewCle(t),q,r),o==a.GEQ)this.expression.multiplyMe(-1),this.expression.addExpression(this._cloneOrNewCle(s));else{if(o!=a.LEQ)throw new a.InternalError("Invalid operator in c.Inequality constructor");this.expression.addExpression(this._cloneOrNewCle(s),-1)}}else{if(h)return d.call(this,b,c,e);if(c==a.GEQ)d.call(this,new a.Expression(e),f,g),this.expression.multiplyMe(-1),this.expression.addVariable(b);else{if(c!=a.LEQ)throw new a.InternalError("Invalid operator in c.Inequality constructor");d.call(this,new a.Expression(e),f,g),this.expression.addVariable(b,-1)}}}},isInequality:!0,toString:function(){return d.prototype.toString.call(this)+" >= 0) id: "+this.hashCode}}),a.Equation=a.inherit({"extends":a.Constraint,initialize:function(b,c,e,f){if(b instanceof a.Expression&&!c||c instanceof a.Strength)d.call(this,b,c,e);else if(b instanceof a.AbstractVariable&&c instanceof a.Expression){var g=b,h=c,i=e,j=f;d.call(this,h.clone(),i,j),this.expression.addVariable(g,-1)}else if(b instanceof a.AbstractVariable&&"number"==typeof c){var g=b,k=c,i=e,j=f;d.call(this,new a.Expression(k),i,j),this.expression.addVariable(g,-1)}else if(b instanceof a.Expression&&c instanceof a.AbstractVariable){var h=b,g=c,i=e,j=f;d.call(this,h.clone(),i,j),this.expression.addVariable(g,-1)}else{if(!(b instanceof a.Expression||b instanceof a.AbstractVariable||"number"==typeof b)||!(c instanceof a.Expression||c instanceof a.AbstractVariable||"number"==typeof c))throw"Bad initializer to c.Equation";b=b instanceof a.Expression?b.clone():new a.Expression(b),c=c instanceof a.Expression?c.clone():new a.Expression(c),d.call(this,b,e,f),this.expression.addExpression(c,-1)}a.assert(this.strength instanceof a.Strength,"_strength not set")},toString:function(){return d.prototype.toString.call(this)+" = 0)"}})}(this.c||module.parent.exports||{}),function(a){"use strict";a.EditInfo=a.inherit({initialize:function(a,b,c,d,e){this.constraint=a,this.editPlus=b,this.editMinus=c,this.prevEditConstant=d,this.index=e},toString:function(){return"<cn="+this.constraint+", ep="+this.editPlus+", em="+this.editMinus+", pec="+this.prevEditConstant+", index="+this.index+">"}})}(this.c||module.parent.exports||{}),function(a){"use strict";a.Tableau=a.inherit({initialize:function(){this.columns=new a.HashTable,this.rows=new a.HashTable,this._infeasibleRows=new a.HashSet,this._externalRows=new a.HashTable},noteRemovedVariable:function(a,b){var c=this.columns.get(a);b&&c&&c.delete(b)},noteAddedVariable:function(a,b){b&&this.insertColVar(a,b)},getInternalInfo:function(){return"Tableau Information:\nRows: "+this.rows.size+" (= "+(this.rows.size-1)+" constraints)"+"\nColumns: "+this.columns.size+"\nInfeasible Rows: "+this._infeasibleRows.size+"\nExternal basic variables: "+this._externalRows.size},toString:function(){var a="Tableau:\n";return this.rows.each(function(b,c){a+=b+" <==> "+c+"\n"}),a+="\nColumns:\n",a+=this.columns,a+="\nInfeasible rows: ",a+=this._infeasibleRows,a+="External basic variables: ",a+=this._externalRows},insertColVar:function(b,c){var d=this.columns.get(b);d||(d=new a.HashSet,this.columns.set(b,d)),d.add(c)},addRow:function(a,b){this.rows.set(a,b),b.terms.each(function(b){this.insertColVar(b,a)},this),a.isExternal&&this._externalRows.set(a,b)},removeColumn:function(a){var b=this.columns.get(a);b&&(this.columns.delete(a),b.each(function(b){var c=this.rows.get(b);c.terms.delete(a)},this)),a.isExternal&&this._externalRows.delete(a)},removeRow:function(b){var c=this.rows.get(b);return a.assert(null!=c),c.terms.each(function(a){var d=this.columns.get(a);null!=d&&d.delete(b)},this),this._infeasibleRows.delete(b),b.isExternal&&this._externalRows.delete(b),this.rows.delete(b),c},substituteOut:function(a,b){var c=this.columns.get(a);c.each(function(c){var d=this.rows.get(c);d.substituteOut(a,b,c,this),c.isExternal&&this._updatedExternals.add(c),c.isRestricted&&d.constant<0&&this._infeasibleRows.add(c)},this),a.isExternal&&this._externalRows.set(a,b),this.columns.delete(a)},columnsHasKey:function(a){return!!this.columns.get(a)}})}(this.c||module.parent.exports||{}),function(a){var b=a.Tableau,c=b.prototype,d=1e-8,e=a.Strength.weak,f={eplus:null,eminus:null,prevEConstant:null};a.SimplexSolver=a.inherit({"extends":a.Tableau,initialize:function(){a.Tableau.call(this),this._stayMinusErrorVars=[],this._stayPlusErrorVars=[],this._errorVars=new a.HashTable,this._markerVars=new a.HashTable,this._objective=new a.ObjectiveVariable({name:"Z"}),this._editVarMap=new a.HashTable,this._editVarList=[],this._slackCounter=0,this._artificialCounter=0,this._dummyCounter=0,this.autoSolve=!0,this._needsSolving=!1,this._optimizeCount=0,this.rows.set(this._objective,a.Expression.empty(this)),this._editVariableStack=[0],this._updatedExternals=new a.HashSet},_noteUpdatedExternal:function(a){this._updatedExternals.add(a)},add:function(){for(var a=0;a<arguments.length;a++)this.addConstraint(arguments[a]);return this},addEditVar:function(b,c,d){var e=new a.EditConstraint(b,c||a.Strength.strong,d);return this.addEditConstraint(e),this},addEditConstraint:function(a){var b=f;return this.addConstraint(a),this._addEditConstraint(a,b.eplus,b.eminus,b.prevEConstant),this},_addEditConstraint:function(b,c,d,e){var f=this._editVarMap.size,g=new a.EditInfo(b,c,d,e,f);this._editVarMap.set(b.variable,g),this._editVarList[f]={v:b.variable,info:g}},addConstraint:function(b){if(b instanceof a.Constraint){var c=this;b.expression.externalVariables.each(function(a){c._noteUpdatedExternal(a)})}var d=this.newExpression(b);return d.solver=this,this.tryAddingDirectly(d)||this.addWithArtificialVariable(d),this._needsSolving=!0,this.autoSolve&&(this.optimize(this._objective),this._setExternalVariables()),this},addConstraintNoException:function(a){try{return this.addConstraint(a),!0}catch(b){return console.error(b),!1}},beginEdit:function(){return a.assert(this._editVarMap.size>0,"_editVarMap.size > 0"),this._infeasibleRows.clear(),this._resetStayConstants(),this._editVariableStack[this._editVariableStack.length]=this._editVarMap.size,this},endEdit:function(){return a.assert(this._editVarMap.size>0,"_editVarMap.size > 0"),this.resolve(),this._editVariableStack.pop(),this.removeEditVarsTo(this._editVariableStack[this._editVariableStack.length-1]),this},removeAllEditVars:function(){return this.removeEditVarsTo(0)},removeEditVarsTo:function(b){try{for(var c=this._editVarList.length,d=b;c>d;d++)this._editVarList[d]&&this.removeConstraint(this._editVarMap.get(this._editVarList[d].v).constraint);return this._editVarList.length=b,a.assert(this._editVarMap.size==b,"_editVarMap.size == n"),this}catch(e){throw new a.InternalError("Constraint not found in removeEditVarsTo")}},addPointStays:function(a){return a.forEach(function(a,b){this.addStay(a.x,e,Math.pow(2,b)),this.addStay(a.y,e,Math.pow(2,b))},this),this},addStay:function(b,c,d){var f=new a.StayConstraint(b,c||e,d||1);return this.addConstraint(f)},setConstant:function(a,b){this._setConstant(a,b),this.resolve()},removeConstraint:function(b){this._needsSolving=!0,this._resetStayConstants();var c=this.rows.get(this._objective),d=this._errorVars.get(b);null!=d&&d.each(function(a){var d=this.rows.get(a);null==d?c.addVariable(a,-b.weight*b.strength.symbolicWeight.value,this._objective,this):c.addExpression(d,-b.weight*b.strength.symbolicWeight.value,this._objective,this)},this);var e=this._markerVars.get(b);if(this._markerVars.delete(b),null==e)throw new a.InternalError("Constraint not found in removeConstraintInternal");if(null==this.rows.get(e)){var f=this.columns.get(e),g=null,h=0;f.each(function(b){if(b.isRestricted){var c=this.rows.get(b),d=c.coefficientFor(e);if(0>d){var f=-c.constant/d;(null==g||h>f||a.approx(f,h)&&b.hashCode<g.hashCode)&&(h=f,g=b)}}},this),null==g&&f.each(function(a){if(a.isRestricted){var b=this.rows.get(a),c=b.coefficientFor(e),d=b.constant/c;(null==g||h>d)&&(h=d,g=a)}},this),null==g&&(0==f.size?this.removeColumn(e):f.escapingEach(function(a){return a!=this._objective?(g=a,{brk:!0}):void 0},this)),null!=g&&this.pivot(e,g)}if(null!=this.rows.get(e)&&this.removeRow(e),null!=d&&d.each(function(a){a!=e&&this.removeColumn(a)},this),b.isStay){if(null!=d)for(var j=0;j<this._stayPlusErrorVars.length;j++)d.delete(this._stayPlusErrorVars[j]),d.delete(this._stayMinusErrorVars[j])}else if(b.isEdit){var k=this._editVarMap.get(b.variable);this.removeColumn(k.editMinus),this._editVarMap.delete(b.variable)}return null!=d&&this._errorVars.delete(d),this.autoSolve&&(this.optimize(this._objective),this._setExternalVariables()),this},reset:function(){throw new a.InternalError("reset not implemented")},resolveArray:function(a){var b=a.length;this._editVarMap.each(function(c,d){var e=d.index;b>e&&this.suggestValue(c,a[e])},this),this.resolve()},resolvePair:function(a,b){this.suggestValue(this._editVarList[0].v,a),this.suggestValue(this._editVarList[1].v,b),this.resolve()},resolve:function(){this.dualOptimize(),this._setExternalVariables(),this._infeasibleRows.clear(),this._resetStayConstants()},suggestValue:function(b,c){var d=this._editVarMap.get(b);if(!d)throw new a.Error("suggestValue for variable "+b+", but var is not an edit variable");var e=c-d.prevEditConstant;return d.prevEditConstant=c,this.deltaEditConstant(e,d.editPlus,d.editMinus),this},solve:function(){return this._needsSolving&&(this.optimize(this._objective),this._setExternalVariables()),this},setEditedValue:function(b,c){if(!this.columnsHasKey(b)&&null==this.rows.get(b))return b.value=c,this;if(!a.approx(c,b.value)){this.addEditVar(b),this.beginEdit();try{this.suggestValue(b,c)}catch(d){throw new a.InternalError("Error in setEditedValue")}this.endEdit()}return this},addVar:function(b){if(!this.columnsHasKey(b)&&null==this.rows.get(b))try{this.addStay(b)}catch(c){throw new a.InternalError("Error in addVar -- required failure is impossible")}return this},getInternalInfo:function(){var a=c.getInternalInfo.call(this);return a+="\nSolver info:\n",a+="Stay Error Variables: ",a+=this._stayPlusErrorVars.length+this._stayMinusErrorVars.length,a+=" ("+this._stayPlusErrorVars.length+" +, ",a+=this._stayMinusErrorVars.length+" -)\n",a+="Edit Variables: "+this._editVarMap.size,a+="\n"},getDebugInfo:function(){return this.toString()+this.getInternalInfo()+"\n"},toString:function(){var a=c.getInternalInfo.call(this);return a+="\n_stayPlusErrorVars: ",a+="["+this._stayPlusErrorVars+"]",a+="\n_stayMinusErrorVars: ",a+="["+this._stayMinusErrorVars+"]",a+="\n",a+="_editVarMap:\n"+this._editVarMap,a+="\n"},addWithArtificialVariable:function(b){var c=new a.SlackVariable({value:++this._artificialCounter,prefix:"a"}),d=new a.ObjectiveVariable({name:"az"}),e=b.clone();this.addRow(d,e),this.addRow(c,b),this.optimize(d);var f=this.rows.get(d);if(!a.approx(f.constant,0))throw this.removeRow(d),this.removeColumn(c),new a.RequiredFailure;var g=this.rows.get(c);if(null!=g){if(g.isConstant)return this.removeRow(c),this.removeRow(d),void 0;var h=g.anyPivotableVariable();this.pivot(h,c)}a.assert(null==this.rows.get(c),"rowExpression(av) == null"),this.removeColumn(c),this.removeRow(d)},tryAddingDirectly:function(a){var b=this.chooseSubject(a);return null==b?!1:(a.newSubject(b),this.columnsHasKey(b)&&this.substituteOut(b,a),this.addRow(b,a),!0)},chooseSubject:function(b){var c=null,d=!1,e=!1,f=b.terms,g=f.escapingEach(function(a,b){if(d){if(!a.isRestricted&&!this.columnsHasKey(a))return{retval:a}}else if(a.isRestricted){if(!e&&!a.isDummy&&0>b){var f=this.columns.get(a);(null==f||1==f.size&&this.columnsHasKey(this._objective))&&(c=a,e=!0)}}else c=a,d=!0},this);if(g&&void 0!==g.retval)return g.retval;if(null!=c)return c;var h=0,g=f.escapingEach(function(a,b){return a.isDummy?(this.columnsHasKey(a)||(c=a,h=b),void 0):{retval:null}},this);if(g&&void 0!==g.retval)return g.retval;if(!a.approx(b.constant,0))throw new a.RequiredFailure;return h>0&&b.multiplyMe(-1),c},deltaEditConstant:function(a,b,c){var d=this.rows.get(b);if(null!=d)return d.constant+=a,d.constant<0&&this._infeasibleRows.add(b),void 0;var e=this.rows.get(c);if(null!=e)return e.constant+=-a,e.constant<0&&this._infeasibleRows.add(c),void 0;var f=this.columns.get(c);f||console.log("columnVars is null -- tableau is:\n"+this),f.each(function(b){var d=this.rows.get(b),e=d.coefficientFor(c);d.constant+=e*a,b.isExternal&&this._noteUpdatedExternal(b),b.isRestricted&&d.constant<0&&this._infeasibleRows.add(b)},this)},dualOptimize:function(){for(var b=this.rows.get(this._objective);this._infeasibleRows.size;){var c=this._infeasibleRows.first();this._infeasibleRows.delete(c);var d=null,e=this.rows.get(c);if(e&&e.constant<0){var g,f=Number.MAX_VALUE,h=e.terms;if(h.each(function(c,e){if(e>0&&c.isPivotable){var h=b.coefficientFor(c);g=h/e,(f>g||a.approx(g,f)&&c.hashCode<d.hashCode)&&(d=c,f=g)}}),f==Number.MAX_VALUE)throw new a.InternalError("ratio == nil (MAX_VALUE) in dualOptimize");this.pivot(d,c)}}},newExpression:function(b){var c=f;c.eplus=null,c.eminus=null,c.prevEConstant=null;var d=b.expression,e=a.Expression.fromConstant(d.constant,this),g=new a.SlackVariable,h=new a.DummyVariable,i=new a.SlackVariable,j=new a.SlackVariable,k=d.terms;if(k.each(function(a,b){var c=this.rows.get(a);c?e.addExpression(c,b):e.addVariable(a,b)},this),b.isInequality){if(++this._slackCounter,g=new a.SlackVariable({value:this._slackCounter,prefix:"s"}),e.setVariable(g,-1),this._markerVars.set(b,g),!b.required){++this._slackCounter,i=new a.SlackVariable({value:this._slackCounter,prefix:"em"}),e.setVariable(i,1);var l=this.rows.get(this._objective);l.setVariable(i,b.strength.symbolicWeight.value*b.weight),this.insertErrorVar(b,i),this.noteAddedVariable(i,this._objective)}}else if(b.required)++this._dummyCounter,h=new a.DummyVariable({value:this._dummyCounter,prefix:"d"}),c.eplus=h,c.eminus=h,c.prevEConstant=d.constant,e.setVariable(h,1),this._markerVars.set(b,h);else{++this._slackCounter,j=new a.SlackVariable({value:this._slackCounter,prefix:"ep"}),i=new a.SlackVariable({value:this._slackCounter,prefix:"em"}),e.setVariable(j,-1),e.setVariable(i,1),this._markerVars.set(b,j);
var l=this.rows.get(this._objective),m=b.strength.symbolicWeight.value*b.weight;l.setVariable(j,m),this.noteAddedVariable(j,this._objective),l.setVariable(i,m),this.noteAddedVariable(i,this._objective),this.insertErrorVar(b,i),this.insertErrorVar(b,j),b.isStay?(this._stayPlusErrorVars[this._stayPlusErrorVars.length]=j,this._stayMinusErrorVars[this._stayMinusErrorVars.length]=i):b.isEdit&&(c.eplus=j,c.eminus=i,c.prevEConstant=d.constant)}return e.constant<0&&e.multiplyMe(-1),e},optimize:function(b){this._optimizeCount++;var c=this.rows.get(b);a.assert(null!=c,"zRow != null");for(var g,h,e=null,f=null;;){if(g=0,h=c.terms,h.escapingEach(function(a,b){return a.isPivotable&&g>b?(g=b,e=a,{brk:1}):void 0},this),g>=-d)return;var i=Number.MAX_VALUE,j=this.columns.get(e),k=0;if(j.each(function(b){if(b.isPivotable){var c=this.rows.get(b),d=c.coefficientFor(e);0>d&&(k=-c.constant/d,(i>k||a.approx(k,i)&&b.hashCode<f.hashCode)&&(i=k,f=b))}},this),i==Number.MAX_VALUE)throw new a.InternalError("Objective function is unbounded in optimize");this.pivot(e,f)}},pivot:function(a,b){var c=!1;c&&console.time(" SimplexSolver::pivot"),null==a&&console.warn("pivot: entryVar == null"),null==b&&console.warn("pivot: exitVar == null"),c&&console.time("  removeRow");var d=this.removeRow(b);c&&console.timeEnd("  removeRow"),c&&console.time("  changeSubject"),d.changeSubject(b,a),c&&console.timeEnd("  changeSubject"),c&&console.time("  substituteOut"),this.substituteOut(a,d),c&&console.timeEnd("  substituteOut"),c&&console.time("  addRow"),this.addRow(a,d),c&&console.timeEnd("  addRow"),c&&console.timeEnd(" SimplexSolver::pivot")},_resetStayConstants:function(){for(var a=this._stayPlusErrorVars,b=a.length,c=0;b>c;c++){var d=this.rows.get(a[c]);null===d&&(d=this.rows.get(this._stayMinusErrorVars[c])),null!=d&&(d.constant=0)}},_setExternalVariables:function(){var a=[];this._updatedExternals.each(function(b){var c=b.value,d=this._externalRows.get(b);return d?(b.value=d.constant,c!==b.value&&a.push({type:"update",name:b.name,variable:b,oldValue:c}),void 0):(b.value=0,void 0)},this),this._updatedExternals.clear(),this._needsSolving=!1,this._informCallbacks(a),a.length&&this.onsolved(a)},onsolved:function(){},_informCallbacks:function(a){this._callbacks&&this._callbacks.forEach(function(b){b(a)})},_addCallback:function(a){var b=this._callbacks||(this._callbacks=[]);b[b.length]=a},insertErrorVar:function(b,c){var d=this._errorVars.get(b);d||(d=new a.HashSet,this._errorVars.set(b,d)),d.add(c)}})}(this.c||module.parent.exports||{}),function(a){"use strict";a.Timer=a.inherit({initialize:function(){this.isRunning=!1,this._elapsedMs=0},start:function(){return this.isRunning=!0,this._startReading=new Date,this},stop:function(){return this.isRunning=!1,this._elapsedMs+=new Date-this._startReading,this},reset:function(){return this.isRunning=!1,this._elapsedMs=0,this},elapsedTime:function(){return this.isRunning?(this._elapsedMs+(new Date-this._startReading))/1e3:this._elapsedMs/1e3}})}(this.c||module.parent.exports||{}),this.c.parser=function(){function a(a){return'"'+a.replace(/\\/g,"\\\\").replace(/"/g,'\\"').replace(/\x08/g,"\\b").replace(/\t/g,"\\t").replace(/\n/g,"\\n").replace(/\f/g,"\\f").replace(/\r/g,"\\r").replace(/[\x00-\x07\x0B\x0E-\x1F\x80-\uFFFF]/g,escape)+'"'}var b={parse:function(b,c){function k(a){g>e||(e>g&&(g=e,h=[]),h.push(a))}function l(){var a,b,c,d,f;if(d=e,f=e,a=A(),null!==a){for(b=[],c=m();null!==c;)b.push(c),c=m();null!==b?(c=A(),null!==c?a=[a,b,c]:(a=null,e=f)):(a=null,e=f)}else a=null,e=f;return null!==a&&(a=function(a,b){return b}(d,a[1])),null===a&&(e=d),a}function m(){var a,b,c,d;return c=e,d=e,a=Q(),null!==a?(b=t(),null!==b?a=[a,b]:(a=null,e=d)):(a=null,e=d),null!==a&&(a=function(a,b){return b}(c,a[0])),null===a&&(e=c),a}function n(){var a;return b.length>e?(a=b.charAt(e),e++):(a=null,0===f&&k("any character")),a}function o(){var a;return/^[a-zA-Z]/.test(b.charAt(e))?(a=b.charAt(e),e++):(a=null,0===f&&k("[a-zA-Z]")),null===a&&(36===b.charCodeAt(e)?(a="$",e++):(a=null,0===f&&k('"$"')),null===a&&(95===b.charCodeAt(e)?(a="_",e++):(a=null,0===f&&k('"_"')))),a}function p(){var a;return a=o(),null===a&&(/^[0-9]/.test(b.charAt(e))?(a=b.charAt(e),e++):(a=null,0===f&&k("[0-9]"))),a}function q(){var a;return f++,/^[\t\x0B\f \xA0\uFEFF]/.test(b.charAt(e))?(a=b.charAt(e),e++):(a=null,0===f&&k("[\\t\\x0B\\f \\xA0\\uFEFF]")),f--,0===f&&null===a&&k("whitespace"),a}function r(){var a;return/^[\n\r\u2028\u2029]/.test(b.charAt(e))?(a=b.charAt(e),e++):(a=null,0===f&&k("[\\n\\r\\u2028\\u2029]")),a}function s(){var a;return f++,10===b.charCodeAt(e)?(a="\n",e++):(a=null,0===f&&k('"\\n"')),null===a&&("\r\n"===b.substr(e,2)?(a="\r\n",e+=2):(a=null,0===f&&k('"\\r\\n"')),null===a&&(13===b.charCodeAt(e)?(a="\r",e++):(a=null,0===f&&k('"\\r"')),null===a&&(8232===b.charCodeAt(e)?(a="\u2028",e++):(a=null,0===f&&k('"\\u2028"')),null===a&&(8233===b.charCodeAt(e)?(a="\u2029",e++):(a=null,0===f&&k('"\\u2029"')))))),f--,0===f&&null===a&&k("end of line"),a}function t(){var a,c,d;return d=e,a=A(),null!==a?(59===b.charCodeAt(e)?(c=";",e++):(c=null,0===f&&k('";"')),null!==c?a=[a,c]:(a=null,e=d)):(a=null,e=d),null===a&&(d=e,a=z(),null!==a?(c=s(),null!==c?a=[a,c]:(a=null,e=d)):(a=null,e=d),null===a&&(d=e,a=A(),null!==a?(c=u(),null!==c?a=[a,c]:(a=null,e=d)):(a=null,e=d))),a}function u(){var a,c;return c=e,f++,b.length>e?(a=b.charAt(e),e++):(a=null,0===f&&k("any character")),f--,null===a?a="":(a=null,e=c),a}function v(){var a;return f++,a=w(),null===a&&(a=y()),f--,0===f&&null===a&&k("comment"),a}function w(){var a,c,d,g,h,i,j;if(h=e,"/*"===b.substr(e,2)?(a="/*",e+=2):(a=null,0===f&&k('"/*"')),null!==a){for(c=[],i=e,j=e,f++,"*/"===b.substr(e,2)?(d="*/",e+=2):(d=null,0===f&&k('"*/"')),f--,null===d?d="":(d=null,e=j),null!==d?(g=n(),null!==g?d=[d,g]:(d=null,e=i)):(d=null,e=i);null!==d;)c.push(d),i=e,j=e,f++,"*/"===b.substr(e,2)?(d="*/",e+=2):(d=null,0===f&&k('"*/"')),f--,null===d?d="":(d=null,e=j),null!==d?(g=n(),null!==g?d=[d,g]:(d=null,e=i)):(d=null,e=i);null!==c?("*/"===b.substr(e,2)?(d="*/",e+=2):(d=null,0===f&&k('"*/"')),null!==d?a=[a,c,d]:(a=null,e=h)):(a=null,e=h)}else a=null,e=h;return a}function x(){var a,c,d,g,h,i,j;if(h=e,"/*"===b.substr(e,2)?(a="/*",e+=2):(a=null,0===f&&k('"/*"')),null!==a){for(c=[],i=e,j=e,f++,"*/"===b.substr(e,2)?(d="*/",e+=2):(d=null,0===f&&k('"*/"')),null===d&&(d=r()),f--,null===d?d="":(d=null,e=j),null!==d?(g=n(),null!==g?d=[d,g]:(d=null,e=i)):(d=null,e=i);null!==d;)c.push(d),i=e,j=e,f++,"*/"===b.substr(e,2)?(d="*/",e+=2):(d=null,0===f&&k('"*/"')),null===d&&(d=r()),f--,null===d?d="":(d=null,e=j),null!==d?(g=n(),null!==g?d=[d,g]:(d=null,e=i)):(d=null,e=i);null!==c?("*/"===b.substr(e,2)?(d="*/",e+=2):(d=null,0===f&&k('"*/"')),null!==d?a=[a,c,d]:(a=null,e=h)):(a=null,e=h)}else a=null,e=h;return a}function y(){var a,c,d,g,h,i,j;if(h=e,"//"===b.substr(e,2)?(a="//",e+=2):(a=null,0===f&&k('"//"')),null!==a){for(c=[],i=e,j=e,f++,d=r(),f--,null===d?d="":(d=null,e=j),null!==d?(g=n(),null!==g?d=[d,g]:(d=null,e=i)):(d=null,e=i);null!==d;)c.push(d),i=e,j=e,f++,d=r(),f--,null===d?d="":(d=null,e=j),null!==d?(g=n(),null!==g?d=[d,g]:(d=null,e=i)):(d=null,e=i);null!==c?(d=r(),null===d&&(d=u()),null!==d?a=[a,c,d]:(a=null,e=h)):(a=null,e=h)}else a=null,e=h;return a}function z(){var a,b;for(a=[],b=q(),null===b&&(b=x(),null===b&&(b=y()));null!==b;)a.push(b),b=q(),null===b&&(b=x(),null===b&&(b=y()));return a}function A(){var a,b;for(a=[],b=q(),null===b&&(b=s(),null===b&&(b=v()));null!==b;)a.push(b),b=q(),null===b&&(b=s(),null===b&&(b=v()));return a}function B(){var a,b;return b=e,a=D(),null===a&&(a=C()),null!==a&&(a=function(a,b){return{type:"NumericLiteral",value:b}}(b,a)),null===a&&(e=b),a}function C(){var a,c,d;if(d=e,/^[0-9]/.test(b.charAt(e))?(c=b.charAt(e),e++):(c=null,0===f&&k("[0-9]")),null!==c)for(a=[];null!==c;)a.push(c),/^[0-9]/.test(b.charAt(e))?(c=b.charAt(e),e++):(c=null,0===f&&k("[0-9]"));else a=null;return null!==a&&(a=function(a,b){return parseInt(b.join(""))}(d,a)),null===a&&(e=d),a}function D(){var a,c,d,g,h;return g=e,h=e,a=C(),null!==a?(46===b.charCodeAt(e)?(c=".",e++):(c=null,0===f&&k('"."')),null!==c?(d=C(),null!==d?a=[a,c,d]:(a=null,e=h)):(a=null,e=h)):(a=null,e=h),null!==a&&(a=function(a,b){return parseFloat(b.join(""))}(g,a)),null===a&&(e=g),a}function E(){var a,c,d,g;if(g=e,/^[\-+]/.test(b.charAt(e))?(a=b.charAt(e),e++):(a=null,0===f&&k("[\\-+]")),a=null!==a?a:"",null!==a){if(/^[0-9]/.test(b.charAt(e))?(d=b.charAt(e),e++):(d=null,0===f&&k("[0-9]")),null!==d)for(c=[];null!==d;)c.push(d),/^[0-9]/.test(b.charAt(e))?(d=b.charAt(e),e++):(d=null,0===f&&k("[0-9]"));else c=null;null!==c?a=[a,c]:(a=null,e=g)}else a=null,e=g;return a}function F(){var a,b;return f++,b=e,a=G(),null!==a&&(a=function(a,b){return b}(b,a)),null===a&&(e=b),f--,0===f&&null===a&&k("identifier"),a}function G(){var a,b,c,d,g;if(f++,d=e,g=e,a=o(),null!==a){for(b=[],c=p();null!==c;)b.push(c),c=p();null!==b?a=[a,b]:(a=null,e=g)}else a=null,e=g;return null!==a&&(a=function(a,b,c){return b+c.join("")}(d,a[0],a[1])),null===a&&(e=d),f--,0===f&&null===a&&k("identifier"),a}function H(){var a,c,d,g,h,i,j;return i=e,a=F(),null!==a&&(a=function(a,b){return{type:"Variable",name:b}}(i,a)),null===a&&(e=i),null===a&&(a=B(),null===a&&(i=e,j=e,40===b.charCodeAt(e)?(a="(",e++):(a=null,0===f&&k('"("')),null!==a?(c=A(),null!==c?(d=Q(),null!==d?(g=A(),null!==g?(41===b.charCodeAt(e)?(h=")",e++):(h=null,0===f&&k('")"')),null!==h?a=[a,c,d,g,h]:(a=null,e=j)):(a=null,e=j)):(a=null,e=j)):(a=null,e=j)):(a=null,e=j),null!==a&&(a=function(a,b){return b}(i,a[2])),null===a&&(e=i))),a}function I(){var a,b,c,d,f;return a=H(),null===a&&(d=e,f=e,a=J(),null!==a?(b=A(),null!==b?(c=I(),null!==c?a=[a,b,c]:(a=null,e=f)):(a=null,e=f)):(a=null,e=f),null!==a&&(a=function(a,b,c){return{type:"UnaryExpression",operator:b,expression:c}}(d,a[0],a[2])),null===a&&(e=d)),a}function J(){var a;return 43===b.charCodeAt(e)?(a="+",e++):(a=null,0===f&&k('"+"')),null===a&&(45===b.charCodeAt(e)?(a="-",e++):(a=null,0===f&&k('"-"')),null===a&&(33===b.charCodeAt(e)?(a="!",e++):(a=null,0===f&&k('"!"')))),a}function K(){var a,b,c,d,f,g,h,i,j;if(h=e,i=e,a=I(),null!==a){for(b=[],j=e,c=A(),null!==c?(d=L(),null!==d?(f=A(),null!==f?(g=I(),null!==g?c=[c,d,f,g]:(c=null,e=j)):(c=null,e=j)):(c=null,e=j)):(c=null,e=j);null!==c;)b.push(c),j=e,c=A(),null!==c?(d=L(),null!==d?(f=A(),null!==f?(g=I(),null!==g?c=[c,d,f,g]:(c=null,e=j)):(c=null,e=j)):(c=null,e=j)):(c=null,e=j);null!==b?a=[a,b]:(a=null,e=i)}else a=null,e=i;return null!==a&&(a=function(a,b,c){for(var d=b,e=0;e<c.length;e++)d={type:"MultiplicativeExpression",operator:c[e][1],left:d,right:c[e][3]};return d}(h,a[0],a[1])),null===a&&(e=h),a}function L(){var a;return 42===b.charCodeAt(e)?(a="*",e++):(a=null,0===f&&k('"*"')),null===a&&(47===b.charCodeAt(e)?(a="/",e++):(a=null,0===f&&k('"/"'))),a}function M(){var a,b,c,d,f,g,h,i,j;if(h=e,i=e,a=K(),null!==a){for(b=[],j=e,c=A(),null!==c?(d=N(),null!==d?(f=A(),null!==f?(g=K(),null!==g?c=[c,d,f,g]:(c=null,e=j)):(c=null,e=j)):(c=null,e=j)):(c=null,e=j);null!==c;)b.push(c),j=e,c=A(),null!==c?(d=N(),null!==d?(f=A(),null!==f?(g=K(),null!==g?c=[c,d,f,g]:(c=null,e=j)):(c=null,e=j)):(c=null,e=j)):(c=null,e=j);null!==b?a=[a,b]:(a=null,e=i)}else a=null,e=i;return null!==a&&(a=function(a,b,c){for(var d=b,e=0;e<c.length;e++)d={type:"AdditiveExpression",operator:c[e][1],left:d,right:c[e][3]};return d}(h,a[0],a[1])),null===a&&(e=h),a}function N(){var a;return 43===b.charCodeAt(e)?(a="+",e++):(a=null,0===f&&k('"+"')),null===a&&(45===b.charCodeAt(e)?(a="-",e++):(a=null,0===f&&k('"-"'))),a}function O(){var a,b,c,d,f,g,h,i,j;if(h=e,i=e,a=M(),null!==a){for(b=[],j=e,c=A(),null!==c?(d=P(),null!==d?(f=A(),null!==f?(g=M(),null!==g?c=[c,d,f,g]:(c=null,e=j)):(c=null,e=j)):(c=null,e=j)):(c=null,e=j);null!==c;)b.push(c),j=e,c=A(),null!==c?(d=P(),null!==d?(f=A(),null!==f?(g=M(),null!==g?c=[c,d,f,g]:(c=null,e=j)):(c=null,e=j)):(c=null,e=j)):(c=null,e=j);null!==b?a=[a,b]:(a=null,e=i)}else a=null,e=i;return null!==a&&(a=function(a,b,c){for(var d=b,e=0;e<c.length;e++)d={type:"Inequality",operator:c[e][1],left:d,right:c[e][3]};return d}(h,a[0],a[1])),null===a&&(e=h),a}function P(){var a;return"<="===b.substr(e,2)?(a="<=",e+=2):(a=null,0===f&&k('"<="')),null===a&&(">="===b.substr(e,2)?(a=">=",e+=2):(a=null,0===f&&k('">="')),null===a&&(60===b.charCodeAt(e)?(a="<",e++):(a=null,0===f&&k('"<"')),null===a&&(62===b.charCodeAt(e)?(a=">",e++):(a=null,0===f&&k('">"'))))),a}function Q(){var a,c,d,g,h,i,j,l,m;if(j=e,l=e,a=O(),null!==a){for(c=[],m=e,d=A(),null!==d?("=="===b.substr(e,2)?(g="==",e+=2):(g=null,0===f&&k('"=="')),null!==g?(h=A(),null!==h?(i=O(),null!==i?d=[d,g,h,i]:(d=null,e=m)):(d=null,e=m)):(d=null,e=m)):(d=null,e=m);null!==d;)c.push(d),m=e,d=A(),null!==d?("=="===b.substr(e,2)?(g="==",e+=2):(g=null,0===f&&k('"=="')),null!==g?(h=A(),null!==h?(i=O(),null!==i?d=[d,g,h,i]:(d=null,e=m)):(d=null,e=m)):(d=null,e=m)):(d=null,e=m);null!==c?a=[a,c]:(a=null,e=l)}else a=null,e=l;return null!==a&&(a=function(a,b,c){for(var d=b,e=0;e<c.length;e++)d={type:"Equality",operator:c[e][1],left:d,right:c[e][3]};return d}(j,a[0],a[1])),null===a&&(e=j),a}function R(a){a.sort();for(var b=null,c=[],d=0;d<a.length;d++)a[d]!==b&&(c.push(a[d]),b=a[d]);return c}function S(){for(var a=1,c=1,d=!1,f=0;f<Math.max(e,g);f++){var h=b.charAt(f);"\n"===h?(d||a++,c=1,d=!1):"\r"===h||"\u2028"===h||"\u2029"===h?(a++,c=1,d=!0):(c++,d=!1)}return{line:a,column:c}}var d={start:l,Statement:m,SourceCharacter:n,IdentifierStart:o,IdentifierPart:p,WhiteSpace:q,LineTerminator:r,LineTerminatorSequence:s,EOS:t,EOF:u,Comment:v,MultiLineComment:w,MultiLineCommentNoLineTerminator:x,SingleLineComment:y,_:z,__:A,Literal:B,Integer:C,Real:D,SignedInteger:E,Identifier:F,IdentifierName:G,PrimaryExpression:H,UnaryExpression:I,UnaryOperator:J,MultiplicativeExpression:K,MultiplicativeOperator:L,AdditiveExpression:M,AdditiveOperator:N,InequalityExpression:O,InequalityOperator:P,LinearExpression:Q};if(void 0!==c){if(void 0===d[c])throw new Error("Invalid rule name: "+a(c)+".")}else c="start";var e=0,f=0,g=0,h=[],T=d[c]();if(null===T||e!==b.length){var U=Math.max(e,g),V=U<b.length?b.charAt(U):null,W=S();throw new this.SyntaxError(R(h),V,U,W.line,W.column)}return T},toSource:function(){return this._source}};return b.SyntaxError=function(b,c,d,e,f){function g(b,c){var d,e;switch(b.length){case 0:d="end of input";break;case 1:d=b[0];break;default:d=b.slice(0,b.length-1).join(", ")+" or "+b[b.length-1]}return e=c?a(c):"end of input","Expected "+d+" but "+e+" found."}this.name="SyntaxError",this.expected=b,this.found=c,this.message=g(b,c),this.offset=d,this.line=e,this.column=f},b.SyntaxError.prototype=Error.prototype,b}(),function(a){"use strict";var b=new a.SimplexSolver,c={},d={},e=a.Strength.weak;a.Strength.medium,a.Strength.strong,a.Strength.required;var i=function(f){if(d[f])return d[f];switch(f.type){case"Inequality":var g="<="==f.operator?a.LEQ:a.GEQ,h=new a.Inequality(i(f.left),g,i(f.right),e);return b.addConstraint(h),h;case"Equality":var h=new a.Equation(i(f.left),i(f.right),e);return b.addConstraint(h),h;case"MultiplicativeExpression":var h=a.times(i(f.left),i(f.right));return b.addConstraint(h),h;case"AdditiveExpression":return"+"==f.operator?a.plus(i(f.left),i(f.right)):a.minus(i(f.left),i(f.right));case"NumericLiteral":return new a.Expression(f.value);case"Variable":return c[f.name]||(c[f.name]=new a.Variable({name:f.name})),c[f.name];case"UnaryExpression":console.log("UnaryExpression...WTF?")}},j=function(a){return a.map(i)};a._api=function(){var c=Array.prototype.slice.call(arguments);if(1==c.length){if("string"==typeof c[0]){var d=a.parser.parse(c[0]);return j(d)}"function"==typeof c[0]&&b._addCallback(c[0])}}}(this.c||module.parent.exports||{});
}).call(
  (typeof module != "undefined") ?
      (module.compiled = true && module) : this
);

},{}],2:[function(require,module,exports){
"use strict";
const M = require('../model/Model');
const S = require('../model/Shapes');
const V = require('../view/View');
const U = require('../util/Util');
const Main = require('../main');
function makePoint(e) { return { x: e.clientX, y: e.clientY }; }
function pointFromDrag(d, s) {
    let [x, y] = s.getValues([d.x, d.y]);
    return { x: x, y: y };
}
function overlap({ x: lx, y: ly }, { x: rx, y: ry }, thresh) {
    thresh = thresh || 100;
    let [dx, dy] = [Math.abs(lx - rx), Math.abs(ly - ry)];
    return (dx * dx + dy * dy) <= thresh;
}
class ButtonController {
    constructor() {
        let buttonIDs = ['addRect', 'addImage', 'addSpring', 'addArrow', 'addCircle', 'addLine'];
        let builders = [
            ButtonController.addRect, ButtonController.addImage, ButtonController.addSpring, ButtonController.addArrow, ButtonController.addCircle, ButtonController.addLine
        ];
        U.zip(buttonIDs, builders).forEach(([id, f]) => {
            document.getElementById(id).onclick = () => {
                let newState = f(Main.initModel.main);
                Main.initModel = new M.Model(newState);
                Main.refresh();
            };
        });
    }
    static addLine(s, numPoints) {
        numPoints = numPoints || 2;
        let delta = 50;
        let [x, y] = [50, 50];
        let points = [];
        for (let i = 0; i < numPoints; ++i) {
            let newPoint = [s.allocVar(x, "LX"), s.allocVar(y, "LY")];
            points.push(newPoint);
            x += delta;
            y += delta;
        }
        return s.addShape(new S.Line(points, "black", false));
    }
    static addSpring(s) {
        let delta = 50;
        let [x, y, dx, dy] = [50, 50, delta, delta];
        let [sx, sy, sdx, sdy] = [s.allocVar(x, "LX"), s.allocVar(y, "LY"), s.allocVar(dx, "LDX"), s.allocVar(dy, "LDY")];
        return s.addShape(new S.Spring(sx, sy, sdx, sdy, "black"));
    }
    static addArrow(s) {
        let delta = 50;
        let [x, y, dx, dy] = [50, 50, delta, delta];
        let [sx, sy, sdx, sdy] = [s.allocVar(x, "LX"), s.allocVar(y, "LY"), s.allocVar(dx, "LDX"), s.allocVar(dy, "LDY")];
        return s.addShape(new S.Arrow(sx, sy, sdx, sdy, "black"));
    }
    static addCircle(s) {
        let delta = 50;
        let [x, y, r] = [50, 50, delta];
        let [sx, sy, sr] = [s.allocVar(x, "CX"), s.allocVar(y, "CY"), s.allocVar(r, "SR")];
        return s.addShape(new S.Circle(sx, sy, sr, "black", "rgba(0,0,0,0)"));
    }
    static addRect(s) {
        let delta = 50;
        let [x, y, dx, dy] = [50, 50, delta, delta];
        let [sx, sy, sdx, sdy] = [s.allocVar(x, "LX"), s.allocVar(y, "LY"), s.allocVar(dx, "LDX"), s.allocVar(dy, "LDY")];
        return s.addShape(new S.Rectangle(sx, sy, sdx, sdy, "black"));
    }
    static addImage(s, name) {
        name = name || prompt('Input image name:');
        let delta = 50;
        let [x, y, dx, dy] = [50, 50, delta, delta];
        let [sx, sy, sdx, sdy] = [s.allocVar(x, "LX"), s.allocVar(y, "LY"), s.allocVar(dx, "LDX"), s.allocVar(dy, "LDY")];
        return s.addShape(new S.Image(sx, sy, sdx, sdy, name, "black"));
    }
}
exports.ButtonController = ButtonController;
class DragController {
    constructor(m, receiver) {
        this.m = m;
        this.receiver = receiver;
        this.enableDrags();
    }
    enableDrags() {
        let mainCanv = document.getElementById('mainCanvas');
        let mouseEvents = ["mousedown", "mouseup", "mousemove"];
        mainCanv.addEventListener("mousedown", e => this.handleLeftClick(e));
        mainCanv.addEventListener("mousemove", e => this.handleMove(e));
        mainCanv.addEventListener("mouseup", e => this.handleRightClick(e));
        mainCanv.style.cursor = 'default';
    }
    convertEvent(e) {
        let rect = this.receiver.getBoundingClientRect();
        let [dx, dy] = [-rect.left, -rect.top];
        return { x: e.x + dx, y: e.y + dy };
    }
    handleLeftClick(e) {
        let p = this.convertEvent(e);
        // console.log("click at: ")
        // console.log(p)
        let drags = U.filter(this.m.main.prog.shapes, s => s instanceof S.DragPoint);
        for (let d of drags) {
            // console.log("drag at: ")
            // console.log(d)
            if (overlap(p, pointFromDrag(d, this.m.main.store))) {
                // console.log("clicked:")
                // console.log(d)
                // console.log("drag frees:")
                // console.log(this.m.main.prog.allFrees.get(d))
                this.m.main.draggedPoint = d;
                this.m.main.dragging = true;
                break;
            }
        }
    }
    handleMove(e) {
        let p = this.convertEvent(e);
        if (this.m.main.dragging) {
            // suggest value for x and y
            // gross...refactor or something idk
            let [x, y] = [this.m.main.draggedPoint.x, this.m.main.draggedPoint.y];
            let edits = (new Map()).set(x, p.x).set(y, p.y);
            // console.log('edits:')
            // console.log(edits)
            this.m.main.store.suggestEdits(edits, this.m.main.prog.allFrees.get(this.m.main.draggedPoint));
            // redraw
            V.renderModel(this.m);
        }
    }
    handleRightClick(e) {
        let p = this.convertEvent(e);
        // release!
        if (this.m.main.dragging) {
            // just state change
            this.m.main.draggedPoint = null; // TODO: option monad
            this.m.main.dragging = false;
        }
    }
}
exports.DragController = DragController;

},{"../main":3,"../model/Model":5,"../model/Shapes":6,"../util/Util":8,"../view/View":10}],3:[function(require,module,exports){
"use strict";
const Model = require('./model/Model');
const View = require('./view/View');
const Cont = require('./controller/Controller');
const Ex = require('./model/Export');
let mainCanv = document.getElementById('mainCanvas');
let mainCtx = mainCanv.getContext('2d');
// TODO
mainCanv.width = 600;
mainCanv.height = 400;
// canvas.addEventListener("eddiemousedown", doMouseDown);
// canvas.addEventListener("eddiemouseup", doMouseUp);
// canvas.addEventListener("eddiemousemove", doMouseMove);
exports.initModel = Model.Model.empty();
// // build a circle, add to the model
// let decls:[[string, number]] = [['x', 100], ['y', 100]]
//
// let vars = decls.map( ([name, value]) =>
//   initModel.main.addVar(VModel.VType.Prim, name, value)
// )
//
// vars.push(initModel.main.addVar(VModel.VType.Cass, 'r', 10))
//
// let ddecls:[[string, number]] = [['dx', 110], ['dy', 100]]
// let dvars = ddecls.map( ([name, value]) =>
//   initModel.main.addVar(VModel.VType.Cass, name, value)
// )
// dvars.push(initModel.main.addVar(VModel.VType.Prim, 'dr', 5))
//
// let circ = new SModel.Circle(vars[0], vars[1], vars[2], 'black', 'black')
// let dpoint = new SModel.DragPoint(dvars[0], dvars[1], dvars[2], 'black')
//
// // add frees....
// let frees = (new Set<VModel.Variable>()).add(dvars[0]).add(dvars[1])
//let finState = addLine(initModel.main, 5)//initModel.main.addShape(circ).addShape(dpoint).addFrees(dpoint, frees)
// console.log('new frees:')
// console.log(finState.prog.allFrees)
let dragCont = new Cont.DragController(exports.initModel, document.getElementById('mainCanvas'));
let buttonCont = new Cont.ButtonController();
function refresh() {
    dragCont.m = exports.initModel;
    View.renderModel(exports.initModel);
}
exports.refresh = refresh;
// console.log(finalModel.eval())
// console.log(circ instanceof SModel.Line)
// TODO: refactor
let exporter = document.getElementById('export');
exporter.builder = () => {
    return ((new Ex.oldJSON(exports.initModel)).toJSON());
};
//SView.drawLine(mainCtx, [[10,10], [100, 10], [100, 150], [10, 170], [10, 10]])

},{"./controller/Controller":2,"./model/Export":4,"./model/Model":5,"./view/View":10}],4:[function(require,module,exports){
// Export models (really, just the store) to json formats
"use strict";
const S = require('./Shapes');
class oldJSON {
    constructor(base) {
        this.base = base;
    }
    // convert a model into an old-model json string
    toJSON() {
        let vars = [...this.base.main.eval().entries()].map(([k, v]) => {
            let ret = {};
            ret[k.name] = v;
            return ret;
        });
        let shapePrefix = "S";
        let shapeSuffix = -1;
        let allocShape = () => {
            ++shapeSuffix;
            return shapePrefix + shapeSuffix.toString();
        };
        let shapes = [...this.base.main.prog.shapes.values()].filter(s => !(s instanceof S.DragPoint)).map(s => {
            let type;
            let name = allocShape();
            let args;
            if (s instanceof S.Line) {
                type = "line";
                let start = s.points[0].map(i => i.name);
                let end = s.points[1].map(i => i.name);
                args = { start: { x: start[0], y: start[1] }, end: { x: end[0], y: end[1] } };
            }
            else if (s instanceof S.Arrow || s instanceof S.Spring) {
                if (s instanceof S.Arrow) {
                    type = "arrow";
                }
                else {
                    type = "spring";
                }
                args = { base: { x: s.x.name, y: s.y.name }, dx: s.dx.name, dy: s.dy.name };
            }
            else if (s instanceof S.Circle) {
                type = "circle";
                args = { center: { x: s.x.name, y: s.y.name }, r: s.r.name };
            }
            else if (s instanceof S.Rectangle) {
                type = "rectangle";
                args = { center: { x: s.x.name, y: s.y.name }, dx: s.dx.name, dy: s.dy.name };
            }
            else if (s instanceof S.Image) {
                type = "image";
                args = { center: { x: s.x.name, y: s.y.name }, dx: s.dx.name, dy: s.dy.name, name: s.name };
            }
            else {
                console.log('unhandled shape in export: ' + s.toString());
                assert(false);
            }
            return { type: type, name: name, args: args };
        });
        let ret = {
            vars: vars,
            shapes: shapes,
            ipoints: [],
            equations: [],
            inequalities: [],
            recConstraints: [],
            freeRecVars: [],
            names: []
        };
        return JSON.stringify(ret);
    }
}
exports.oldJSON = oldJSON;

},{"./Shapes":6}],5:[function(require,module,exports){
"use strict";
const S = require('./Shapes');
const U = require('../util/Util');
const V = require('./Variable');
const Cass = require('cassowary');
// import assert from 'assert'
// immutable program
// we expect to rarely add/remove shapes and other program elements
class Program {
    constructor(shapes, allFrees) {
        this.shapes = shapes;
        this.allFrees = allFrees;
    }
    static empty() {
        return new Program(new Set(), new Map());
    }
    // (mostly) immutable extension functions
    addShape(s) {
        let newFrees;
        if (s instanceof S.DragPoint) {
            newFrees = U.copy(this.allFrees);
            newFrees.set(s, new Set());
        }
        else {
            newFrees = this.allFrees;
        }
        return new Program(U.add(this.shapes, s), newFrees);
    }
    addFrees(p, frees) {
        let newFrees = U.copy(this.allFrees);
        newFrees.set(p, frees);
        return new Program(this.shapes, newFrees);
    }
}
exports.Program = Program;
// mutable state store
// we expect to frequently update internal elements of the store
class Store {
    constructor() {
        this.csolver = new Cass.SimplexSolver();
        this.csolver.autoSolve = false;
        this.cvars = new Set();
        this.prims = new Map();
        this.cstays = new Map();
    }
    debug() {
        console.log('pvars:');
        console.log(this.prims);
        console.log('cvars:');
        console.log(this.cvars);
        console.log('stays:');
        console.log(this.cstays);
    }
    // helper: create a stay equation for a cassowary variable
    // i.e. v = v.value
    static makeStay(v) {
        let l = Cass.Expression.fromVariable(v._value);
        let r = Cass.Expression.fromConstant(v._value.value);
        return new Cass.Equation(l, r);
    }
    clearStays() {
        // console.log('stays:')
        // console.log(this.cstays)
        for (let [vr, stay] of this.cstays) {
            this.csolver.removeConstraint(stay);
        }
        this.cstays.clear();
    }
    addStays(frees) {
        let pinned = U.filter(this.cvars, i => !frees.has(i));
        for (let varble of pinned) {
            let newStay = Store.makeStay(varble);
            this.cstays.set(varble, newStay);
            this.csolver.addConstraint(newStay);
        }
    }
    // refresh stay equations in cassowary system
    refreshStays(frees) {
        this.clearStays();
        this.addStays(frees);
    }
    addEq(e) {
        this.csolver.addConstraint(e);
    }
    suggestEdits(edits, frees) {
        // foreach free variable: remove the corresponding stay from cass's system
        // foreach edit:
        //  for cass vars, suggest the edit to the solver.
        //  for prims, directly set the value if free.
        if (U.DEBUG) {
            console.log('edits, frees:');
            console.log(edits);
            console.log(frees);
            console.log('before edit:');
            this.debug();
        }
        this.clearStays();
        // only start an edit if an edit will be suggested
        let nonempty = U.exists(edits, ([v, _]) => v instanceof V.CassVar);
        for (let [eVar, eValue] of edits) {
            if (eVar instanceof V.CassVar) {
                this.csolver.addEditVar(eVar._value, Cass.Strength.medium, 1);
            }
        }
        if (nonempty)
            this.csolver.beginEdit();
        for (let [eVar, eValue] of edits) {
            if (eVar instanceof V.CassVar) {
                this.csolver.suggestValue(eVar._value, eValue);
            }
            else if (eVar instanceof V.Primitive) {
                this.prims.set(eVar, eValue);
            }
            else {
                console.log("unhandled edit: " + [eVar, eValue]);
                assert(false);
            }
        }
        // finally, close the edit and resolve the solver.
        this.addStays(frees);
        this.csolver.solve();
        if (nonempty)
            this.csolver.endEdit();
        // stays are now stale: refresh them
        this.refreshStays(new Set());
        if (U.DEBUG) {
            console.log('after edit:');
            this.debug();
        }
    }
    collectVars() {
        let ret = new Set();
        this.cvars.forEach(v => ret.add(v));
        this.prims.forEach((_, k) => ret.add(k));
        return ret;
    }
    // return constructed variables for use in maps/folds
    addVar(typ, name, val) {
        let ret;
        switch (typ) {
            case V.VType.Prim:
                ret = new V.Primitive(name);
                this.prims.set(ret, val);
                break;
            case V.VType.Cass:
                ret = new V.CassVar(name, val);
                this.cvars.add(ret);
                this.refreshStays(new Set());
                break;
            default:
                console.log('adding unhandled variable type: ' + V.VType[typ]);
                assert(false, 'bad variable type for addvar');
                break;
        }
        return ret;
    }
    eval() {
        let ret = new Map();
        for (let cv of this.cvars) {
            ret.set(cv, cv._value.value);
        }
        for (let [pvar, pval] of this.prims) {
            ret.set(pvar, pval);
        }
        return ret;
    }
    getValues(vars) {
        return vars.map(v => {
            if (v instanceof V.Primitive)
                return this.prims.get(v);
            else if (v instanceof V.CassVar)
                return v._value.value;
            else
                assert(false); // dead code
        });
    }
}
exports.Store = Store;
// package up a program and store
class State {
    // TODO: convert dragged to option
    constructor(prog, store, dragging, draggedPoint) {
        this.prog = prog;
        this.store = store;
        this.dragging = dragging;
        this.draggedPoint = draggedPoint;
    }
    static empty() {
        return new State(Program.empty(), new Store(), false, null);
    }
    // delegate to member instances
    addVar(typ, name, val) {
        return this.store.addVar(typ, name, val);
    }
    // given a store and x,y coordinates, make new cassowary variables corresponding
    // to the x, y values and wrap in a point.
    // mutates this to add the new variable
    allocVar(v, prefix) {
        prefix = prefix || "V";
        let suffix = 0;
        let sVals = this.eval();
        while (U.exists(sVals, ([k, v]) => k.name == (prefix + suffix.toString())))
            ++suffix;
        return this.addVar(V.VType.Cass, prefix + suffix.toString(), v);
    }
    // mutates this to add x, y, and r
    allocPoint(p) {
        let [x, y, r] = [this.allocVar(p.x), this.allocVar(p.y), this.allocVar(5)];
        return new S.DragPoint(x, y, r, "blue");
    }
    // given an expression, allocate a new variable, add to the store, and
    // return an equation for var = expr.
    makeEquation(e, v) {
        let varValue = -e.constant;
        //  console.log(e)
        let retVar = this.allocVar(v);
        let eq = new Cass.Equation(retVar.toCExpr(), e);
        return [retVar, eq];
    }
    addShape(s) {
        // add the shape, as well as edit-points, edit-equations, and free variables
        let editPoints = new Map();
        let editEqs = new Set();
        let vals = this.eval();
        let newProg = this.prog;
        // assumes each shape has CassVar variables, which is not realistic... TODO
        if (s instanceof S.Line) {
            // foreach point on the line, add a drag point with the underlying variables
            s.points.forEach(([x, y]) => {
                let r = this.allocVar(3.5);
                let np = new S.DragPoint(x, y, r, "blue");
                let newFrees = (new Set()).add(x).add(y);
                editPoints.set(np, newFrees);
            });
        }
        else if (s instanceof S.Arrow || s instanceof S.Spring) {
            // put a drag point on the base, and a drag point at the end. fix
            // the end with equations.
            let [r1, r2] = [this.allocVar(3.5), this.allocVar(3.5)];
            let bp = new S.DragPoint(s.x, s.y, r1, "blue");
            let endXExpr = s.x.toCExpr().plus(s.dx.toCExpr()); // TODO
            let endYExpr = s.y.toCExpr().plus(s.dy.toCExpr()); // TODO
            let [endX, endXEq] = this.makeEquation(endXExpr, vals.get(s.x) + vals.get(s.dx));
            let [endY, endYEq] = this.makeEquation(endYExpr, vals.get(s.y) + vals.get(s.dy));
            let baseFrees = (new Set()).add(s.x).add(s.y).add(endX).add(endY); // gross
            let endFrees = (new Set()).add(s.dx).add(s.dy).add(endX).add(endY);
            let ep = new S.DragPoint(endX, endY, r2, "blue");
            editEqs.add(endXEq).add(endYEq);
            editPoints.set(bp, baseFrees).set(ep, endFrees);
        }
        else if (s instanceof S.Circle) {
            // point in the middle, point on the right edge
            let [r1, r2] = [this.allocVar(3.5), this.allocVar(3.5)];
            let bp = new S.DragPoint(s.x, s.y, r1, "blue");
            let endXExpr = s.x.toCExpr().plus(s.r.toCExpr()); // TODO
            let [endX, endXEq] = this.makeEquation(endXExpr, vals.get(s.x) + vals.get(s.r));
            let baseFrees = (new Set()).add(s.x).add(s.y).add(endX);
            let endFrees = (new Set()).add(s.r).add(endX);
            let ep = new S.DragPoint(endX, s.y, r2, "blue");
            editEqs.add(endXEq);
            editPoints.set(bp, baseFrees).set(ep, endFrees);
        }
        else if (s instanceof S.Rectangle || s instanceof S.Image) {
            let [r1, r2] = [this.allocVar(3.5), this.allocVar(3.5)];
            let bp = new S.DragPoint(s.x, s.y, r1, "blue");
            let endXExpr = s.x.toCExpr().plus(s.dx.toCExpr()); // TODO
            let endYExpr = s.y.toCExpr().minus(s.dy.toCExpr()); // TODO
            let [endX, endXEq] = this.makeEquation(endXExpr, vals.get(s.x) + vals.get(s.dx));
            let [endY, endYEq] = this.makeEquation(endYExpr, vals.get(s.y) - vals.get(s.dy));
            let baseFrees = (new Set()).add(s.x).add(s.y).add(endX).add(endY); // gross
            let endFrees = (new Set()).add(s.dx).add(s.dy).add(endX).add(endY);
            let ep = new S.DragPoint(endX, endY, r2, "blue");
            editEqs.add(endXEq).add(endYEq);
            editPoints.set(bp, baseFrees).set(ep, endFrees);
        }
        else {
            console.log('unhandled shape for adding edit points: ' + s.toString());
            assert(false);
        }
        newProg = newProg.addShape(s);
        for (let [dp, frees] of editPoints) {
            newProg = newProg.addShape(dp);
            newProg = newProg.addFrees(dp, frees);
        }
        for (let editEq of editEqs)
            this.store.addEq(editEq);
        return new State(newProg, this.store, this.dragging, this.draggedPoint);
    }
    addFrees(p, fvs) {
        return new State(this.prog.addFrees(p, fvs), this.store, this.dragging, this.draggedPoint);
    }
    eval() {
        return this.store.eval();
    }
}
exports.State = State;
// for now, just one main program and one main mode
// export enum MainState {Display}
class Model {
    constructor(main //, public mainState: MainState
        ) {
        this.main = main;
    }
    static empty() {
        return new Model(State.empty());
    }
}
exports.Model = Model;

},{"../util/Util":8,"./Shapes":6,"./Variable":7,"cassowary":1}],6:[function(require,module,exports){
"use strict";
// Line primitive. Points is an array of (x,y) pairs, stroke specifies the
// color of the line stroke, and dash specifies whether to use a dashed line
// or not.
class Line {
    constructor(points, stroke, dash) {
        this.points = points;
        this.stroke = stroke;
        this.dash = dash;
    }
}
exports.Line = Line;
class Arrow {
    constructor(x, y, dx, dy, stroke) {
        this.x = x;
        this.y = y;
        this.dx = dx;
        this.dy = dy;
        this.stroke = stroke;
    }
}
exports.Arrow = Arrow;
class Spring {
    constructor(x, y, dx, dy, stroke) {
        this.x = x;
        this.y = y;
        this.dx = dx;
        this.dy = dy;
        this.stroke = stroke;
    }
}
exports.Spring = Spring;
class Text {
    constructor(x, y, text, stroke, font) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.stroke = stroke;
        this.font = font || "24pt Comic sans MS";
    }
}
exports.Text = Text;
// Circle primitive. Fill controls the color of the interior, while stroke controls
// the color of the border.
class Circle {
    constructor(x, y, r, stroke, fill) {
        this.x = x;
        this.y = y;
        this.r = r;
        this.stroke = stroke;
        this.fill = fill;
    }
}
exports.Circle = Circle;
class Image {
    constructor(x, y, dx, dy, name, stroke) {
        this.x = x;
        this.y = y;
        this.dx = dx;
        this.dy = dy;
        this.name = name;
        this.stroke = stroke;
    }
}
exports.Image = Image;
class Rectangle {
    constructor(x, y, dx, dy, stroke) {
        this.x = x;
        this.y = y;
        this.dx = dx;
        this.dy = dy;
        this.stroke = stroke;
    }
}
exports.Rectangle = Rectangle;
class DragPoint {
    constructor(x, y, r, stroke) {
        this.x = x;
        this.y = y;
        this.r = r;
        this.stroke = stroke;
    }
}
exports.DragPoint = DragPoint;
// export type Shape =
//   Line | Arrow | Spring | Text | Circle | Rectangle | Image | DragPoint

},{}],7:[function(require,module,exports){
"use strict";
const c = require('cassowary');
class CassVar {
    constructor(name, value) {
        this.name = name;
        this._value = new c.Variable({ name: name, value: value });
    }
    toCExpr() { return c.Expression.fromVariable(this._value); }
}
exports.CassVar = CassVar;
class Primitive {
    constructor(name) {
        this.name = name;
    }
}
exports.Primitive = Primitive;
(function (VType) {
    VType[VType["Cass"] = 0] = "Cass";
    VType[VType["Prim"] = 1] = "Prim";
})(exports.VType || (exports.VType = {}));
var VType = exports.VType;

},{"cassowary":1}],8:[function(require,module,exports){
// immutable utility functions for sets and maps
// underlying objects are not deep-copied
"use strict";
// add an object to a set and return the result
function add(s, t) {
    let ret = new Set();
    s.forEach(e => ret.add(e));
    ret.add(t);
    return ret;
}
exports.add = add;
// union two sets together and returns the result
function union(l, r) {
    let ret = new Set();
    l.forEach(e => ret.add(e));
    r.forEach(e => ret.add(e));
    return ret;
}
exports.union = union;
// convert a set of tuples to a map
function toMap(tups) {
    let ret = new Map();
    tups.forEach(([k, v]) => ret.set(k, v));
    return ret;
}
exports.toMap = toMap;
// tuple lifters, mainly for clean let-bindings
// e.g. let [a, b, c] = [x, y, z].map(...)
function map3Tup(tup, f) {
    return tup.map(f);
}
exports.map3Tup = map3Tup;
function map4Tup(tup, f) {
    return tup.map(f);
}
exports.map4Tup = map4Tup;
// partition maps/sets
function partSet(vals, f) {
    let [trus, flses] = [new Set(), new Set()];
    for (let v of vals) {
        if (f(v))
            trus.add(v);
        else
            flses.add(v);
    }
    return [trus, flses];
}
exports.partSet = partSet;
function partMap(mp, f) {
    // I would convert the map to tuples, call partSet, and convert the result back to a map,
    // but then I'd be walking mp three times (when I only need to do it once).
    // JS needs map/fold fusion.
    let [trus, flses] = [new Map(), new Map()];
    for (let [k, v] of mp) {
        if (f([k, v]))
            trus.set(k, v);
        else
            flses.set(k, v);
    }
    return [trus, flses];
}
exports.partMap = partMap;
function filter(vals, f) {
    let [ret, _] = partSet(vals, f);
    return ret;
}
exports.filter = filter;
// copy the key-portion of a map. values are not copied.
function copy(vals) {
    return partMap(vals, _ => true)[0];
}
exports.copy = copy;
// test if there exists an element v of vals s.t. f v is true
// it's implementable using filter, but this version uses less memory and is usually
// quicker.
function exists(vals, f) {
    for (let v of vals) {
        if (f(v))
            return true;
    }
    return false;
}
exports.exists = exists;
// zip up two arrays into an array of tuples
// not sure what happens when arrays have different length... don't do it
function zip(ls, rs) {
    let mapper = (x, i) => [x, rs[i]];
    return ls.map(mapper);
}
exports.zip = zip;
exports.DEBUG = false;

},{}],9:[function(require,module,exports){
"use strict";
const S = require('../model/Shapes');
const U = require('../util/Util');
// given a context and shape, draw the shape on the context.
function drawShape(ctx, s, store) {
    // Line | Arrow | Spring | Text | Circle | Rectangle | Image | DragPoint
    if (s instanceof S.Line) {
        drawLine(ctx, s, store);
    }
    else if (s instanceof S.Arrow) {
        drawArrow(ctx, s, store);
    }
    else if (s instanceof S.Spring) {
        drawSpring(ctx, s, store);
    }
    else if (s instanceof S.Text) {
        drawText(ctx, s, store);
    }
    else if (s instanceof S.Circle) {
        drawCircle(ctx, s, store);
    }
    else if (s instanceof S.Rectangle) {
        drawRectangle(ctx, s, store);
    }
    else if (s instanceof S.Image) {
        let img = document.getElementById(s.name);
        drawImage(ctx, s, img, store);
    }
    else if (s instanceof S.DragPoint) {
        drawDragPoint(ctx, s, store);
    }
    else {
        console.log('unhandled shape for drawing: ' + s.toString());
        assert(false);
    }
}
exports.drawShape = drawShape;
// helper function: draw a line between the input points
function _drawLine(ctx, // canvas
    points, // input points
    close, // should the line be closed?
    stroke, // stroke color
    fill, // fill color
    dash // should the line be dashed?
    ) {
    close = close || false;
    stroke = stroke || "black";
    fill = fill || "rgba(0,0,0,0)";
    dash = dash || false;
    ctx.save();
    let len = points.length;
    if (len <= 1) {
        console.log('bad points argument to line:' + points.toString());
        return;
    }
    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    if (dash) {
        ctx.setLineDash([2, 2]);
    }
    ctx.beginPath();
    let fst = points[0];
    ctx.moveTo(fst[0], fst[1]);
    for (let [x, y] of points.slice(1)) {
        ctx.lineTo(x, y);
    }
    if (close) {
        ctx.fill();
    }
    ctx.stroke();
    ctx.restore();
}
// helper function: draw a triangle between the input points
function _drawTriangle(ctx, points, stroke, fill) {
    _drawLine(ctx, points.concat([points[0]]), true, stroke, fill);
}
function _drawCircle(ctx, x, y, r, stroke, fill) {
    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
}
// draw a (shape) line
function drawLine(ctx, line, store) {
    // we need to give an explicit typing to the map function to get the types to work out...
    let mapper = ([x, y]) => [store.get(x), store.get(y)];
    let pnts = line.points.map(mapper);
    _drawLine(ctx, pnts, false, line.stroke, "white", false);
}
function drawCircle(ctx, circ, store) {
    let [x, y, r] = U.map3Tup([circ.x, circ.y, circ.r], i => store.get(i));
    _drawCircle(ctx, x, y, r, circ.stroke, "green");
}
function drawImage(ctx, i, src, store) {
    ctx.save();
    let [x, y, dx, dy] = U.map4Tup([i.x, i.y, i.dx, i.dy], i => store.get(i));
    //x-w/2, y-h/2, w, h
    ctx.drawImage(src, x - dx, y - dy, 2 * dx, 2 * dy);
    ctx.restore();
}
function drawRectangle(ctx, r, store) {
    let [x, y, dx, dy] = U.map4Tup([r.x, r.y, r.dx, r.dy], i => store.get(i));
    let [x1, y1] = [x - dx, y - dy];
    let [x2, y2] = [x + dx, y + dy];
    let topLeft = [x1, y1], topRight = [x2, y1];
    let botRight = [x2, y2], botLeft = [x1, y2];
    _drawLine(ctx, [topLeft, topRight, botRight, botLeft, topLeft], true, r.stroke);
}
function drawArrow(ctx, arr, store) {
    let [x, y, dx, dy] = U.map4Tup([arr.x, arr.y, arr.dx, arr.dy], i => store.get(i));
    _drawLine(ctx, [[x, y], [x + dx, y + dy]], false, arr.stroke);
    // arrows are hard, adapted from here:
    // http://www.dbp-consulting.com/tutorials/canvas/CanvasArrow.html
    // x1 = x, y1 = y, x2 = x+dx, y2 = y+dy
    let angle = Math.PI / 8; // angle arrowhead makes with line
    let d = 20; // length of arrowhead hypotenuses
    // calculate the angle of the line
    let theta = Math.atan2(dy, dx);
    // h is the line length of a side of the arrow head
    let h = Math.abs(d / Math.cos(angle));
    // angle of top hypotenuse with +X axis
    let angle1 = theta + Math.PI + angle;
    // x, y coordinates of top corner
    let topx = x + dx + Math.cos(angle1) * h;
    let topy = y + dy + Math.sin(angle1) * h;
    // same calculations, but for bottom hypotenuse and corner
    let angle2 = theta + Math.PI - angle;
    let botx = x + dx + Math.cos(angle2) * h;
    let boty = y + dy + Math.sin(angle2) * h;
    _drawTriangle(ctx, [[x + dx, y + dy], [topx, topy], [botx, boty]], arr.stroke, arr.stroke);
}
function drawSpring(ctx, spring, store) {
    ctx.save();
    ctx.strokeStyle = spring.stroke;
    ctx.beginPath();
    let [x, y, dx, dy] = U.map4Tup([spring.x, spring.y, spring.dx, spring.dy], i => store.get(i));
    // it's all black magic and really only looks good for horizontal springs
    // intuition: draw a circle and translate over time.
    // circle drawing parameters
    let A = 10;
    let tau = Math.PI / 50;
    let deltay = -A * Math.cos(0);
    let offset = 0;
    let IMAX = 1000;
    let dist = 10;
    let theta = Math.atan2(dy, dx);
    let dx2 = dist * Math.cos(theta);
    let dy2 = dist * Math.sin(theta);
    ctx.lineTo(x, y);
    ctx.lineTo(x + dx2, y + dy2);
    // i == amount of translation
    for (let i = 100; i < IMAX - 100; ++i) {
        let p = x + i * (dx - dx2) / IMAX + A * Math.sin(tau * i + offset);
        let q = y + i * (dy - dy2) / IMAX + A * Math.cos(tau * i + offset);
        ctx.lineTo(p, q + deltay);
    }
    ctx.lineTo(x + dx, y + dy);
    ctx.stroke();
    ctx.restore();
}
function drawText(ctx, txt, store) {
    let [x, y] = [store.get(txt.x), store.get(txt.y)];
    ctx.save();
    ctx.font = txt.font;
    ctx.fillStyle = txt.stroke;
    ctx.fillText(txt.text, x, y);
    ctx.restore();
}
function drawDragPoint(ctx, point, store) {
    let [x, y, r] = U.map3Tup([point.x, point.y, point.r], i => store.get(i));
    _drawCircle(ctx, x, y, r, point.stroke, point.stroke);
}
// let foo: [number, number] = [1,2,'3']

},{"../model/Shapes":6,"../util/Util":8}],10:[function(require,module,exports){
"use strict";
const VS = require('./Shapes');
function renderModel(m) {
    let mainCanv = document.getElementById('physics');
    let mainCtx = mainCanv.getContext('2d');
    renderState(m.main, mainCtx);
}
exports.renderModel = renderModel;
// grab the variable values using eval and draw the model's shapes on the canvas
function renderState(s, ctx) {
    let vars = s.eval();
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    s.prog.shapes.forEach(s => {
        VS.drawShape(ctx, s, vars); // images.....
    });
}
class View {
}
exports.View = View;

},{"./Shapes":9}]},{},[3]);
