var esprima = require('esprima')
  , walker = require('./ast-walker.js');

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

function checkAndSet(dict, key, value) {
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
            checkAndSet(funs, node.id.name, node);
            return;
        }
        // var a = function(..) {..}
        if (node.type === "VariableDeclarator" && node.init.type === "FunctionExpression") {
           checkAndSet(funs, node.id.name, node.init);
           return;
        }
        // Foo.Bar = function(..) {..}
        if (node.type === "AssignmentExpression" && node.right.type === "FunctionExpression" && node.left.type === "MemberExpression") {
            var tokens = walk.flattenStaticMemberExpression(node.left);
            if (tokens) {
                checkAndSet(funs, tokens.join("."), node.right);
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
    var prototypes = {};
    function protoWithName(className) {
        prototypes[className] = prototypes[className] || {
            superClass: null,
            props: {}
        };
        return prototypes[className];
    }
    walker.walk(ast, function(node) {
        // Foo.prototype = { .. }
        if (node.type === "AssignmentExpression" &&
            node.left.type === "MemberExpression" &&
            endsWithPrototype(node.left) &&
            node.right.type === "ObjectExpression") {
            var tokens = walker.flattenStaticMemberExpression(node.left);
            if (tokens.pop() !== "prototype")
                return;
            var className = tokens.join(".");
            var classPrototype = protoWithName(className);
            for(var i = 0; i < node.right.properties.length; ++i) {
                var rProp = node.right.properties[i];
                // property key is either foo or "foo"
                var propertyName = rProp.key.name || rProp.key.value;
                if (propertyName === "__proto__")
                    classPrototype.superClass = rProp.value;
                else
                    classPrototype.props[propertyName] = rProp.value;
            }
            return;
        }
        // Foo.prototype = new Bar
        if (node.type === "AssignmentExpression" &&
            node.left.type === "MemberExpression" &&
            endsWithPrototype(node.left) &&
            node.right.type === "NewExpression" &&
            memberOrIdentifier(node.right.callee)) {
            var tokens = walker.flattenStaticMemberExpression(node.left);
            if (!tokens || tokens.pop() !== "prototype")
                return;
            var className = tokens.join(".");

            var superClassName;
            if (node.right.callee.type === "Identifier")
                superClassName = node.right.callee.name;
            else {
                var tokens = walker.flattenStaticMemberExpression(node.right.callee);
                if (!tokens)
                    return;
                superClassName = tokens.join(".");
            }
            var classPrototype = protoWithName(className);
            classPrototype.superClass = superClassName;
            return;
        }
        // Foo.prototype.bar = ...
        if (node.type === "AssignmentExpression" &&
            node.left.type === "MemberExpression" &&
            !endsWithPrototype(node.left) &&
            hasPrototype(node.left)) {
            var tokens = walker.flattenStaticMemberExpression(node);
            var idx = tokens.indexOf("prototype");
            // that's smth like "prototype.foo =.." - wierd case
            if (idx === 0) {
                return;
            }
            var className = tokens.slice(0, idx).join(".");
            var classPrototype = protoWithName(className);
            classPrototype.props[tokens[idx + 1]] = node.right;
            return;
        }
    });
    return prototypes;
}

function memberOrIdentifier(node) {
    return node.type === "MemberExpression" || node.type === "Identifier";
}

function endsWithPrototype(node) {
    return node.type === "MemberExpression" && node.property &&
        node.property.type === "Identifier" && node.property.name === "prototype";
}

function hasPrototype(node) {
    var tokens = walker.flattenStaticMemberExpression(node);
    return tokens && tokens.indexOf("prototype") !== -1;
}

module.exports = {
    parseAST: parse,
    classUsages: classUsages,
    definedFunctions: definedFunctions,
    classPrototypes: classPrototypes
};
