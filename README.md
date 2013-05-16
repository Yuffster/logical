RJS (Rendered JavaScript)
----

RJS is a self-contained, super lightweight (1KB when compressed) JavaScript
templating library which works on both the client and server side.

RJS allows the developer to use the entire JavaScript language and place simple
logic into templates without causing problems outside of the template scope.

## Examples

Standard JS syntax:

	<ul>
		<% for (var i in items) { %>
			<li><%= items[i].name %></li>
		<% } %>
	</ul>

Taking advantage of RJS's syntax sugar:

	<ul>
		<% each(var item in items): %>
			<li><%= item.name %></li>
		<% end %>
	</ul>

## Basic Usage

The easiest way to use RJS is to use the standalone `RJS.render` method.

	RJS.render("<%= title %>", {title:"hello, world"}, console.log);

### Basic Usage

	console.log(RJS.render("<%= title %>", {title:"hello, world"}));

### Server-Side/Full-Stack Usage

	var rjs = require('rjs');
	rjs.render('<%= message %>', {message:'Hello, world.'});

## Precompiling Templates

If you plan to use a template extensively, you can pre-compile and cache 
templates using the compile function.

	var tmp = RJS.compile('<%= message %>');
	tmp.render({message:'Hello, world.'});

## Collection Rendering

If you pass an array of objects to render instead of an object, the template
will be rendered using each object in the array and concatenated.

	var item = RJS.compile("<li><%= name %></li>"),
	    data = [{'name':'Tom'}, {'name':'Dick'}, {'name':'Harry'}];
	
	$('#myList').inject(list_item.compile(data));

## Advanced Usage 

    var tmps = new RJS();
	tmps.add('index', "Welcome to <%= title %>!");
	tmps.render('index', {title:'My Site'}, console.log);

## Sandbox Mode

By default, RJS runs in a sandboxed mode to prevent any pollution of the global
scope with dangling template variables.  In Node.JS, a child process will be 
created.  In the browser, an iframe will be used.

## Syntax Sugar

RJS supports the following syntax sugar in a limited fashion.

In order to negate the need for a sophisticated parser, syntax sugar matches
are very limited and must be placed within their own code block.

### Forget the Curly Brackets

	<% for(var i in cats): %>
		<div class="cat">
			<%= cats[i].name %>
		</div>
	<% end %>

Will render the same as:

	<% for(var i in cats) { %>
		<div class="cat">
			<%= cats[i].name %>
		</div>
	<% } %>

### Item iteration

	<% each (var cat in cats): %>
		<div class="cat">
			<%= cat.name %>
		</div>
	<% end %>

Renders the same as:

	<% for(var cat in cats) { %>
		<% cat = cats[i]; %>
		<div class="cat">
			<%= cat.name %>
		</div>
	<% } %>