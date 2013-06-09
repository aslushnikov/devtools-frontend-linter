var colors = require('colors')

function renderReportEntry(entry) {
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

function renderReport(report) {
    var res = [];
    for(var i = 0; i < report.length; ++i)
        res.push(renderReportEntry(report[i]));
    return res;
}

module.exports = {
    renderEntry: renderReportEntry,
    renderReport: renderReport
};
