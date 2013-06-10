var colors = require('colors')

function renderEntryFull(entry) {
    if (entry.type === "ivar_clash") {
        var s = "Private ivar clash: ".red + ("this." + entry.ivar).bold;
        s += "\n    - found in ".grey + entry.className1 + (" (" + entry.fileName1 + ")").grey;
        s += "\n    - found in ".grey + entry.className2 + (" (" + entry.fileName2 + ")").grey;
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
        var className1 = entry.className1 + "." + entry.ivar;
        var className2 = entry.className2 + "." + entry.ivar;
        return className1.bold + " clashed with ".red + className2.bold;
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
        console.log(("\nTotal errors: " + report.length).red);
    else
        console.log("No errors found".green);
}

module.exports = {
    full: renderReport.bind(this, renderEntryFull),
    oneline: renderReport.bind(this, renderEntryOneLine)
}
