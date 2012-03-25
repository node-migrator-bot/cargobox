var Class = require('classful');

/**
 * ==========================
 *     SINGLE ROUTE CLASS
 * ==========================
 */

var Route = Class.create({
	constructor: function(method, path, callbacks, options) {
		options = options || {};
		this.path = path;
		this.method = method;
		this.callbacks = callbacks;
		this.regexp = this.normalize(path
		, this.keys = []
		, options.sensitive
		, options.strict);
	},
	properties: {
		match: function(path){
  			return this.regexp.exec(path);
		},
		normalize: function(path, keys, sensitive, strict) {
		  if (path instanceof RegExp) return path;
		  if (path instanceof Array)
		   path = '(' + path.join('|') + ')';
		  path = path
		    .concat(strict ? '' : '/?')
		    .replace(/\/\(/g, '(?:/')
		    .replace(/(\/)?(\.)?:(\w+)(?:(\(.*?\)))?(\?)?/g, function(_, slash, format, key, capture, optional){
		      keys.push({ name: key, optional: !! optional });
		      slash = slash || '';
		      return ''
		        + (optional ? '' : slash)
		        + '(?:'
		        + (optional ? slash : '')
		        + (format || '') + (capture || (format && '([^/.]+?)' || '([^/]+?)')) + ')'
		        + (optional || '');
		    })
		    .replace(/([\/.])/g, '\\$1')
		    .replace(/\*/g, '(.*)');
		  return new RegExp('^' + path + '$', sensitive ? '' : 'i');
		}
	}
});

module.exports = Route;