var SourceFile = function(name, src) {
    this._name = name;
    this._lines = src.split('\n');
    this._ast = esprima.parse(src, {
        //tokens: true
        loc: true
    });
    this._classes = {};
}

SourceFile.loadSync = function(name) {
    return new SourceFile(name, fs.readFileSync(name, "utf-8"));
}

SourceFile.prototype = {
    sloc: function() {
        return this._lines.length;
    },

    name: function() {
        return this._name;
    },

    ast: function() {
        return this._ast;
    },

    classForName: function(name, create) {
        if (!this._classes[name] && create) {
            this._classes[name] = new JSClass(name, this);
        }
        return this._classes[name];
    },

    allClasses: function() {
        var result = [];
        for(var i in this._classes)
            result.push(this._classes[i]);
        return result;
    },

    text: function(node) {
        var loc = node.loc;
        var srcLines = this._lines;
        if (loc.start.line === loc.end.line)
            return srcLines[loc.start.line - 1].substring(loc.start.column, loc.end.column);
        var txt = srcLines[loc.start.line - 1].substring(loc.start.column).trim();
        for(var i = loc.start.line; i <= loc.end.line - 2; ++i) {
            txt += srcLines[i].trim();
        }
        txt += srcLines[loc.end.line - 1].substring(0, loc.end.column).trim();
    }
};

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

var JSClass = function(name, sourceFile) {
    this.name = name;
    this.init = null;
    this.proto = null;
    this.subClasses = {};
    this._sourceFile = sourceFile;
}

JSClass.prototype = {
    text: function(node) {
        return this._sourceFile.text(node);
    }
};

// MAIN CODE
var esprima = require('esprima')
  , fs = require('fs')
  , colors = require('colors');

var src = SourceFile.loadSync(process.argv[2]);
console.log("SLOC: " + src.sloc());

var classInstances = {};

function cutPrototype(name) {
    return /.prototype$/.test(name) ? name.substr(0, name.length - 10) : null;
}

function analyze(src) {
    walker(src.ast(), function(node) {
        // logging class instantiation
        if (node.type === "NewExpression") {
            classInstances[src.text(node.callee)] = true;
            return true; // break walker recursion
        }
        // setting class constructor
        if (node.type === "VariableDeclarator") {
            if (node.init && node.init.type === "FunctionExpression") {
                src.classForName(src.text(node.id), true).init = node.init;
                return false;
            }
        }
        if (node.type === "AssignmentExpression") {
            // setting class constructor
            if (node.left && node.right && node.right.type === "FunctionExpression") {
                src.classForName(src.text(node.left), true).init = node.right;
                return false;
            }
            // setting class prototype
            if (node.left && node.right && node.right.type === "ObjectExpression") {
                var name = src.text(node.left);
                var withoutPrototype = cutPrototype(name);
                if (withoutPrototype) {
                    src.classForName(withoutPrototype, true).proto = node.right;
                    return false;
                }
            }
        }
        return false;
    });

    function buildInstanceVars(jsclass) {
        var list = {};
        walkMany([jsclass.init, jsclass.proto], function(node) {
            if (node.type === "AssignmentExpression" && node.left) {
                var left = jsclass.text(node.left);
                var firstFive = left.substr(0, 5);
                if (firstFive === "this.")
                    list[left.substring(5)] = true;
            }
        });
        if (jsclass.proto) {
            for(var i = 0; i < jsclass.proto.properties.length; ++i) {
                var prop = jsclass.proto.properties[i];
                list[jsclass.text(prop.key)] = true;
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
                var superClass = cutPrototype(jsclass.text(prop.value));
                console.assert(superClass);
                jsclass.superClass = superClass;
            }
        }
    }
    var classes = src.allClasses();
    // parse super classes & instance variables
    for(var i = 0; i < classes.length; ++i) {
        buildInstanceVars(classes[i]);
        buildSuperclass(classes[i]);
    }
}
analyze(src);

var classes = src.allClasses();

console.log("Processed classes: " + classes.length);

// build subclasses
for(var i = 0; i < classes.length; ++i) {
    var jsclass = classes[i];
    if (!jsclass.superClass)
        continue;
    var sc = src.classForName(jsclass.superClass);
    if (!sc)
        console.warn("Could not find super class '" + jsclass.superClass + "'");
    else
        sc.subClasses[jsclass.name] = true;
}

function copy(dict) {
    var res = {};
    for(var i in dict)
        res[i] = dict[i];
    return res;
}

function checkClassHierarchy(inherited, jsclass) {
    for(var ivar in jsclass.instanceVars) {
        if (ivar.charAt(0) !== "_") continue;
        if (ivar in inherited)
            console.log(jsclass.name + "." + ivar + " overrides value defined in ".grey + inherited[ivar]);
        inherited[ivar] = jsclass.name;
    }
    for(var subclass in jsclass.subClasses) {
        checkClassHierarchy(copy(inherited), src.classForName(subclass));
    }
}

for(var i = 0; i < classes.length; ++i) {
    var jsclass = classes[i];
    if (jsclass.superClass)
        continue;
    checkClassHierarchy({}, jsclass);
}
