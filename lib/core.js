/**
 * core.js
 * 
 * This is the core rendering engine.  It can be used standalone on the client
 * or the server, and is designed to be combined with other modules, for 
 * example to add support for partials and helpers.
 *
 * Its main purpose is to be as small as possible while still providing a large
 * amount of functionality.
 *
 * # Usage:
 *
 * 	Logical.render('<%= message %>', {message:'Hello, world.'});
 *
 * # Precompiling Templates
 *
 * If you plan to use a template extensively, you can pre-compile and cache 
 * templates using the compile function.
 *
 * 	var tmp = Logical.compile('<%= message %>');
 * 	tmp.render({message:'Hello, world.'});
 *
 * # Collection Rendering
 *
 * If you pass an array of objects to render instead of an object, the template
 * will be rendered using each object in the array and concatenated.
 *
 * 	var item = Logical.compile("<li><%= name %></li>"),
 * 	    data = [{'name':'Tom'}, {'name':'Dick'}, {'name':'Harry'}];
 * 	
 * 	$('#myList').inject(item.compile(data));
 */
(function(scope) {

	var options = {
		// If sandbox is set to true, the code will be evaluated within an
		// isolated scope (iframe on the client and a VM on the server).
		'sandbox': true,
		// If sugar is set to true, syntax sugar will be enabled, meaning a few
		// extra regular expressions to match against while compiling things.
		'sugar': true
	}, helpers = {}, templates = {};

	function config(k,v) { 
		var config = (this.logicalInstance) ? this.options : options;
		if (!v) return config[k] || options[k];
		else options[k] = v;
	}

	function addHelper(name, fn) {
		var o = (this.logicalInstance) ? this.helpers : helpers;
		o[name] = fn;
	}

	function addTemplate(name, code) {
		var o = (this.logicalInstance) ? this.templates : templates;
		o[name] = compile(code);
		return o[name];
	}

	var sandboxEval;

	/**
	 * We can't just check to see if we're within a CommonJS module because we
	 * could be using a client-side CommonJS implementation.
	 */
	if (typeof window === "undefined") {
		sandboxEval = function(code, locals, helpers) {
			var vm     = require('vm'), context = {},
			   helpers = (this.logicalInstance) ? this.helpers : helpers;
			for (k in locals) context[k] = locals[k];
			return vm.runInContext(code, vm.createContext(context));
		};
	} else {
		/**
		 * The client-side sandbox environment is an iframe which dumps its
		 * data to the DOM and is then pulled before the iframe's removal.
		 */
		sandboxEval = function(code, locals, helpers) {
			if (!config('sandbox')) return eval(code);
			var iframe = document.createElement('iframe');
			document.body.appendChild(iframe);
			var iwin = window.frames[frames.length-1];
			for (var k in helpers) iwin[k] = helpers[k];
			for (k in locals) iwin[k] = locals[k];
			var output = iwin.eval(code);
			document.body.removeChild(iframe);
			return output;
		};
	}

	function render(code, data, cb) {

		var tmps = this.templates || templates;
		if (tmps[code]) return tmps[code].render(data);

		// Render an array of objects and concatenate the results.
		if (data.length && typeof data=="object") {
			var output = "";
			for (var i in data) output += render(code, data[i]);
			return output;
		}

		var hlps = (this.logicalInstance) ? this.helpers : helpers;

		return sandboxEval("var _o_='';"+code+";_o_;", data, hlps);

	}

	function compile(code) {

		var tagMatch = /<%=?((.|[\r\n])*?)%>/g;

		var c = 0;
		var code = code.replace(tagMatch, function(str) {
			return '\ue001'+str+"\ue001"+(c++)+"\ue002";
		});
		
		code = code.replace(/\ue001\d\ue002([^\ue001]*)/g, function(m,str) {
			return "_o_+="+JSON.stringify(str)+';';
		}).replace(/\ue001/g, '');

		code = code.replace(tagMatch, function(match, string) {

			if (match.match(/^<%#/)) return '';
			if (match.match(/^<%=/)) string = '_o_+='+string+';';
			else string += '\n';

			/**
			 * The syntax sugar here is deliberately strict on what it matches;
			 * it's better to be specific about the sugar and not have to deal
			 * with the overhead of a more sophisticated tokenizer.
			 *
			 * This could be solved by offloading template compilation to the
			 * server, but this library is supposed to work as a standalone
			 * client-side library and reliably output the same data in both
			 * environments.
			 *
			 * If that's a problem, turn sugar off using config and write a 
			 * more sophisticated parser (and submit a pull request).
			 */

			if (!config('sugar')) return;

			/* Changes trailing colon to an opening brace. */
			string = string.replace(/:(\s*)$/, "{\n");
			/* Special handling of linked conditionals (no case statements) */
			string = string.replace(/\s*(else(\s+if)?\s*\((.*?)\))\s*:/, "} $1 {");

			/* Changes a standalone instance of the "end" keyword to a closing 
			 * brace. */
			string = string.replace(/^\s*end\s*$/, '}\n');

			/* Changes a statement of "each (foo in buzz) { }" to
			 * for (foo in buzz) { foo = buzz[foo]; }, maintaining inline var
			 * declarations as necessary. */
			var m = string.match(/^\s*each\s*\((var)?\s+(\w+)\s+(in)\s+(\w+)\)/);
			if (m) {
				string  = string.replace(/^\s*each\s*/, 'for');
				string += m[2]+"="+m[4]+"["+m[2]+"];";
			}

			return string;

		});

		// Just a simple argument currying to allow this module to pass its 
		// own data to the render method.
		function renderThis() {
			var args = [code];
			for (var i in arguments) args[args.length] = arguments[i];
			return render.apply(this, args);
		}

		return {
			render: renderThis,
			code: code
		};

	}

	// Export all the things.

	var api = scope.api || {};

	api.render = function(code, data, cb) {
		return compile(code).render(data, cb);
	};

	function Instance() {
		this.helpers = {}; this.templates = {}; this.options = {};
		this.logicalInstance = true;
	};

	Instance.prototype.config      = config;
	Instance.prototype.render      = render;
	Instance.prototype.compile     = compile;
	Instance.prototype.addHelper   = addHelper;
	Instance.prototype.addTemplate = addTemplate;

	api.instance = function() {
		return new Instance();
	};

	api.config      = config;
	api.compile     = compile;
	api.addHelper   = addHelper;
	api.addTemplate = addTemplate;

	// Export with CommonJS
	if (typeof module !== 'undefined' && typeof require !== 'undefined') {
		module.exports = api;
	// Browser-based Global Plugin
	} else {
		scope.Logical = api;
	}

}(this));