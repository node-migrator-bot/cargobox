var Class = require('classful')
	, path = require('path')
	, dirname = path.dirname
  	, basename = path.basename
  	, extname = path.extname
  	, exists = path.existsSync
  	, join = path.join
  	, utilities = require('./utilities');

/**
 * ==========================
 *        VIEW CLASS
 * ==========================
 */

var View = Class.create ({

    constructor: function (name, options){
		options = options || {};
		this.name = name;
		this.root = options.root;
		var engines = options.engines;
		this.defaultEngine = options.defaultEngine;
		var ext = this.ext = extname(name);
		if (!ext) name += (ext = this.ext = '.' + this.defaultEngine);
		this.engine = engines[ext] || (engines[ext] = require(ext.slice(1)).__express);
		this.path = this.lookup(name);
    },
    properties: {

    	/**
		* Lookup view by the given `path`
		*
		* @param {String} path
		* @return {String}
		* @api private
		*/

    	lookup: function(path){
		  var ext = this.ext;

		  // <path>.<engine>
		  if (!utilities.isAbsolute(path)) path = join(this.root, path);
		  if (exists(path)) return path;

		  // <path>/index.<engine>
		  path = join(dirname(path), basename(path, ext), 'index' + ext);
		  if (exists(path)) return path;
		}

		/**
		* Render with the given `options` and callback `fn(err, str)`.
		*
		* @param {Object} options
		* @param {Function} fn
		* @api private
		*/

		,render: function(options, fn){
			var self = this;
  			this.engine(this.path, options, function(err, res) {
  				var layout = options.layout || options.settings.defaultLayout;
  				if(layout != false) {
  					options.body = res;
  					console.log(options.settings);
  					self.engine(options.settings.views+'/'+options.layout+'.'+options.settings['view engine'], options, fn);
		        } else {
		            fn(err, res);
		        }
  			});
		}
    }
});

module.exports = View;