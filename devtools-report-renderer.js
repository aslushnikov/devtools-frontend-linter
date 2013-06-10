var colors = require('colors')

function renderEntryFull(entry) {
    if (entry.type === "ivar_clash") {
        var s = "Private ivar reused: " + ("this." + entry.ivar).bold;
        s += "\n    - found in " + entry.className1.bold + (" (" + entry.fileName1 + ")");
        s += "\n    - found in " + entry.className2.bold + (" (" + entry.fileName2 + ")");
        return s;
    } else if (entry.type === "missing_super") {
        var s = "Super class declaration missing";
        s += "\n    - superclass name: " + entry.missing;
        s += "\n    - referenced from: " + entry.referenced;
        return s;
    }
}

function renderEntryOneLine(entry) {
    if (entry.type === "ivar_clash") {
        var ivar = "this." + entry.ivar;
        return "Private var " + ivar.bold + " gets assigned in " + entry.className1.bold + " and " + entry.className2.bold;
    } else if (entry.type === "missing_super") {
        var superClass = entry.missing;
        var reference = entry.referenced;
        return "Superclass " + superClass.bold + " of class " + reference.bold + " is missing";
    }
}

function renderReport(entryRenderer, report) {
    for(var i = 0; i < report.length; ++i)
        console.log(entryRenderer(report[i]));

    if (report.length)
        console.log(("Total errors: " + report.length).red);
    else
        console.log("No errors found".green);
}

module.exports = {
    full: renderReport.bind(this, renderEntryFull),
    oneline: renderReport.bind(this, renderEntryOneLine)
}
