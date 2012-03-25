
var Class = require('classful')
  , connect = require('connect')
  , http = require('http')
  , fs = require('fs')
  , path = require('path')
  , dirname = path.dirname
  , basename = path.basename
  , extname = path.extname
  , exists = path.existsSync
  , parse = require('url').parse
  , utils = connect.utils
  , utilities = require('./utils')
  , normalizeType = utilities.normalizeType
  , normalizeTypes = utilities.normalizeTypes
  , statusCodes = http.STATUS_CODES
  , send = connect.static.send
  , mime = require('mime')
  , basename = path.basename
  , join = path.join;

var methods = [
	'get'
	, 'post'
	, 'put'
	, 'head'
	, 'delete'
	, 'options'
	, 'trace'
	, 'copy'
	, 'lock'
	, 'mkcol'
	, 'move'
	, 'propfind'
	, 'proppatch'
	, 'unlock'
	, 'report'
	, 'mkactivity'
	, 'checkout'
	, 'merge'
	, 'm-search'
	, 'notify'
	, 'subscribe'
	, 'unsubscribe'
	, 'patch'
];

var CargoBox = (function (){
	
	var _app;
	var _server;
	var _router;
	var _routes;
	var _version = '0.0.2';

	var _foo = function (foo){ return foo + foo; };
	var _bar = function (n){ return n + 1; };

	return Class.create ({

	    constructor: function (){

	    	console.log('cargobox '+_version+' says hello');

	    	var self = this;
			this.cache = {};
			this.settings = {};
			this.engines = {};
			this.viewCallbacks = [];

	    	_app = connect();
	    	_app.request = { __proto__: Request.prototype };
  			_app.response = { __proto__: Response.prototype };
  			_app.use(this.plugins.query());
	    	_app.use(this.middleware());

	    	_router = new Router();
	    	_routes = _router.routes;

			this.__defineGetter__('router', function(){
				_usedRouter = true;
				_router.caseSensitive = this.enabled('case sensitive routing');
				_router.strict = this.enabled('strict routing');
				return _router.middleware;
			});

			var m = methods;
			m.concat('del', 'all');
	    	m.forEach(function(method){
			  self[method] = function(path){
			    if ('get' == method && 1 == arguments.length) return self.set(path);
			    var args = [method].concat([].slice.call(arguments));
			    if (!_usedRouter) self.use(self.router);
			    return _router.route.apply(_router, args);
			  }
			});

			// app locals
			this.locals = function(obj){
				for (var key in obj) self.locals[key] = obj[key];
				return self;
			};

			// response locals
			this.locals.use = function(fn){
				if (3 == fn.length) {
				  self.viewCallbacks.push(fn);
				} else {
				  self.viewCallbacks.push(function(req, res, done){
				    fn(req, res);
				    done();
				  });
				}
				return this;
			};

			// default locals
			this.locals.settings = this.settings;

			// default configuration
			this.configure('development', function(){
				this.set('json spaces', 2);
			});

			this.configure('production', function(){
				this.enable('view cache');
			});
	    },
	    properties: {

	    	plugins: {
	    		csrf             : connect.csrf
				,basicAuth       : connect.basicAuth
				,bodyParser      : connect.bodyParser
				,json            : connect.json
				,multipart       : connect.multipart
				,urlencoded      : connect.urlencoded
				,cookieParser    : connect.cookieParser
				,directory       : connect.directory
				,compress        : connect.compress
				,errorHandler    : connect.errorHandler
				,favicon         : connect.favicon
				,limit           : connect.limit
				,logger          : connect.logger
				,methodOverride  : connect.methodOverride
				,query           : connect.query
				,responseTime    : connect.responseTime
				,session         : connect.session
				,static          : connect.static
				,staticCache     : connect.staticCache
				,vhost           : connect.vhost
				,subdomains      : connect.subdomains
				,cookieSession   : connect.cookieSession
	    	}

	    	,middleware: function(){
	    		var self = this;
	    		return function(req, res, next){
				    res.setHeader('X-Powered-By', 'cargobox');
				    req.app = res.app = self;
				    req.res = res;
				    res.req = req;
				    req.next = next;
				    req.__proto__ = _app.request;
    				res.__proto__ = _app.response;
    				req.__setup__();
				    next();
				}
	    	}

			,use: function(route, fn) {
	        	_app.use(route, fn);
	        	return this;
	        }

			/**
			* Remove routes matching the given `path`.
			*
			* @param {Route} path
			* @return {Boolean}
			* @api public
			*/

			,remove : function(path){
			  return this._router.lookup('all', path).remove();
			}

			/**
			* Lookup routes defined with a path
			* equivalent to `path`.
			*
			* @param {String} path
			* @return {Array}
			* @api public
			*/

			,lookup : function(path){
			  return this._router.lookup('all', path);
			}

			/**
			* Proxy `connect#use()` to apply settings to
			* mounted applications.
			*
			* @param {String|Function|Server} route
			* @param {Function|Server} fn
			* @return {app} for chaining
			* @api public


			,use : function(route, fn){
			  var app, home, handle;

			  // default route to '/'
			  if ('string' != typeof route) fn = route, route = '/';

			  // express app
			  if (fn.handle && fn.set) app = fn;

			  // restore .app property on req and res
			  if (app) {
			    app.route = route;
			    fn = function(req, res, next) {
			      var orig = req.app;
			      app.handle(req, res, function(err){
			        req.app = res.app = orig;
			        next(err);
			      });
			    };
			  }

			  //debug('use %s %s', route, fn.name || 'unnamed');
			  connect.proto.use.call(this, route, fn);

			  // mounted an app
			  if (app) {
			    app.parent = this;
			    app.emit('mount', this);
			  }

			  return this;
			}
			*/


			/**
			* Register the given template engine callback `fn`
			* as `ext`. For example we may wish to map ".html"
			* files to ejs rather than using the ".ejs" extension.
			*
			* app.engine('.html', require('ejs').render);
			*
			* or
			*
			* app.engine('html', require('ejs').render);
			*
			* @param {String} ext
			* @param {Function} fn
			* @return {app} for chaining
			* @api public
			*/

			,engine : function(ext, fn){
			  if ('.' != ext[0]) ext = '.' + ext;
			  this.engines[ext] = fn;
			  return this;
			}

			/**
			* Map the given param placeholder `name`(s) to the given callback(s).
			*
			* Param mapping is used to provide pre-conditions to routes
			* which us normalized placeholders. This callback has the same
			* signature as regular middleware, for example below when ":userId"
			* is used this function will be invoked in an attempt to load the user.
			*
			* app.param('userId', function(req, res, next, id){
			* User.find(id, function(err, user){
			* if (err) {
			* next(err);
			* } else if (user) {
			* req.user = user;
			* next();
			* } else {
			* next(new Error('failed to load user'));
			* }
			* });
			* });
			*
			* Passing a single function allows you to map logic
			* to the values passed to `app.param()`, for example
			* this is useful to provide coercion support in a concise manner.
			*
			* The following example maps regular expressions to param values
			* ensuring that they match, otherwise passing control to the next
			* route:
			*
			* app.param(function(name, regexp){
			* if (regexp instanceof RegExp) {
			* return function(req, res, next, val){
			* var captures;
			* if (captures = regexp.exec(String(val))) {
			* req.params[name] = captures;
			* next();
			* } else {
			* next('route');
			* }
			* }
			* }
			* });
			*
			* We can now use it as shown below, where "/commit/:commit" expects
			* that the value for ":commit" is at 5 or more digits. The capture
			* groups are then available as `req.params.commit` as we defined
			* in the function above.
			*
			* app.param('commit', /^\d{5,}$/);
			*
			* For more of this useful functionality take a look
			* at [express-params](http://github.com/visionmedia/express-params).
			*
			* @param {String|Array|Function} name
			* @param {Function} fn
			* @return {app} for chaining
			* @api public
			*/

			,param : function(name, fn){
			  var self = this
			    , fns = [].slice.call(arguments, 1);

			  // array
			  if (Array.isArray(name)) {
			    name.forEach(function(name){
			      fns.forEach(function(fn){
			        self.param(name, fn);
			      });
			    });
			  // param logic
			  } else if ('function' == typeof name) {
			    this._router.param(name);
			  // single
			  } else {
			    if (':' == name[0]) name = name.substr(1);
			    fns.forEach(function(fn){
			      self._router.param(name, fn);
			    });
			  }

			  return this;
			}

			/**
			* Assign `setting` to `val`, or return `setting`'s value.
			* Mounted servers inherit their parent server's settings.
			*
			* @param {String} setting
			* @param {String} val
			* @return {Server|Mixed} for chaining, or the setting value
			* @api public
			*/

			,set : function(setting, val){
			  if (1 == arguments.length) {
			    if (this.settings.hasOwnProperty(setting)) {
			      return this.settings[setting];
			    } else if (this.parent) {
			      return this.parent.set(setting);
			    }
			  } else {
			    this.settings[setting] = val;
			    return this;
			  }
			}

			/**
			* Return the app's absolute pathname
			* based on the parent(s) that have
			* mounted it.
			*
			* @return {String}
			* @api private
			*/

			,path : function(){
			  return this.parent
			    ? this.parent.path() + this.route
			    : '';
			}

			/**
			* Check if `setting` is enabled.
			*
			* @param {String} setting
			* @return {Boolean}
			* @api public
			*/

			,enabled : function(setting){
			  return !!this.set(setting);
			}

			/**
			* Check if `setting` is disabled.
			*
			* @param {String} setting
			* @return {Boolean}
			* @api public
			*/

			,disabled : function(setting){
			  return !this.set(setting);
			}

			/**
			* Enable `setting`.
			*
			* @param {String} setting
			* @return {app} for chaining
			* @api public
			*/

			,enable : function(setting){
			  return this.set(setting, true);
			}

			/**
			* Disable `setting`.
			*
			* @param {String} setting
			* @return {app} for chaining
			* @api public
			*/

			,disable : function(setting){
			  return this.set(setting, false);
			}

			/**
			* Configure callback for zero or more envs,
			* when no env is specified that callback will
			* be invoked for all environments. Any combination
			* can be used multiple times, in any order desired.
			*
			* Examples:
			*
			* app.configure(function(){
			* // executed for all envs
			* });
			*
			* app.configure('stage', function(){
			* // executed staging env
			* });
			*
			* app.configure('stage', 'production', function(){
			* // executed for stage and production
			* });
			*
			* @param {String} env...
			* @param {Function} fn
			* @return {app} for chaining
			* @api public
			*/

			,configure : function(env, fn){
			  var envs = 'all'
			    , args = [].slice.call(arguments);
			  fn = args.pop();
			  if (args.length) envs = args;
			  if ('all' == envs || ~envs.indexOf(this.settings.env)) fn.call(this);
			  return this;
			}

			/**
			* Listen for connections.
			*
			* This method takes the same arguments
			* as node's `http.Server#listen()`.
			*
			* @return {http.Server}
			* @api public
			*/

			,listen: function() {
	        	_server = http.createServer(_app);
	        	_server.listen.apply(_server, arguments);
	        }

			/**
			* Special-cased "all" method, applying the given route `path`,
			* middleware, and callback to _every_ HTTP method.
			*
			* @param {String} path
			* @param {Function} ...
			* @return {app} for chaining
			* @api public
			*/

			,all : function(path){
			  var args = arguments;
			  methods.forEach(function(method){
			    if ('all' == method || 'del' == method) return;
			    app[method].apply(this, args);
			  }, this);
			  return this;
			}

			// del -> delete alias



			/**
			* Render the given view `name` name with `options`
			* and a callback accepting an error and the
			* rendered template string.
			*
			* @param {String} name
			* @param {String|Function} options or fn
			* @param {Function} fn
			* @api public
			*/

			,render : function(name, options, fn){
			  var self = this
			    , opts = {}
			    , cache = this.cache
			    , engines = this.engines
			    , view;

			  // support callback function as second arg
			  if ('function' == typeof options) {
			    fn = options, options = {};
			  }

			  // merge app.locals
			  utils.merge(opts, this.locals);

			  // merge options.locals
			  if (options.locals) utils.merge(opts, options.locals);

			  // merge options
			  utils.merge(opts, options);

			  // set .cache unless explicitly provided
			  opts.cache = null == opts.cache
			    ? this.enabled('view cache')
			    : opts.cache;

			  // primed cache
			  if (opts.cache) view = cache[name];

			  // view
			  if (!view) {
			    view = new View(name, {
			        defaultEngine: this.get('view engine')
			      , root: this.get('views') || process.cwd() + '/views'
			      , engines: engines
			    });

			    // prime the cache
			    if (opts.cache) cache[name] = view;
			  }

			  // render
			  try {
			    view.render(opts, fn);
			  } catch (err) {
			    fn(err);
			  }
			}


	    }
	});
})();


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

/**
 * ==========================
 *       ROUTER CLASS
 * ==========================
 */

var Router = Class.create ({

	constructor: function(options) {
		options = options || {};
		var self = this;
		this.routes = new RouteCollection();
		this.map = {};
		this.params = {};
		this._params = [];
		this.caseSensitive = options.caseSensitive;
		this.strict = options.strict;
		this.middleware = function router(req, res, next){
		    self._dispatch(req, res, next);
		};
	},

    properties: {

    	/**
		* Register a param callback `fn` for the given `name`.
		*
		* @param {String|Function} name
		* @param {Function} fn
		* @return {Router} for chaining
		* @api public
		*/

		param: function(name, fn){
		  // param logic
		  if ('function' == typeof name) {
		    this._params.push(name);
		    return;
		  }

		  // apply param functions
		  var params = this._params
		    , len = params.length
		    , ret;

		  for (var i = 0; i < len; ++i) {
		    if (ret = params[i](name, fn)) {
		      fn = ret;
		    }
		  }

		  // ensure we end up with a
		  // middleware function
		  if ('function' != typeof fn) {
		    throw new Error('invalid param() call for ' + name + ', got ' + fn);
		  }

		  (this.params[name] = this.params[name] || []).push(fn);
		  return this;
		}

		/**
		* Return a `RouteCollection` of all routes defined.
		*
		* @return {RouteCollection}
		* @api public
		*/

		,all : function(){
		  return this.find(function(){
		    return true;
		  });
		}

		/**
		* Remove the given `route`, returns
		* a bool indicating if the route was present
		* or not.
		*
		* @param {Route} route
		* @return {Boolean}
		* @api public
		*/

		,remove: function(route){
		  var routes = this.map[route.method]
		    , len = routes.length;

		  // remove from array
		  var i = this.routes.indexOf(route);
		  this.routes.splice(i, 1);

		  // remove from map
		  for (var i = 0; i < len; ++i) {
		    if (route == routes[i]) {
		      routes.splice(i, 1);
		      return true;
		    }
		  }
		}

		/**
		* Return routes with route paths matching `path`.
		*
		* @param {String} method
		* @param {String} path
		* @return {RouteCollection}
		* @api public
		*/

		,lookup : function(method, path){
		  return this.find(function(route){
		    return path == route.path
		      && (route.method == method
		      || method == 'all');
		  });
		}

		// /**
		// * Return routes with regexps that match the given `url`.
		// *
		// * @param {String} method
		// * @param {String} url
		// * @return {RouteCollection}
		// * @api public
		// */
		//
		// Router.prototype.match = function(method, url){
		// return this.find(function(route){
		// return route.match(url)
		// && (route.method == method
		// || method == 'all');
		// });
		// };

		/**
		* Find routes based on the return value of `fn`
		* which is invoked once per route.
		*
		* @param {Function} fn
		* @return {RouteCollection}
		* @api public
		*/

		,find : function(fn){
		  var len = methods.length
		    , ret = new RouteCollection(this)
		    , method
		    , routes
		    , route;

		  for (var i = 0; i < len; ++i) {
		    method = methods[i];
		    routes = this.map[method];
		    if (!routes) continue;
		    for (var j = 0, jlen = routes.length; j < jlen; ++j) {
		      route = routes[j];
		      if (fn(route)) ret.push(route);
		    }
		  }

		  return ret;
		}

		/**
		* Route dispatcher aka the route "middleware".
		*
		* @param {IncomingMessage} req
		* @param {ServerResponse} res
		* @param {Function} next
		* @api private
		*/

		,_dispatch : function(req, res, next){
		  var params = this.params
		    , self = this;

		  //debug('dispatching %s %s', req.method, req.url);

		  // route dispatch
		  (function pass(i, err){
		    var paramCallbacks
		      , paramIndex = 0
		      , paramVal
		      , route
		      , keys
		      , key
		      , ret;

		    // match next route
		    function nextRoute(err) {
		      pass(req._route_index + 1, err);
		    }

		    // match route
		    req.route = route = self.match(req, i);

		    // implied OPTIONS
		    if (!route && 'OPTIONS' == req.method) return self._options(req, res);

		    // no route
		    if (!route) return next(err);
		    //debug('matched %s %s', route.method, route.path);

		    // we have a route
		    // start at param 0
		    req.params = route.params;
		    keys = route.keys;
		    i = 0;

		    // param callbacks
		    function param(err) {
		      paramIndex = 0;
		      key = keys[i++];
		      paramVal = key && req.params[key.name];
		      paramCallbacks = key && params[key.name];

		      try {
		        if ('route' == err) {
		          nextRoute();
		        } else if (err) {
		          i = 0;
		          callbacks(err);
		        } else if (paramCallbacks && undefined !== paramVal) {
		          paramCallback();
		        } else if (key) {
		          param();
		        } else {
		          i = 0;
		          callbacks();
		        }
		      } catch (err) {
		        param(err);
		      }
		    };

		    param(err);
		    
		    // single param callbacks
		    function paramCallback(err) {
		      var fn = paramCallbacks[paramIndex++];
		      if (err || !fn) return param(err);
		      fn(req, res, paramCallback, paramVal, key.name);
		    }

		    // invoke route callbacks
		    function callbacks(err) {
		      var fn = route.callbacks[i++];
		      try {
		        if ('route' == err) {
		          nextRoute();
		        } else if (err && fn) {
		          if (fn.length < 4) return callbacks(err);
		          fn(err, req, res, callbacks);
		        } else if (fn) {
		          fn(req, res, callbacks);
		        } else {
		          nextRoute(err);
		        }
		      } catch (err) {
		        callbacks(err);
		      }
		    }
		  })(0);
		}

		/**
		* Respond to __OPTIONS__ method.
		*
		* @param {IncomingMessage} req
		* @param {ServerResponse} res
		* @api private
		*/

		,_options : function(req, res){
		  var path = parse(req.url).pathname
		    , body = this._optionsFor(path).join(',');
		  res.set('Allow', body).send(body);
		}

		/**
		* Return an array of HTTP verbs or "options" for `path`.
		*
		* @param {String} path
		* @return {Array}
		* @api private
		*/

		,_optionsFor : function(path){
		  var self = this;
		  return methods.filter(function(method){
		    var routes = self.map[method];
		    if (!routes || 'options' == method) return;
		    for (var i = 0, len = routes.length; i < len; ++i) {
		      if (routes[i].match(path)) return true;
		    }
		  }).map(function(method){
		    return method.toUpperCase();
		  });
		}

		/**
		* Attempt to match a route for `req`
		* with optional starting index of `i`
		* defaulting to 0.
		*
		* @param {IncomingMessage} req
		* @param {Number} i
		* @return {Route}
		* @api private
		*/

		,match : function(req, i, head){
		  var method = req.method.toLowerCase()
		    , url = parse(req.url)
		    , path = url.pathname
		    , routes = this.map
		    , i = i || 0
		    , captures
		    , route
		    , keys;

		  // HEAD support
		  // TODO: clean this up
		  if (!head && 'head' == method) {
		    // attempt lookup
		    route = this.match(req, i, true);
		    if (route) return route;

		    // default to GET as res.render() / res.send()
		    // etc support HEAD
		     method = 'get';
		  }

		  // routes for this method
		  if (routes = routes[method]) {

		    // matching routes
		    for (var len = routes.length; i < len; ++i) {
		      route = routes[i];
		      if (captures = route.match(path)) {
		        keys = route.keys;
		        route.params = [];

		        // params from capture groups
		        for (var j = 1, jlen = captures.length; j < jlen; ++j) {
		          var key = keys[j-1]
		            , val = 'string' == typeof captures[j]
		              ? decodeURIComponent(captures[j])
		              : captures[j];
		          if (key) {
		            route.params[key.name] = val;
		          } else {
		            route.params.push(val);
		          }
		        }

		        // all done
		        req._route_index = i;
		        return route;
		      }
		    }
		  }
		}

		/**
		* Route `method`, `path`, and one or more callbacks.
		*
		* @param {String} method
		* @param {String} path
		* @param {Function} callback...
		* @return {Router} for chaining
		* @api private
		*/

		,route : function(method, path, callbacks){
		  var app = this.app
		    , method = method.toLowerCase()
		    , callbacks = utilities.flatten([].slice.call(arguments, 2));

		  // ensure path was given
		  if (!path) throw new Error('Router#' + method + '() requires a path');

		  // create the route
		  //debug('defined %s %s', method, path);
		  var route = new Route(method, path, callbacks, {
		      sensitive: this.caseSensitive
		    , strict: this.strict
		  });

		  // add it
		  (this.map[method] = this.map[method] || []).push(route);
		  this.routes.push(route);
		  return this;
		}
    }
});

/**
 * ==========================
 *    HTTP REQUEST CLASS
 * ==========================
 */

var Request = Class.create ({
    properties: {
    	__proto__: http.IncomingMessage.prototype,
    	__setup__: function() {

			/**
			* Return an array of Accepted media types
			* ordered from highest quality to lowest.
			*
			* Examples:
			*
			* [ { value: 'application/json',
			* quality: 1,
			* type: 'application',
			* subtype: 'json' },
			* { value: 'text/html',
			* quality: 0.5,
			* type: 'text',
			* subtype: 'html' } ]
			*
			* @return {Array}
			* @api public
			*/

			this.__defineGetter__('accepted', function(){
			  var accept = this.get('Accept');
			  return accept
			    ? utilities.parseAccept(accept)
			    : [];
			});

			/**
			* Return an array of Accepted languages
			* ordered from highest quality to lowest.
			*
			* Examples:
			*
			* Accept-Language: en;q=.5, en-us
			* ['en-us', 'en']
			*
			* @return {Array}
			* @api public
			*/

			this.__defineGetter__('acceptedLanguages', function(){
			  var accept = this.get('Accept-Language');
			  return accept
			    ? utilities
			      .parseQuality(accept)
			      .map(function(obj){
			        return obj.value;
			      })
			    : [];
			});

			/**
			* Return an array of Accepted charsets
			* ordered from highest quality to lowest.
			*
			* Examples:
			*
			* Accept-Charset: iso-8859-5;q=.2, unicode-1-1;q=0.8
			* ['unicode-1-1', 'iso-8859-5']
			*
			* @return {Array}
			* @api public
			*/

			this.__defineGetter__('acceptedCharsets', function(){
			  var accept = this.get('Accept-Charset');
			  return accept
			    ? utilities
			      .parseQuality(accept)
			      .map(function(obj){
			        return obj.value;
			      })
			    : [];
			});

			/**
			* Return the protocol string "http" or "https"
			* when requested with TLS. When the "trust proxy"
			* setting is enabled the "X-Forwarded-Proto" header
			* field will be trusted. If you're running behind
			* a reverse proxy that supplies https for you this
			* may be enabled.
			*
			* @return {String}
			* @api public
			*/

			this.__defineGetter__('protocol', function(trustProxy){
			  var trustProxy = this.app.settings['trust proxy'];
			  return this.secure
			    ? 'https'
			    : trustProxy
			      ? (this.get('X-Forwarded-Proto') || 'http')
			      : 'http';
			});

			/**
			* Short-hand for `req.connection.encrypted`.
			*
			* @return {Boolean}
			* @api public
			*/

			this.__defineGetter__('secure', function(){
			  return this.connection.encrypted;
			});

			/**
			* Return subdomains as an array.
			*
			* For example "tobi.ferrets.example.com"
			* would provide `["ferrets", "tobi"]`.
			*
			* @return {Array}
			* @api public
			*/

			this.__defineGetter__('subdomains', function(){
			  return this.get('Host')
			    .split('.')
			    .slice(0, -2)
			    .reverse();
			});

			/**
			* Short-hand for `require('url').parse(req.url).pathname`.
			*
			* @return {String}
			* @api public
			*/

			this.__defineGetter__('path', function(){
			  return parse(this.url).pathname;
			});

			/**
			* Check if the request is fresh, aka
			* Last-Modified and/or the ETag
			* still match.
			*
			* @return {Boolean}
			* @api public
			*/

			this.__defineGetter__('fresh', function(){
			  return ! this.stale;
			});

			/**
			* Check if the request is stale, aka
			* "Last-Modified" and / or the "ETag" for the
			* resource has changed.
			*
			* @return {Boolean}
			* @api public
			*/

			this.__defineGetter__('stale', function(){
			  return connect.utils.modified(this, this.res);
			});

			/**
			* Check if the request was an _XMLHttpRequest_.
			*
			* @return {Boolean}
			* @api public
			*/

			this.__defineGetter__('xhr', function(){
			  var val = this.get('X-Requested-With') || '';
			  return 'xmlhttprequest' == val.toLowerCase();
			});
    	}

		/**
		* Return request header.
		*
		* The `Referrer` header field is special-cased,
		* both `Referrer` and `Referer` will yield are
		* interchangeable.
		*
		* Examples:
		*
		* req.get('Content-Type');
		* // => "text/plain"
		*
		* req.get('content-type');
		* // => "text/plain"
		*
		* req.get('Something');
		* // => undefined
		*
		* @param {String} name
		* @return {String}
		* @api public
		*/

		,get: function(name){
		  switch (name = name.toLowerCase()) {
		    case 'referer':
		    case 'referrer':
		      return this.headers.referrer
		        || this.headers.referer;
		    default:
		      return this.headers[name];
		  }
		}

		/**
		* Check if the given `type(s)` is acceptable, returning
		* the best match when true, otherwise `undefined`, in which
		* case you should respond with 406 "Not Acceptable".
		*
		* The `type` value may be a single mime type string
		* such as "application/json", the extension name
		* such as "json", a comma-delimted list such as "json, html, text/plain",
		* or an array `["json", "html", "text/plain"]`. When a list
		* or array is given the _best_ match, if any is returned.
		*
		* Examples:
		*
		* // Accept: text/html
		* req.accepts('html');
		* // => "html"
		*
		* // Accept: text/*; application/json
		* req.accepts('html');
		* // => "html"
		* req.accepts('text/html');
		* // => "text/html"
		* req.accepts('json, text');
		* // => "json"
		* req.accepts('application/json');
		* // => "application/json"
		*
		* // Accept: text/*; application/json
		* req.accepts('image/png');
		* req.accepts('png');
		* // => undefined
		*
		* // Accept: text/*;q=.5 application/json
		* req.accepts(['html', 'json']);
		* req.accepts('html, json');
		* // => "json"
		*
		* @param {String|Array} type(s)
		* @return {String}
		* @api public
		*/

		,accepts: function(type){
		  return utilities.accepts(type, this.get('Accept'));
		}

		/**
		* Check if the given `charset` is acceptable,
		* otherwise you should respond with 406 "Not Acceptable".
		*
		* @param {String} charset
		* @return {Boolean}
		* @api public
		*/

		,acceptsCharset: function(charset){
		  var accepted = this.acceptedCharsets;
		  return accepted.length
		    ? ~accepted.indexOf(charset)
		    : true;
		}

		/**
		* Check if the given `lang` is acceptable,
		* otherwise you should respond with 406 "Not Acceptable".
		*
		* @param {String} lang
		* @return {Boolean}
		* @api public
		*/

		,acceptsLanguage : function(lang){
		  var accepted = this.acceptedLanguages;
		  return accepted.length
		    ? ~accepted.indexOf(lang)
		    : true;
		}

		/**
		* Return the value of param `name` when present or `defaultValue`.
		*
		* - Checks body params, ex: id=12, {"id":12}
		* - Checks route placeholders, ex: _/user/:id_
		* - Checks query string params, ex: ?id=12
		*
		* To utilize request bodies, `req.body`
		* should be an object. This can be done by using
		* the `connect.bodyParser()` middleware.
		*
		* @param {String} name
		* @param {Mixed} defaultValue
		* @return {String}
		* @api public
		*/

		,param : function(name, defaultValue){
		  // req.body
		  if (this.body && undefined !== this.body[name]) return this.body[name];

		  // route params
		  if (this.params
		    && this.params.hasOwnProperty(name)
		    && undefined !== this.params[name]) {
		    return this.params[name];
		  }

		  // query-string
		  if (undefined !== this.query[name]) return this.query[name];

		  return defaultValue;
		}

		/**
		* Check if the incoming request contains the "Content-Type"
		* header field, and it contains the give mime `type`.
		*
		* Examples:
		*
		* // With Content-Type: text/html; charset=utf-8
		* req.is('html');
		* req.is('text/html');
		* req.is('text/*');
		* // => true
		*
		* // When Content-Type is application/json
		* req.is('json');
		* req.is('application/json');
		* req.is('application/*');
		* // => true
		*
		* req.is('html');
		* // => false
		*
		* Now within our route callbacks, we can use to to assert content types
		* such as "image/jpeg", "image/png", etc.
		*
		* app.post('/image/upload', function(req, res, next){
		* if (req.is('image/*')) {
		* // do something
		* } else {
		* next();
		* }
		* });
		*
		* @param {String} type
		* @return {Boolean}
		* @api public
		*/

		,is : function(type){
		  var ct = this.get('Content-Type');
		  if (!ct) return false;
		  ct = ct.split(';')[0];
		  if (!~type.indexOf('/')) type = mime.lookup(type);
		  if (~type.indexOf('*')) {
		    type = type.split('/');
		    ct = ct.split('/');
		    if ('*' == type[0] && type[1] == ct[1]) return true;
		    if ('*' == type[1] && type[0] == ct[0]) return true;
		    return false;
		  }
		  return !! ~ct.indexOf(type);
		}
    }
});

/**
 * ==========================
 *    HTTP RESPONSE CLASS
 * ==========================
 */

var Response = Class.create ({
    properties: {
    	__proto__: http.ServerResponse.prototype

    	/**
		* Set status `code`.
		*
		* @param {Number} code
		* @return {ServerResponse}
		* @api public
		*/

		,status: function(code){
		  this.statusCode = code;
		  return this;
		}

		/**
		* Set Cache-Control to the given `type` and `options`.
		*
		* Options:
		*
		* - `maxAge` in milliseconds
		*
		* @param {String} type
		* @param {Object} options
		* @return {ServerResponse}
		* @api public
		*/

		,cache: function(type, options){
		  var val = type;
		  options = options || {};
		  if (options.maxAge) val += ', max-age=' + (options.maxAge / 1000);
		  return this.set('Cache-Control', val);
		}

		/**
		* Send a response.
		*
		* Examples:
		*
		* res.send(new Buffer('wahoo'));
		* res.send({ some: 'json' });
		* res.send('<p>some html</p>');
		* res.send(404, 'Sorry, cant find that');
		* res.send(404);
		*
		* @param {Mixed} body or status
		* @param {Mixed} body
		* @return {ServerResponse}
		* @api public
		*/

		,send: function(body){
		  var req = this.req
		    , head = 'HEAD' == req.method;

		  // allow status / body
		  if (2 == arguments.length) {
		    this.statusCode = body;
		    body = arguments[1];
		  }

		  switch (typeof body) {
		    // response status
		    case 'number':
		      this.get('Content-Type') || this.contentType('.txt');
		      this.statusCode = body;
		      body = http.STATUS_CODES[body];
		      break;
		    // string defaulting to html
		    case 'string':
		      if (!this.get('Content-Type')) {
		        this.charset = this.charset || 'utf-8';
		        this.contentType('.html');
		      }
		      break;
		    case 'boolean':
		    case 'object':
		      if (null == body) {
		        body = '';
		      } else if (Buffer.isBuffer(body)) {
		        this.get('Content-Type') || this.contentType('.bin');
		      } else {
		        return this.json(body);
		      }
		      break;
		  }

		  // populate Content-Length
		  if (undefined !== body && !this.get('Content-Length')) {
		    this.set('Content-Length', Buffer.isBuffer(body)
		      ? body.length
		      : Buffer.byteLength(body));
		  }

		  // strip irrelevant headers
		  if (204 == this.statusCode || 304 == this.statusCode) {
		    this.removeHeader('Content-Type');
		    this.removeHeader('Content-Length');
		    body = '';
		  }

		  // respond
		  this.end(head ? null : body);
		  return this;
		}

		/**
		* Send JSON response.
		*
		* Examples:
		*
		* res.json(null);
		* res.json({ user: 'tj' });
		* res.json(500, 'oh noes!');
		* res.json(404, 'I dont have that');
		*
		* @param {Mixed} obj or status
		* @param {Mixed} obj
		* @return {ServerResponse}
		* @api public
		*/

		,json: function(obj){
		  // allow status / body
		  if (2 == arguments.length) {
		    this.statusCode = obj;
		    obj = arguments[1];
		  }

		  var settings = this.app.settings
		    , jsonp = settings['jsonp callback']
		    , replacer = settings['json replacer']
		    , spaces = settings['json spaces']
		    , body = JSON.stringify(obj, replacer, spaces)
		    , callback = this.req.query.callback;

		  this.charset = this.charset || 'utf-8';
		  this.set('Content-Type', 'application/json');

		  if (callback && jsonp) {
		    this.set('Content-Type', 'text/javascript');
		    body = callback.replace(/[^\w$.]/g, '') + '(' + body + ');';
		  }

		  return this.send(body);
		}

		/**
		* Transfer the file at the given `path`.
		*
		* Automatically sets the _Content-Type_ response header field.
		* The callback `fn(err)` is invoked when the transfer is complete
		* or when an error occurs. Be sure to check `res.sentHeader`
		* if you wish to attempt responding, as the header and some data
		* may have already been transferred.
		*
		* Options:
		*
		* - `maxAge` defaulting to 0
		* - `root` root directory for relative filenames
		*
		* @param {String} path
		* @param {Object|Function} options or fn
		* @param {Function} fn
		* @api public
		*/

		,sendfile: function(path, options, fn){
		  var self = this
		    , req = self.req
		    , next = this.req.next
		    , options = options || {};

		  // support function as second arg
		  if ('function' == typeof options) {
		    fn = options;
		    options = {};
		  }

		  // callback
		  options.callback = function(err){
		    if (err) {
		      // cast ENOENT
		      if ('ENOENT' == err.code) err = 404;

		      // coerce numeric error to an Error
		      // TODO: remove
		      // TODO: remove docs for headerSent?
		      if ('number' == typeof err) err = utils.error(err);

		      // ditch content-disposition to prevent funky responses
		      if (!self.headerSent) self.removeHeader('Content-Disposition');

		      // woot! callback available
		      if (fn) return fn(err);

		      // lost in limbo if there's no callback
		      if (self.headerSent) return;

		      return req.next(err);
		    }

		    fn && fn();
		  };

		  // transfer
		  options.path = encodeURIComponent(path);
		  send(this.req, this, next, options);
		}

		/**
		* Transfer the file at the given `path` as an attachment.
		*
		* Optionally providing an alternate attachment `filename`,
		* and optional callback `fn(err)`. The callback is invoked
		* when the data transfer is complete, or when an error has
		* ocurred. Be sure to check `res.headerSent` if you plan to respond.
		*
		* @param {String} path
		* @param {String|Function} filename or fn
		* @param {Function} fn
		* @api public
		*/

		,download: function(path, filename, fn){
		  // support function as second arg
		  if ('function' == typeof filename) {
		    fn = filename;
		    filename = null;
		  }

		  return this.attachment(filename || path).sendfile(path, fn);
		}

		/**
		* Set _Content-Type_ response header passed through `mime.lookup()`.
		*
		* Examples:
		*
		* var filename = 'path/to/image.png';
		* res.contentType(filename);
		* // res.headers['Content-Type'] is now "image/png"
		*
		* res.contentType('.html');
		* res.contentType('html');
		* res.contentType('json');
		* res.contentType('png');
		* res.type('png');
		*
		* @param {String} type
		* @return {ServerResponse} for chaining
		* @api public
		*/

		,contentType: function(value) { return this.type(value); }
		,type: function(type){
		  return this.set('Content-Type', mime.lookup(type));
		}

		/**
		* Respond to the Acceptable formats using an `obj`
		* of mime-type callbacks.
		*
		* This method uses `req.accepted`, an array of
		* acceptable types ordered by their quality values.
		* When "Accept" is not present the _first_ callback
		* is invoked, otherwise the first match is used. When
		* no match is performed the server responds with
		* 406 "Not Acceptable".
		*
		* Content-Type is set for you, however if you choose
		* you may alter this within the callback using `res.type()`
		* or `res.set('Content-Type', ...)`.
		*
		* res.format({
		* 'text/plain': function(){
		* res.send('hey');
		* },
		*
		* 'text/html': function(){
		* res.send('<p>hey</p>');
		* },
		*
		* 'appliation/json': function(){
		* res.send({ message: 'hey' });
		* }
		* });
		*
		* In addition to canonicalized MIME types you may
		* also use extnames mapped to these types:
		*
		* res.format({
		* text: function(){
		* res.send('hey');
		* },
		*
		* html: function(){
		* res.send('<p>hey</p>');
		* },
		*
		* json: function(){
		* res.send({ message: 'hey' });
		* }
		* });
		*
		* @param {Object} obj
		* @return {ServerResponse} for chaining
		* @api public
		*/

		,format: function(obj){
		  var keys = Object.keys(obj)
		    , req = this.req
		    , next = req.next
		    , key = req.accepts(keys);

		  if (key) {
		    this.set('Content-Type', normalizeType(key));
		    obj[key](req, this, next);
		  } else {
		    var err = new Error('Not Acceptable');
		    err.status = 406;
		    err.types = normalizeTypes(keys);
		    next(err);
		  }

		  return this;
		}

		/**
		* Set _Content-Disposition_ header to _attachment_ with optional `filename`.
		*
		* @param {String} filename
		* @return {ServerResponse}
		* @api public
		*/

		,attachment: function(filename){
		  if (filename) this.type(filename);
		  this.set('Content-Disposition', filename
		    ? 'attachment; filename="' + basename(filename) + '"'
		    : 'attachment');
		  return this;
		}

		/**
		* Set header `field` to `val`, or pass
		* an object of of header fields.
		*
		* Examples:
		*
		* res.set('Accept', 'application/json');
		* res.set({ Accept: 'text/plain', 'X-API-Key': 'tobi' });
		*
		* @param {String|Object} field
		* @param {String} val
		* @return {ServerResponse} for chaining
		* @api public
		*/

		,set: function(field, val){
		  if (2 == arguments.length) {
		    this.setHeader(field, val);
		  } else {
		    for (var key in field) {
		      this.setHeader(key, field[key]);
		    }
		  }
		  return this;
		}

		/**
		* Get value for header `field`.
		*
		* @param {String} field
		* @return {String}
		* @api public
		*/

		,get: function(field){
		  return this.getHeader(field);
		}

		/**
		* Clear cookie `name`.
		*
		* @param {String} name
		* @param {Object} options
		* @param {ServerResponse} for chaining
		* @api public
		*/

		,clearCookie: function(name, options){
		  var opts = { expires: new Date(1), path: '/' };
		  return this.cookie(name, '', options
		    ? utils.merge(opts, options)
		    : opts);
		}

		/**
		* Set a signed cookie with the given `name` and `val`.
		* See `res.cookie()` for details.
		*
		* @param {String} name
		* @param {String|Object} val
		* @param {Object} options
		* @api public
		*/

		,signedCookie: function(name, val, options){
		  var secret = this.req.secret;
		  if (!secret) throw new Error('connect.cookieParser("secret") required for signed cookies');
		  if ('object' == typeof val) val = 'j:' + JSON.stringify(val);
		  val = utils.sign(val, secret);
		  return this.cookie(name, val, options);
		}

		/**
		* Set cookie `name` to `val`, with the given `options`.
		*
		* Options:
		*
		* - `maxAge` max-age in milliseconds, converted to `expires`
		* - `path` defaults to "/"
		*
		* Examples:
		*
		* // "Remember Me" for 15 minutes
		* res.cookie('rememberme', '1', { expires: new Date(Date.now() + 900000), httpOnly: true });
		*
		* // save as above
		* res.cookie('rememberme', '1', { maxAge: 900000, httpOnly: true })
		*
		* @param {String} name
		* @param {String|Object} val
		* @param {Options} options
		* @api public
		*/

		,cookie: function(name, val, options){
		  options = options || {};
		  if ('object' == typeof val) val = 'j:' + JSON.stringify(val);
		  if ('maxAge' in options) options.expires = new Date(Date.now() + options.maxAge);
		  if (null == options.path) options.path = '/';
		  var cookie = utils.serializeCookie(name, val, options);
		  this.set('Set-Cookie', cookie);
		  return this;
		}

		/**
		* Redirect to the given `url` with optional response `status`
		* defaulting to 302.
		*
		* The given `url` can also be the name of a mapped url, for
		* example by default express supports "back" which redirects
		* to the _Referrer_ or _Referer_ headers or "/".
		*
		* Examples:
		*
		* res.redirect('/foo/bar');
		* res.redirect('http://example.com');
		* res.redirect(301, 'http://example.com');
		*
		* Mounting:
		*
		* When an application is mounted, and `res.redirect()`
		* is given a path that does _not_ lead with "/". For
		* example suppose a "blog" app is mounted at "/blog",
		* the following redirect would result in "/blog/login":
		*
		* res.redirect('login');
		*
		* While the leading slash would result in a redirect to "/login":
		*
		* res.redirect('/login');
		*
		* @param {String} url
		* @param {Number} code
		* @api public
		*/

		,redirect: function(url){
		  var app = this.app
		    , req = this.req
		    , head = 'HEAD' == req.method
		    , status = 302
		    , body;

		  // allow status / url
		  if (2 == arguments.length) {
		    status = url;
		    url = arguments[1];
		  }

		  // setup redirect map
		  var map = { back: req.get('Referrer') || '/' };

		  // perform redirect
		  url = map[url] || url;

		  // relative
		  if (!~url.indexOf('://')) {
		    var path = app.path();

		    // relative to path
		    if (0 == url.indexOf('./') || 0 == url.indexOf('..')) {
		      url = req.path + '/' + url;
		    // relative to mount-point
		    } else if ('/' != url[0]) {
		      url = path + '/' + url;
		    }

		    // Absolute
		    var host = req.get('Host');
		    url = req.protocol + '://' + host + url;
		  }

		  // Support text/{plain,html} by default
		  this.format({
		    'text/plain': function(){
		      body = statusCodes[status] + '. Redirecting to ' + url;
		    },

		    'text/html': function(){
		      body = '<p>' + statusCodes[status] + '. Redirecting to <a href="' + url + '">' + url + '</a></p>';
		    }
		  })

		  // Respond
		  this.statusCode = status;
		  this.set('Location', url);
		  this.end(head ? null : body);
		}

		/**
		* Render `view` with the given `options` and optional callback `fn`.
		* When a callback function is given a response will _not_ be made
		* automatically, otherwise a response of _200_ and _text/html_ is given.
		*
		* Options:
		*
		* - `status` Response status code (`res.statusCode`)
		* - `charset` Set the charset (`res.charset`)
		*
		* Reserved locals:
		*
		* - `cache` boolean hinting to the engine it should cache
		* - `filename` filename of the view being rendered
		*
		* @param {String} view
		* @param {Object|Function} options or callback function
		* @param {Function} fn
		* @api public
		*/

		,render: function(view, options, fn){
		  var self = this
		    , options = options || {}
		    , req = this.req
		    , app = req.app;

		  // support callback function as second arg
		  if ('function' == typeof options) {
		    fn = options, options = {};
		  }

		  function render() {
		    // merge res.locals
		    options.locals = self.locals;

		    // default callback to respond
		    fn = fn || function(err, str){
		      if (err) return req.next(err);
		      self.send(str);
		    };

		    // render
		    app.render(view, options, fn);
		  }

		  // invoke view callbacks
		  var callbacks = app.viewCallbacks
		    , pending = callbacks.length
		    , len = pending
		    , done;

		  if (len) {
		    for (var i = 0; i < len; ++i) {
		      callbacks[i](req, self, function(err){
		        if (done) return;

		        if (err) {
		          req.next(err);
		          done = true;
		          return;
		        }

		        --pending || render();
		      });
		    }
		  } else {
		    render();
		  }
		}
    }
});

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
  			this.engine(this.path, options, fn);
		}
    }
});

/**
 * ==========================
 *     HTTP SERVER CLASS
 * ==========================
 */

var HTTPServer = Class.create ({
    constructor: function (){
       
    },
    properties: {
        use: function() {

        }
    }
});

module.exports = CargoBox;