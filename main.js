var esprima = require('esprima')
  , fs = require('fs');


var src = fs.readFileSync("test2.js", "utf-8");

var ast = esprima.parse(src, {
    //tokens: true
    loc: true
});

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

var lines = src.split('\n');
var classInstances = {};

var classes = {};
var JSClass = function(name) {
    this.init = null;
    this.proto = null;
}
JSClass.find = function(name) {
    if (!classes[name])
        classes[name] = new JSClass(name);
    return classes[name];
}
JSClass.list = function() {
    for(var i in classes)
        console.log(i);
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

function visitor(node) {
    if (node.type === "NewExpression") {
        classInstances[text(lines, node.callee)] = true;
        return true; // break walker recursion
    }
    if (node.type === "VariableDeclarator") {
        if (node.init && node.init.type === "FunctionExpression") {
            JSClass.find(text(lines, node.id)).init = node.init;
            return false;
        }
    }
    if (node.type === "AssignmentExpression") {
        if (node.left && node.right && node.right.type === "FunctionExpression") {
            JSClass.find(text(lines, node.left)).init = node.right;
            return false;
        }
    }
    return false;
}

walker(ast, visitor);

console.log(classInstances);
JSClass.list();
