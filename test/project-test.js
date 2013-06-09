var Project = require('../project.js')
  , should = require('should')

describe("Project", function() {
    it("should load classes from single file", function() {
        var proj = Project.createFromFiles("./test/raw/simpleClass.js");
        proj.classesAndFileNames().classes.should.have.keys("Foo");
    });
    it("should load classes from multiple files", function() {
        var proj = Project.createFromFiles( "./test/raw/hierarchy-1.js",
            "./test/raw/hierarchy-2.js"
        );
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
        var proj = Project.createFromFiles(
            "./test/raw/hierarchy-1.js",
            "./test/raw/hierarchy-2.js",
            "./test/raw/interface.js"
        );
        var classes = proj.classesAndFileNames().classes;
        classes.should.have.keys("Foo", "Bar", "SomeInterface");
    });
});
