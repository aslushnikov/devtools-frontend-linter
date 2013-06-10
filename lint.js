#!/usr/bin/env node

var Project = require('./lib/project.js')
  , devTools = require('./lib/devtools-analyzer.js')
  , renderer = require('./lib/devtools-report-renderer.js')
  , program = require('commander')

program
    .version("0.1.0")
    .usage("[options] <file ...>")
    .option("--full", "A full report format (on by default)")
    .option("--oneline", "A oneline report format");

program.on("--help", function() {
    console.log("  Examples:");
    console.log("    $ ./lint.js --full ./test/raw/devtools*");
    console.log("    $ ./lint.js --oneline ./test/raw/devtools*");
});

program.parse(process.argv);

if (!program.args.length)
    program.help();

var proj = Project.createFromFiles(program.args);
if (program.oneline)
    renderer.oneline(devTools.checkClassInheritance(proj));
else
    renderer.full(devTools.checkClassInheritance(proj));

