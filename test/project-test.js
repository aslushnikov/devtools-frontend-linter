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
        proj.classesAndFileNames().classes.should.have.keys("Foo");
    });
    it("should load classes from multiple files", function() {
        var proj = new Project();
        addToProj(proj, "./test/raw/hierarchy-1.js");
        addToProj(proj, "./test/raw/hierarchy-2.js");
        var classes = proj.classesAndFileNames().classes;
        var fileNames = proj.classesAndFileNames().fileNames;
        classes.should.have.keys("Foo", "Bar");
        fileNames.should.have.keys("Foo", "Bar");
        should.not.exist(classes.Foo.superClass());
        fileNames.Foo.should.be.equal("./test/raw/hierarchy-1.js");
        classes.Bar.superClass().should.be.equal("Foo");
        fileNames.Bar.should.be.equal("./test/raw/hierarchy-2.js");
    });
    it("should load interfaces as well", function() {
        var proj = new Project();
        addToProj(proj, "./test/raw/hierarchy-1.js");
        addToProj(proj, "./test/raw/hierarchy-2.js");
        addToProj(proj, "./test/raw/interface.js");
        var classes = proj.classesAndFileNames().classes;
        classes.should.have.keys("Foo", "Bar", "SomeInterface");
    });
});
