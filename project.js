var JSClass = require('./jsclass.js');

function Project() {
    this._definedFunctions = {};
    this._classPrototypes = {};
    this._usedClasses = {};
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
            if (!init)
                throw new Error("Class constructor was not defined, but was called");
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
            if (!init)
                throw new Error("Class constructor was not defined, but prototype was");
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

module.exports = Project;
