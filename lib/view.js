
/*!
 * Express - View
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var path = require('path')
  , utils = require('./utils')
  , fs = require('fs')
  , dirname = path.dirname
  , basename = path.basename
  , extname = path.extname
  , exists = fs.existsSync
  , join = path.join;

/**
 * Expose `View`.
 */

module.exports = View;

/**
 * Initialize a new `View` with the given `name`.
 *
 * Options:
 *
 *   - `defaultEngine` the default template engine name 
 *   - `engines` template engine require() cache 
 *   - `root` root path for view lookup 
 *
 * @param {String} name
 * @param {Object} options
 * @api private
 */

function View(name, options) {
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
}

/**
 * Lookup view by the given `path`
 *
 * @param {String} path
 * @return {String}
 * @api private
 */

View.prototype.lookup = function(path){
  var ext = this.ext;

  // <path>.<engine>
  if (!utils.isAbsolute(path)) path = join(this.root, path);
  if (exists(path)) return path;

  // <path>/index.<engine>
  path = join(dirname(path), basename(path, ext), 'index' + ext);
  if (exists(path)) return path;
};

/**
 * Render with the given `options` and callback `fn(err, str)`.
 *
 * @param {Object} options
 * @param {Function} fn
 * @api private
 */

View.prototype.render = function(options, fn){
  //this.engine(this.path, options, fn);
  var self = this;
    
  self.engine(self.path, options, function(err, res) {

    var layout;
    if(options.layout == false) {
      layout = false;
    } else {
      layout = options.layout || self.defaultLayout;
    }
    
    var extension = options.engine || self.defaultEngine;

    /* Expose render function to views for subview rendering */
    options.render = function(locpath, opts) {
      var local = options;
      if (opts) utils.merge(local, opts);
      var localext = local.engine || self.defaultEngine;
      var result;
      while(result == undefined) {
        try {
        self.engine(local.settings.views+'/'+locpath+'.'+localext, local, function(lerr, lres) {
            if(lerr) result = lerr;
        });
        result = lres;
        } catch(eall) {
            console.log(eall);
          }
    }
    return result;
  };
    if(layout != false) {
      try {
        options.body = res;
        self.engine(options.settings.views+'/'+layout+'.'+extension, options, fn);
        } catch(eall) {
          console.log(eall);
        }
      } else {
          fn(err, res);
      }
  });
};
