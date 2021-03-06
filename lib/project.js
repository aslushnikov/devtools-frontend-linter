var JSClass = require('./jsclass.js')
  , analyzer = require('./ast-analyzer.js')
  , fs = require('fs')

function Project() {
    this._definedFunctions = {};
    this._classPrototypes = {};
    this._usedClasses = {};
}

Project.createFromFiles = function(arg) {
    var project = new Project();
    var files =  Array.isArray(arg) ? arg : arguments;
    for(var i = 0; i < files.length; ++i) {
        var text = fs.readFileSync(files[i], "utf-8");
        var ast = analyzer.ast(text);
        if (!ast) throw new Project.ParseError(files[i]);
        var definedFunctions = analyzer.definedFunctions(ast);
        var classPrototypes = analyzer.classPrototypes(ast);
        var usedClasses = analyzer.usedClasses(ast);
        project.addFile(files[i], definedFunctions, classPrototypes, usedClasses);
    }
    return project;
}

Project.prototype = {
    addFile: function(fileName, definedFunctions, classPrototypes, usedClasses) {
        for(var i in definedFunctions) {
            this._definedFunctions[i] = definedFunctions[i];
            this._definedFunctions[i].fileName = fileName;
        }
        for(var i in classPrototypes) {
            this._classPrototypes[i] = classPrototypes[i];
            this._classPrototypes[i].fileName = fileName;
        }
        for(var i in usedClasses) {
            this._usedClasses[i] = usedClasses[i];
        }
    },

    classesAndFileNames: function() {
        var res = {};
        var classToFileName = {};
        for(var className in this._usedClasses) {
            var init = this._definedFunctions[className];
            var proto = this._classPrototypes[className];
            if (!init) {
                // Our "used classes" euristic is not strong enough
                continue;
            }
            if (proto && proto.fileName !== init.fileName)
                throw new Error("Bad practice: class constructor and prototype defined in different files");
            res[className] = new JSClass(className, init, proto);
            classToFileName[className] = init.fileName;
        }

        for(var className in this._classPrototypes) {
            if (res[className])
                continue;
            var init = this._definedFunctions[className];
            var proto = this._classPrototypes[className];
            if (!init) {
                // this looks like extension an embedded class
                continue;
            }
            if (proto && proto.fileName !== init.fileName)
                throw new Error("Bad practice: class constructor and prototype defined in different files");
            res[className] = new JSClass(className, init, proto);
            classToFileName[className] = init.fileName;
        }
        return {
            classes: res,
            fileNames: classToFileName
        };
    }
}

Project.ParseError = function(fileName) {
    this._fileName = fileName;
}

Project.ParseError.prototype = {
    fileName: function() {
        return this._fileName;
    },

    __proto__: Error.prototype
}


module.exports = Project;
