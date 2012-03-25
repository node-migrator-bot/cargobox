
var Class = require('classful')
  , connect = require('connect')
  , http = require('http')
  , fs = require('fs')
  , utils = connect.utils
  , utilities = require('./utilities')
  , path = require('path');


var Request = require('./request')
	, Response = require('./response')
	, View = require('./view')
	, Route = require('./route')
	, Router = require('./router');

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
	var _version = '0.1.2';

	return Class.create ({

	    constructor: function (){

	    	console.log('cargobox '+_version+' says hello');

	    	var self = this;

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
	    	  self.registerMethod(method, path);
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

	    	,cache : {}
			,settings : {}
			,engines : {}
			,viewCallbacks : []

			,registerMethod: function(method, path) {
				var self = this;
				this[method] = function(path){
		    		if ('get' == method && 1 == arguments.length) return self.set(path);
				    var args = [method].concat([].slice.call(arguments));
				    if (!_usedRouter) self.use(self.router);
				    return _router.route.apply(_router, args);
				}
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

			/*,use: function(route, fn) {
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
			*/

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
			  _app.use(route, fn);

			  // mounted an app
			  if (app) {
			    app.parent = this;
			    app.emit('mount', this);
			  }

			  return this;
			}

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
			    	defaultLayout: this.get('view layout') || 'layout'
			      , defaultEngine: this.get('view engine')
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

module.exports = CargoBox;