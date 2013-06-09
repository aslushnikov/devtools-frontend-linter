var esprima = require('esprima')
  , walker = require('./ast-walker.js');

function parse(data) {
    return esprima.parse(data, {});
}

/**
 * This function finds all class usages
 */
function usedClasses(ast) {
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
                tokens.pop();
                classes[tokens.join(".")] = node.callee;
            }
            return;
        }
    });
    return classes;
}

function checkAndSet(dict, key, value) {
    if (dict[key]) {
        console.warn("Value " + key + " is already used.");
    }
    dict[key] = value;
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
            var tokens = walker.flattenStaticMemberExpression(node.left);
            if (tokens) {
                checkAndSet(funs, tokens.join("."), node.right);
            }
            return;
        }
    });
    return funs;
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

    function parsePropertyName(classPrototype, propertyName, propertyValueNode) {
        if (propertyName !== "__proto__") {
            checkAndSet(classPrototype.props, propertyName, propertyValueNode);
            return;
        }
        // handle complicated __proto__ case
        if (propertyValueNode.type === "MemberExpression") {
            var tokens = walker.flattenStaticMemberExpression(propertyValueNode);
            // if proto is assigned to smth dynamic/weird, then give up
            if (!tokens) return;
            var idx = tokens.indexOf("prototype");
            // __proto__: Foo.Bar.prototype
            if (idx === tokens.length - 1) {
                tokens.pop();
                classPrototype.superClass = tokens.join(".");
                return;
            }
            // __proto__: Foo.Bar
            if (idx === -1) {
                classPrototype.superClass = tokens.join(".");
                return;
            }
            // otherwise we should give up
            return;
        }
        // __proto__: A
        if (propertyValueNode.type === "Identifier") {
            classPrototype.superClass = propertyValueNode.name;
            return;
        }
        // __proto__: new ..
        if (propertyValueNode.type === "NewExpression") {
            if (propertyValueNode.callee.type === "Identifier") {
                classPrototype.superClass = propertyValueNode.callee.name;
                return;
            } else if (propertyValueNode.callee.type === "MemberExpression") {
                var tokens = walker.flattenStaticMemberExpression(propertyValueNode.callee);
                if (!tokens) return;
                classPrototype.superClass = tokens.join(".");
                return;
            }
            // here we should give up again
            return;
        }
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
                // property key is either literal or string
                var propertyName = rProp.key.name || rProp.key.value;
                parsePropertyName(classPrototype, propertyName, rProp.value);
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
            var tokens = walker.flattenStaticMemberExpression(node.left);
            var idx = tokens.indexOf("prototype");
            // that's smth like "prototype.foo =.." - wierd case
            if (idx === 0) {
                return;
            }
            var className = tokens.slice(0, idx).join(".");
            var classPrototype = protoWithName(className);
            parsePropertyName(classPrototype, tokens[idx + 1], node.right);
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
    ast: parse,
    usedClasses: usedClasses,
    definedFunctions: definedFunctions,
    classPrototypes: classPrototypes
};
