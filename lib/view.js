var Class = require('classful')
	, path = require('path')
	, dirname = path.dirname
  	, basename = path.basename
  	, extname = path.extname
  	, exists = path.existsSync
  	, join = path.join
  	, utilities = require('./utilities')
  	, utils = require('connect').utils;

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
		this.defaultLayout = options.defaultLayout;
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
		* Supports layouts: { layout: 'path/to/layout' }
		*
		* @param {Object} options
		* @param {Function} fn
		* @api private
		*/
		
		,render: function(options, fn){
			var self = this;
  			this.engine(this.path, options, function(err, res) {

  				var layout = options.layout || self.defaultLayout;
  				var extension = options.engine || self.defaultEngine;

  				options.render = function(locpath, opts) {
  					var local = options;
  					if (opts) utils.merge(local, opts);
  					var localext = local.engine || self.defaultEngine;
  					console.log('sub view ', local.settings.views+'/'+locpath+'.'+localext);

					var x = self.engine(local.settings.views+'/'+locpath+'.'+localext, local);
					console.log(x, '<<>>><<<');
					return x;
				};	

  				if(layout != false) {
  					options.body = res;
  					self.engine(options.settings.views+'/'+layout+'.'+extension, options, fn);
		        } else {
		            fn(err, res);
		        }
  			});
		}
    }
});

module.exports = View;