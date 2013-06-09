var fs = require('fs')
  , analyzer = require('./ast-analyzer.js')

console.assert(process.argv.length > 2);
var files = process.argv.slice(2);

for(var i = 0; i < files.length; ++i) {
    var data = fs.readFileSync(files[i], "utf-8");
    var ast = analyzer.parseAST(data);
    console.log("=====" + files[i] + "=====");
    dumpUsedClasses(ast);
    dumpDefinedFunctions(ast);
    dumpClassPrototypes(ast);
}

function dumpUsedClasses(ast) {
    var usedClasses = analyzer.classUsages(ast);
    var classes = [];
    for(var i in usedClasses)
        classes.push(i);
    console.log("Used classes: ");
    console.log(classes);
}

function dumpDefinedFunctions(ast) {
    var funs = analyzer.definedFunctions(ast);
    var f = [];
    for(var i in funs) {
        f.push(i);
    }
    console.log("Defined functions: ");
    console.log(f);
}

function dumpClassPrototypes(ast) {
    console.log("Prototypes: ");
    var protos = analyzer.classPrototypes(ast);
    for(var i in protos) {
        var proto = protos[i];
        var properties = [];
        for(var j in proto.props)
            properties.push(j);
        console.log(i + ": super=" + protos[i].superClass + " props={" + properties.join(",") + "}");
    }
}
