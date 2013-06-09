var fs = require('fs')
  , analyzer = require('../analyzer.js')

console.assert(process.argv.length > 2);
var files = process.argv.slice(2);

for(var i = 0; i < files.length; ++i) {
    var data = fs.readFileSync(files[i], "utf-8");
    var ast = analyzer.parseAST(data);
    console.log(keysArray(analyzer.classUsages(ast)));
}

function keysArray(dict) {
    var res = [];
    for(var i in dict) {
        res.push(i);
    }
    return res;
}
