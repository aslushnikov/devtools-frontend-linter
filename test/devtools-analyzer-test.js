var devToolsAnalyzer = require("../lib/devtools-analyzer.js")
  , Project = require("../lib/project.js")

describe("DevTools analyzer", function() {
    it("should detect private vars overlapping", function() {
        var proj = Project.createFromFiles(
            "./test/raw/devtoolsFoo.js",
            "./test/raw/devtoolsBar.js"
        );
        var report = devToolsAnalyzer.checkClassInheritance(proj);
        report.should.have.lengthOf(1);
        report[0].should.have.property("type", "ivar_clash");
        report[0].should.have.property("ivar", "_shortcuts");
    });
});


