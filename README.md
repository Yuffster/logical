Logical: Sandboxed JavaScript Templates
----

Logical is a self-contained, featherweight JavaScript template library
which works on both the client and server side.

Logical allows the developer to use the entire JavaScript language and place 
simple logic into templates without having access to the rest of the 
application environment (global variables, database access APIs, etc).

## Examples

Standard JS syntax:

	<ul>
		<% for (var i in items) { %>
			<li><%= items[i].name %></li>
		<% } %>
	</ul>

Taking advantage of Logical's syntax sugar:

	<ul>
		<% each(var item in items): %>
			<li><%= item.name %></li>
		<% end %>
	</ul>

## Basic Usage

The easiest way to use Logical is to use the standalone `Logical.render` method.

	Logical.render("<%= title %>", {title:"hello, world"}, console.log);

Or using CommonJS:

	var Logical = require('logical');
	logical.render('<%= message %>', {message:'Hello, world.'});

## Precompiling Templates

If you plan to use a template extensively, you can pre-compile and cache 
templates using the compile function.

	var tmp = Logical.compile('<%= message %>');
	tmp.render({message:'Hello, world.'});

## Collection Rendering

If you pass an array of objects to render instead of an object, the template
will be rendered using each object in the array and concatenated.

	var item = Logical.compile("<li><%= name %></li>"),
	    data = [{'name':'Tom'}, {'name':'Dick'}, {'name':'Harry'}];
	
	$('#myList').inject(item.compile(data));

## Advanced Usage 

    var tmps = new Logical();
	tmps.add('index', "Welcome to <%= title %>!");
	tmps.render('index', {title:'My Site'}, console.log);

## Sandbox Mode

By default, Logical runs in a sandboxed mode to prevent any pollution of the 
global scope with dangling template variables.  In Node.JS, a child process 
will be created.  In the browser, an iframe will be used.

## Syntax Sugar

Logical supports the following syntax sugar in a limited fashion.

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

Conditionals:

	<% if (cats): %>
		You have <%= cats %> <%= (cats.length==1) ? 'cat' : 'cats' %>.
	<% else if (dogs): %>
		You are clearly a dog person.
	<% else: %>
		You should adopt a pet.
	<% end %>

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

## Helpers

You can define helpers using the addHelper method.

In your code:

	Logical.addHelper('pluralize', function(arr, singular, plural) {
		var output = arr.length+" ";
		if (arr.length==1) output += singular;
		else output += plural || singular+'s';
		return output;
	});

In your template:
	
	You have <%= pluralize(cats, 'cat'); %>.

Output:

	You have 3 cats.


## Roadmap

Two additional modules are being developed using Logical's core.  The first 
will provide support for partial templates which are tree-aware.  The second
will add helper methods to allow for hooks to be made into the rest of the
application.