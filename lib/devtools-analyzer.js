function privateIvar(ivarName) {
    return ivarName.charAt(0) === "_";
}

function checkClassInheritance(project) {
    var report = [];
    var classesAndFileNames = project.classesAndFileNames();
    var classes = classesAndFileNames.classes;
    var fileNames = classesAndFileNames.fileNames;

    function clashReport(ivar, className1, className2) {
        report.push({
            type: "ivar_clash",
            ivar: ivar,
            className1: className1,
            className2: className2,
            fileName1: fileNames[className1],
            fileName2: fileNames[className2]
        });
    }

    function missingSuperReport(jsclass) {
        report.push({
            type: "missing_super",
            referenced: jsclass.name(),
            missing: jsclass.superClass()
        });
    }

    function checkIvars(jsclass, inherited) {
        var myFileName = fileNames[jsclass.name()];
        var ivars = jsclass.ivars();
        for(var ivar in ivars) {
            if (!privateIvar(ivar))
                continue;
            if (inherited[ivar] && fileNames[inherited[ivar]] !== myFileName) {
                clashReport(ivar, inherited[ivar], jsclass.name());
            }
            inherited[ivar] = jsclass.name();
        }
        if (jsclass.superClass()) {
            var superClass = classes[jsclass.superClass()];
            if (!superClass) {
                missingSuperReport(jsclass);
            } else {
                checkIvars(superClass, inherited);
            }
        }
    }
    for(var className in classes) {
        var jsclass = classes[className];
        if (jsclass.superClass())
            checkIvars(jsclass, {});
    }
    return report;
}

module.exports = {
    checkClassInheritance: checkClassInheritance
};
