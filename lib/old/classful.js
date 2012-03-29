/**
 * @name Classful JS for Node.js.
 * @description Library that eases the manipulation and usage of JavaScript prototypes.
 *
 * @author Gabriel Llamas
 * @created 16/02/2012
 * @modified 22/03/2012
 * @version 1.1.2
 */
"use strict";

module.exports = {
	create: function (settings){
		var Class = function (){
			if (this !== undefined){
				if (constructor) constructor.apply (this, arguments);
			}else{
				var o = Object.create (Class.prototype);
				if (constructor) constructor.apply (o, arguments);
				return o;
			}
		};
		
		var constructor;
			
		if (settings){
			var p = settings["constructor"];
			if (p !== Object){
				constructor = p;
			}

			var extend = settings["extend"];
			if (extend){
				var type = typeof extend;
				if (type === "function"){
					Class.prototype = Object.create (extend.prototype);
					Object.defineProperties (Class.prototype, {
						"constructor": {
							value: Class,
							enumerable: false
						},
						"__super__": {
							value: extend.prototype,
							enumerable: false
						}
					});
				}else if (type === "object"){
					throw "Cannot extend a singleton.";
				}else{
					throw "Invalid class to extend.";
				}
			}
			
			p = settings["properties"];
			if (p){
				if (extend){
					for (var i in p){
						Class.prototype[i] = p[i];
					}
				}else{
					Class.prototype = p;
					Object.defineProperty (Class.prototype, "constructor", {
						value: Class,
						enumerable: false
					});
				}
			}
			
			p = settings["singleton"];
			if (p){
				var proto = Class.prototype;
				Class = {
					"getInstance": (function (){
						var instance;
						return function (){
							if (!instance){
								instance = Object.create (Class.prototype);
								if (constructor) constructor.call (instance);
								this["getInstance"] = function (){
									return instance;
								};
								return instance;
							}
						};
					})()
				};
				Class.prototype = proto;
			}
			
			p = settings["onCreate"];
			if (p){
				p (Class);
			}
		}
		
		return Class;
	},
	update: function (f, settings){
		var p = settings["properties"];
		if (p !== undefined){
			for (var i in f.prototype){
				if (f.prototype["hasOwnProperty"](i)){
					delete f.prototype[i];
				}
			}
			
			if (p !== null){
				for (var i in p){
					f.prototype[i] = p[i];
				}
			}
		}
		
		p = settings["augment"];
		if (p){
			for (var i in p){
				f.prototype[i] = p[i];
			}
		}
		
		p = settings["onUpdate"];
		if (p){
			p (f);
		}
	}
};