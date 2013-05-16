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

	var config = {
		// If sandbox is set to true, the code will be evaluated within an
		// isolated scope (iframe on the client and a VM on the server).
		'sandbox': true,
		// If sugar is set to true, syntax sugar will be enabled, meaning a few
		// extra regular expressions to match against while compiling things.
		'sugar': true
	};

	function config(k,v) { config[k] = v; }

	var sandboxEval;

	/**
	 * We can't just check to see if we're within a CommonJS module because we
	 * could be using a client-side CommonJS implementation.
	 */
	if (typeof window === "undefined") {
		sandboxEval = function(code, callback) {
			return require('vm').runInNewContext(code);
		};
	} else {
		/**
		 * The client-side sandbox environment is an iframe which dumps its
		 * data to the DOM and is then pulled before the iframe's removal.
		 */
		sandboxEval = function(code, cb) {
			if (config.sandbox===false) return eval(code);
			var iframe = document.createElement('iframe');
			document.body.appendChild(iframe);
			var iwin   = window.frames[frames.length-1],
			    output = iwin.eval(code);
			document.body.removeChild(iframe);
			return output;
		};
	}

	function render(code, data, cb) {

		// Render an array of objects and concatenate the results.
		if (data.length && typeof data=="object") {
			var output = "";
			for (var i in data) output += render(code, data[i]);
			return output;
		}

		// Inject locals directly into the code environment.
		var locs = [];
		for (var k in data) locs[locs.length] = k+"="+JSON.stringify(data[k]);
		if (locs.length>0) code = "var "+locs.join(",")+';' + code;

		// We are returning the result of the evaluation operation, which means
		// that on the client-side only, it's not actually necessary to use the
		// API asynchronously.
		return sandboxEval("var _o_='';"+code+";", cb);

	}

	function compile(code) {

		var tagMatch = /<%=?((.|[\r\n])*?)%>/g;

		var texts = code.replace(tagMatch,'-%X@&*-#|)-').split('-%X@&*-#|)-');
		for (var i in texts) {
			code = code.replace(texts[i], '_o_+='+JSON.stringify(texts[i])+';');
		}

		code = code.replace(tagMatch, function(match, string) {

			if (match.match(/^<%#/)) return '';
			if (match.match(/^<%=/)) string = '_o_+='+string+';';

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

			 if (config.sugar===false) return;

			/* Changes trailing colon to an opening brace. */
			string = string.replace(/:(\s*)$/, "{");

			/* Changes a standalone instance of the "end" keyword to a closing 
			 * brace. */
			string = string.replace(/^\s*end\s*$/, '}');

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
			render: renderThis
		};

	}

	// Export all the things.

	var api = scope.api || {};

	api.render = function(code, data, cb) {
		return compile(code).render(data, cb);
	};

	api.config = config;

	api.compile = compile;

	// Export with CommonJS
	if (typeof module !== 'undefined' && typeof require !== 'undefined') {
		module.exports = api;
	// Browser-based Global Plugin
	} else {
		scope.Logical = api;
	}

}(this));