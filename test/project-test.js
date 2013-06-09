var fs = require('fs')
  , Project = require('../project.js')
  , analyzer = require('../ast-analyzer.js')
  , should = require('should')

describe("Project", function() {
    function addToProj(project, fileName) {
        var text = fs.readFileSync(fileName, "utf-8");
        var ast = analyzer.ast(text);
        var definedFunctions = analyzer.definedFunctions(ast);
        var classPrototypes = analyzer.classPrototypes(ast);
        var usedClasses = analyzer.usedClasses(ast);
        project.addFile(fileName, definedFunctions, classPrototypes, usedClasses);
    }
    it("should load classes from single file", function() {
        var proj = new Project();
        addToProj(proj, "./test/raw/simpleClass.js");
        proj.classes().should.have.keys("Foo");
    });
    it("should load classes from multiple files", function() {
        var proj = new Project();
        addToProj(proj, "./test/raw/hierarchy-1.js");
        addToProj(proj, "./test/raw/hierarchy-2.js");
        var classes = proj.classes();
        classes.should.have.keys("Foo", "Bar");
        should.not.exist(classes.Foo.jsclass.superClass());
        classes.Foo.fileName.should.be.equal("./test/raw/hierarchy-1.js");
        classes.Bar.jsclass.superClass().should.be.equal("Foo");
        classes.Bar.fileName.should.be.equal("./test/raw/hierarchy-2.js");
    });
});
