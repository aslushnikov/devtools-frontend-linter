var esprima = require('esprima')
  , fs = require('fs')
  , walker = require('./ast-walker.js');

console.assert(process.argv.length === 3);
fs.readFile(process.argv[2], "utf-8", function(err, data) {
    var ast = parse(data);
});

function parse(data) {
    return esprima.parse(data, {});
}

/**
 * This function finds all class usages
 */
function classUsages(ast) {
    var classes = {};
    walker.walk(ast, function(node) {
        // new Foo(..)
        if (node.type === "NewExpression") {
            var tokens = walker.flattenStaticMemberExpression(node.callee);
            if (tokens) {
                classes[tokens.join(".")] = node.callee;
            }
            return;
        }
        // SuperClass.call(this, ...) -- running constructor of superclass
        if (node.type === "CallExpression") {
            var tokens = walker.flattenStaticMemberExpression(node.callee);
            if (tokens && tokens[tokens.length - 1] === "call" &&
                node.arguments.length && node.arguments[0].type === "ThisExpression") {
                classes[tokens.join(".")] = node.callee;
            }
            return;
        }
    });
    return classes;
}

Object.prototype.checkAndSet = function(key, value) {
    if (this[key] !== null) {
        console.warn("Value " + key + " is already used.");
    }
    this[key] = value;
}

/**
 * this returns all defined function in the ast
 */
function definedFunctions(ast) {
    var funs = {};
    walker.walk(ast, function(node) {
        // function Foo(...) {...)
        if (node.type === "FunctionDeclaration") {
            funs.checkAndSet(node.id.name, node);
            return;
        }
        // var a = function(..) {..}
        if (node.type === "VariableDeclarator" && node.init.type === "FunctionExpression") {
           funs.checkAndSet(node.id.name, node.init);
           return;
        }
        // Foo.Bar = function(..) {..}
        if (node.type === "AssignmentExpression" && node.right.type === "FunctionExpression" && node.left.type === "MemberExpression") {
            var tokens = walk.flattenStaticMemberExpression(node.left);
            if (tokens) {
                funs.checkAndSet(tokens.join("."), node.right);
            }
            return;
        }
    });
    return definedFunctions;
}

/**
 * This function deals with prototype property. It parses the following kinds of prototype:
 *     - Foo.prototype = { .. }
 *     - Foo.prototype.bar = ...
 *     - Foo.prototype = new Bar();
 */
function classPrototypes(ast) {
    var classes = {};
    walker.walk(ast, function(node) {
        // Foo.prototype = { .. }
        if (node.type === "AssignmentExpression" &&
            node.left.type === "MemberExpression" &&
            node.right.type === "ObjectExpression") {
            var tokens = walker.flattenStaticMemberExpression(node.left);
            if (tokens.pop() !== "prototype")
                return;
            var className = tokens.join(".");
            classes[className] = classes[className] || {
                superClass: null,
                props: {}
            };
            var classPrototype = classes[className];
            for(var i = 0; i < node.right.properties.length; ++i) {
                var rProp = node.right.properties[i];
                classPrototype.props[nProp.key.name || nProp.key.value] = rProp.value;
            }
            return;
        }
        // Foo.prototype.bar = ...
        //TODO

    });
}
