var analyzer = require('../lib/ast-analyzer.js')
  , fs = require('fs')
  , JSClass = require('../lib/jsclass.js')

describe("JSClass", function() {
    it("should be correctly created", function() {
        var f = fs.readFileSync("./test/raw/simpleClass.js", "utf-8");
        var ast = analyzer.ast(f);
        var funDefs = analyzer.definedFunctions(ast);
        var protos = analyzer.classPrototypes(ast);
        funDefs.should.have.property("Foo");
        protos.should.have.property("Foo");
        var jsc = new JSClass("Foo", funDefs.Foo, protos.Foo);
        jsc.ivars().should.have.keys("_foo", "_processShit", "_bar");
    });
});
