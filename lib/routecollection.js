var Class = require('classful');

/**
 * ==========================
 *   ROUTE COLLECTION CLASS
 * ==========================
 */

var RouteCollection = Class.create({
	constructor: function(value) {
		this.router = value;
	},
	properties: {
		__proto__: Array.prototype,
		remove: function(){
		  var router = this.router
		    , len = this.length
		    , ret = new RouteCollection(this.router);
		  for (var i = 0; i < len; ++i) {
		    if (router.remove(this[i])) {
		      ret.push(this[i]);
		    }
		  }
		  return ret;
		}
	}
});

module.exports = RouteCollection;