#!/usr/bin/env node

var Project = require('./project.js')
  , devTools = require('./devtools-analyzer.js')
  , renderer = require('./devtools-report-renderer.js')

console.assert(process.argv.length > 2);
var proj = Project.createFromFiles(process.argv.slice(2));
renderer.oneline(devTools.checkClassInheritance(proj));

