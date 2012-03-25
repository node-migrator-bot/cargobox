var Class = require('classful')
	, connect = require('connect')
	, http = require('http')
	, parse = require('url').parse
	, utilities = require('./utilities')
	, mime = require('mime');

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

module.exports = Request;