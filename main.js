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

var SourceFile = function(name, src) {
    this._name = name;
    this._src = src;
    this._lines = src.split('\n');
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
        if (!this._ast) {
            this._ast = esprima.parse(this._src, {
                //tokens: true
                loc: true
            });
        }
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
    },

    _cutPrototype: function(name) {
        return /.prototype$/.test(name) ? name.substr(0, name.length - 10) : null;
    },

    _buildInstanceVars: function(jsclass) {
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
    },

    _buildSuperclass: function(jsclass) {
        if (!jsclass.proto)
            return;
        for(var i = 0; i < jsclass.proto.properties.length; ++i) {
            var prop = jsclass.proto.properties[i];
            if (prop.type === "Property" && prop.key && prop.key.type === "Identifier" && prop.key.name === "__proto__") {
                console.assert(prop.value && prop.value.loc.start.line === prop.value.loc.end.line);
                var superClass = this._cutPrototype(jsclass.text(prop.value));
                console.assert(superClass);
                jsclass.superClass = superClass;
            }
        }
    },

    iterateClasses: function(exec) {
        for(var className in this._classes) {
            exec(this._classes[className]);
        }
    },

    analyze: function(instantiations) {
        var src = this;
        walker(this.ast(), function(node) {
            // logging class instantiation
            if (node.type === "NewExpression") {
                instantiations[src.text(node.callee)] = true;
                return true; // break walker recursion
            }
            if (node.type === "CallExpression" &&
                    node.callee.type === "MemberExpression" &&
                    node.callee.property &&
                    node.callee.property.name === "call" &&
                    node.arguments.length > 0 &&
                    node.arguments[0].type === "ThisExpression") {
                if (!node.callee.object) {
                    console.log(src.text(node));
                    throw "failed";
                }
                var name = src.text(node.callee.object);
                if (name.charAt(0) >= 'A' && name.charAt(0) <= 'Z')
                    instantiations[src.text(node.callee.object)] = true;
                return false; // break walker recursion
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
                    var withoutPrototype = src._cutPrototype(name);
                    if (withoutPrototype) {
                        src.classForName(withoutPrototype, true).proto = node.right;
                        return false;
                    }
                }
            }
            return false;
        });
        this.iterateClasses(function(jsclass) {
            src._buildInstanceVars(jsclass);
            src._buildSuperclass(jsclass);
        });
    }
};

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

var ProgramClasses = function() {
    this._classesDictionary = {};
    this._interfacesDictionary = {};
}

ProgramClasses.prototype = {
    addSource: function(src, classInstances) {
        src.iterateClasses(function(jsclass) {
            var activeDict = this._classesDictionary;
            if (!(jsclass.name in classInstances)) {
                if (!jsclass.init || !jsclass.proto)
                    return;
                activeDict = this._interfacesDictionary;
            }
            if (activeDict[jsclass.name]) {
                console.warn(jsclass.name + " was defined in " + activeDict[jsclass.name].name() + " and got redefined in " + src.name);
            }
            activeDict[jsclass.name] = src;
        }.bind(this));
    },

    hasInterface: function(name) {
        return !!this._interfacesDictionary[name];
    },

    iterateClasses: function(exec) {
        for(var className in this._classesDictionary) {
            exec(this._classesDictionary[className].classForName(className));
        }
    },

    classForName: function(name) {
        if (!this._classesDictionary[name])
            return null;
        return this._classesDictionary[name].classForName(name);
    },

    classesAmount: function() {
        var num = 0;
        this.iterateClasses(function(jsclass) {
            ++num;
        });
        return num;
    }
}

// MAIN CODE
var esprima = require('esprima')
  , fs = require('fs')
  , colors = require('colors');

var classInstances = {};
var program = new ProgramClasses();
var files = [];
// read all files from input
console.time("Read files");
for(var i = 2; i < process.argv.length; ++i) {
    var file = SourceFile.loadSync(process.argv[i]);
    files.push(file);
}
console.timeEnd("Read files");
console.time("Generating AST");
for(var i = 0; i < files.length; ++i) {
    files[i].ast();
}
console.timeEnd("Generating AST");

console.time("Inferring ivars");
for(var i = 0; i < files.length; ++i) {
    files[i].analyze(classInstances);
}
console.timeEnd("Inferring ivars");

for(var i = 0; i < files.length; ++i) {
    program.addSource(files[i], classInstances);
}

console.log("Loaded classes: " + program.classesAmount());

// build subclasses
program.iterateClasses(function(jsclass) {
    if (!jsclass.superClass)
        return;
    var sc = program.classForName(jsclass.superClass);
    if (!sc) {
        // sometimes interface is defined as a __proto__ property
        if (!program.hasInterface(jsclass.superClass))
            console.warn("Could not find super class '" + jsclass.superClass + "'");
    } else
        sc.subClasses[jsclass.name] = true;
});

function copy(dict) {
    var res = {};
    for(var i in dict)
        res[i] = dict[i];
    return res;
}

function checkClassHierarchy(inherited, jsclass) {
    for(var ivar in jsclass.instanceVars) {
        if (ivar.charAt(0) !== "_") continue;
        if ((ivar in inherited) && inherited[ivar]._sourceFile !== jsclass._sourceFile)
            console.log(jsclass.name + "." + ivar + " overrides value defined in ".grey + inherited[ivar].name);
        inherited[ivar] = jsclass;
    }
    for(var subclass in jsclass.subClasses) {
        checkClassHierarchy(copy(inherited), program.classForName(subclass));
    }
}

program.iterateClasses(function(jsclass){
    if (jsclass.superClass)
        return;
    checkClassHierarchy({}, jsclass);
});
