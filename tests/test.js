var logical = require('../lib/core.js');


var passed = 0, tests = 0, errors = [];

function testLogical(logical, instanceVar) {

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

	logical.addTemplate('cats', "Cats are neat.");

	var cases = {
		'basics': {
			'plain string':     ["Hello, world!", "Hello, world!"]
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
			'partials':         ["<%= partial('cdats') %>", "Cats are neat."]
		},
		scoping: {
			'time':             ["<%= outputTime() %>", data.time],
			'data':             ["<%= secret %>", data.secret]
		}
	};

	for (title in cases) {
		group = cases[title];
		var name, result, error;
		for (name in group) {
			tests++;
			error = false;
			try {
				result = logical.render(group[name][0], data); 
			} catch (e) {
				error = e;
			}
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

// It's not a real library until I get to play with ANSI color codes.
console.log(
	"\033[38;5;"+(29+88)+"mlogical\033[38;5;"+(14+232)
	+"m: templates for JavaScript.\033[0m"
);

testLogical(logical, 'global');
testLogical(logical.instance(), 'instance1');
testLogical(logical.instance(), 'instance2');

console.log("\r");

if (passed==tests) {
	console.log("Passed: "+passed+'/'+tests);
} else {
	for (var i in errors) console.log(errors[i]);
	console.log("\033[31mFailed: "+passed+'/'+tests, '\033[0m');
}