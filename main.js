Array.prototype.filter = function(filter) {
    var res = [];
    for(var i = 0; i < this.length; ++i)
        if (filter(this[i])) res.push(this[i]);
    return res;
}

function walker(node, visitor) {
    if (visitor(node))
        return;
    for(var child in node) {
        if (typeof node[child] === "object") {
            var c = node[child];
            if (c !== null) walker(c, visitor);
        }
    }
}

function walkMany(nodes, visitor) {
    for(var i = 0; i < nodes.length; ++i)
        if (nodes[i] !== null)
            walker(nodes[i], visitor);
}

var JSClass = function(name) {
    this.name = name;
    this.init = null;
    this.proto = null;
}
JSClass._classes = {};
JSClass.find = function(name) {
    if (!JSClass._classes[name])
        JSClass._classes[name] = new JSClass(name);
    return JSClass._classes[name];
}
JSClass.list = function() {
    for(var i in JSClass._classes)
        console.log(i);
}
JSClass.toArray = function() {
    var result = [];
    for(var i in JSClass._classes)
        result.push(JSClass._classes[i]);
    return result;
}

// get the associated with ast node text
function text(srcLines, node) {
    var loc = node.loc;
    if (loc.start.line === loc.end.line)
        return srcLines[loc.start.line - 1].substring(loc.start.column, loc.end.column);
    var txt = srcLines[loc.start.line - 1].substring(loc.start.column).trim();
    for(var i = loc.start.line; i <= loc.end.line - 2; ++i) {
        txt += srcLines[i].trim();
    }
    txt += srcLines[loc.end.line - 1].substring(0, loc.end.column).trim();
}

// MAIN CODE
var esprima = require('esprima')
  , fs = require('fs');
var src = fs.readFileSync("test2.js", "utf-8");
var ast = esprima.parse(src, {
    //tokens: true
    loc: true
});
var lines = src.split('\n');
var classInstances = {};

function cutPrototype(name) {
    return /.prototype$/.test(name) ? name.substr(0, name.length - 10) : null;
}

function visitor(node) {
    // logging class instantiation
    if (node.type === "NewExpression") {
        classInstances[text(lines, node.callee)] = true;
        return true; // break walker recursion
    }
    // setting class constructor
    if (node.type === "VariableDeclarator") {
        if (node.init && node.init.type === "FunctionExpression") {
            JSClass.find(text(lines, node.id)).init = node.init;
            return false;
        }
    }
    if (node.type === "AssignmentExpression") {
        // setting class constructor
        if (node.left && node.right && node.right.type === "FunctionExpression") {
            JSClass.find(text(lines, node.left)).init = node.right;
            return false;
        }
        // setting class prototype
        if (node.left && node.right && node.right.type === "ObjectExpression") {
            var name = text(lines, node.left);
            var withoutPrototype = cutPrototype(name);
            if (withoutPrototype) {
                JSClass.find(withoutPrototype).proto = node.right;
                return false;
            }
        }
    }
    return false;
}
walker(ast, visitor);

var classes = JSClass.toArray();
for(var i = 0; i < classes.length; ++i) {
    var jsclass = classes[i];
    //console.log(jsclass.name + "init: " + (!!jsclass.init) + " proto: " + (!!jsclass.proto));
}

// leave only those classes which were instantiated
/*
classes = classes.filter(function(elem) {
    return elem.name in classInstances;
});
*/

function buildInstanceVars(jsclass) {
    var list = {};
    walkMany([jsclass.init, jsclass.proto], function(node) {
        if (node.type === "AssignmentExpression" && node.left) {
            var left = text(lines, node.left);
            var firstFive = left.substr(0, 5);
            if (firstFive === "this.")
                list[left.substring(5)] = true;
        }
    });
    if (jsclass.proto) {
        for(var i = 0; i < jsclass.proto.properties.length; ++i) {
            var prop = jsclass.proto.properties[i];
            list[text(lines, prop.key)] = true;
        }
    }
    jsclass.instanceVars = list;
}

function buildSuperclass(jsclass) {
    if (!jsclass.proto)
        return;
    for(var i = 0; i < jsclass.proto.properties.length; ++i) {
        var prop = jsclass.proto.properties[i];
        if (prop.type === "Property" && prop.key && prop.key.type === "Identifier" && prop.key.name === "__proto__") {
            console.assert(prop.value && prop.value.loc.start.line === prop.value.loc.end.line);
            var superClass = cutPrototype(text(lines, prop.value));
            console.assert(superClass);
            jsclass.superClass = superClass;
        }
    }
}

for(var i = 0; i < classes.length; ++i) {
    buildInstanceVars(classes[i]);
    buildSuperclass(classes[i]);
    if (classes[i].superClass)
        console.log(classes[i].name + " <- " + classes[i].superClass);
}

