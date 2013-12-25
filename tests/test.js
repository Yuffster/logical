var Logical = require('../lib/core.js');

var passed = 0, tests = 0, errors = [];

function testLogical(logical, instanceVar, expStart, expEnd) {

	var data = {
		cats: [
			{name:'Meow', age: 20}, {name:'Kitty', age:2}
		],
		time: new Date().getTime(),
		secret: instanceVar
	};

	logical.addHelper('pluralize', function(arr, singular) {
		if (arr.length==1) return singular;
		else return singular+'s';
	});

	logical.addHelper('outputTime', function() {
		return data.time;
	});

	logical.addTemplate('cat', "<%= name %>");

	var cases = {
		'basics': {
			'plain string':     ["Hello, world!", "Hello, world!"],
			'functions':        ["<% var day = new Date().getDay(); %>"+
			                     "<% if (day): %>TGIW!<% else if (day==2): %>"+
			                     "Tomorrow is Wednesday!\n<%else:%>Whatever<%end%>",
			                     "TGIW!"]
		},
		'loop sugar': {
			'each with var':    ["<% each (var cat in cats): %><%= cat.name %><% end %>", "MeowKitty"],
			'each with no var': ["<% each (cat in cats): %><%= cat.name %><% end %>", "MeowKitty"]
		},
		'conditional sugar': {
			'if with colon':    ["<% if (1): %>true<% end %>", "true"],
			'if else':          ["<% if (1): %>true<% else: %>false<% end %>", "true"],
			'else if':          ["<% if(1): %>true<% else if (0): %>false<% end %>", 'true']
		},
		'newlines': {
			'if':               ["<% if\n(1)\n:%>true<%\nend\n%>", 'true'],
			'else':             ["<% if (0)\n { %> <% else \n if \n(1): %>test<% end %>", 'test']
		},
		'no spaces': {
			'if with colon':    ["<%if(1):%>true<%end %>", "true"],
			'if else':          ["<%if(1):%>true<%else:%>false<%end%>", "true"],
			'else if':          ["<%if(1):%>true<%else if(0):%>false<%end%>", 'true']
		},
		helpers: {
			'custom':           ["<%= pluralize(cats, 'cat') %>", 'cats'],
			'partials':         ["<%= partial('cat', [{name:'Meow'}, {name:'Kitty'}]) %>", "MeowKitty"]
		},
		scoping: {
			'time':             ["<%= outputTime() %>", data.time],
			'data':             ["<%= secret %>", data.secret]
		}, 
		html: {
			'list':             [
			                     	"<ul><% each (cat in cats): %>"+
			                     	"<li><%= cat.name %></li>"+
			                    	"<% end %></ul>", 
			                    	"<ul><li>Meow</li><li>Kitty</li></ul>"
			                    ]
		}
	};

	for (title in cases) {
		group = cases[title];
		var name, result="", error = "";
		for (name in group) {
			tests++;
			result = "";
			error  = "";
			if (expStart) {
				group[name][0] = group[name][0].replace(/<%/g, expStart);
			}
			if (expEnd) {
				group[name][0] = group[name][0].replace(/%>/g, expEnd);
			}
			try {
				result = logical.render(group[name][0], data); 
			} catch (e) {
				error = e;
			}
			result = result.replace(/\s+/, ' ');
			if (group[name][1]!=result||error) {
				process.stdout.write('\033[31m.\033[0m');
				errors.push("\033[31mFAIL\033[0m: "+title+", "+name);
				if (error) {
					errors.push(error.stack);
				}
				else errors.push("Expected '"+group[name][1]+"' but got '"+result+"'");
			} else {
				process.stdout.write('\033[32m.\033[0m');
				passed++;
			}
		}
	}

}

console.log(
	"logical: templates for JavaScript."
);

testLogical(Logical, 'global');
testLogical(Logical.instance(), 'instance1');
testLogical(Logical.instance(), 'instance2');

var custom = Logical.instance();
custom.config('expression_start', '{{');
custom.config('expression_end', '}}');

testLogical(custom, '', '{{', '}}')

console.log("\r");

if (passed==tests) {
	console.log("Passed: "+passed+'/'+tests);
} else {
	for (var i in errors) console.log(errors[i]);
	console.log("\033[31mFailed: "+passed+'/'+tests, '\033[0m');
	process.exit(1);
}
