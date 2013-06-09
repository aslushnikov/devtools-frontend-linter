#!/usr/bin/env node

var Project = require('./project.js')
  , devTools = require('./devtools-analyzer.js')
  , renderer = require('./devtools-report-renderer.js')

console.assert(process.argv.length > 2);
var proj = Project.createFromFiles(process.argv.slice(2));
var report = renderer.renderReport(devTools.checkClassInheritance(proj));
if (report.length) {
    for(var i = 0; i < report.length; ++i)
        console.log(report[i]);
} else {
    console.log("0 errors found");
}
