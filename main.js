var Project = require('./project.js')
  , devTools = require('./devtools-analyzer.js')
  , renderer = require('./devtools-report-renderer.js')

console.assert(process.argv.length > 2);
var proj = Project.createFromFiles(process.argv.slice(2));
var report = devTools.checkClassInheritance(proj);
var rendered = renderer.renderReport(report);
for(var i = 0; i < rendered.length; ++i)
    console.log(rendered[i]);
