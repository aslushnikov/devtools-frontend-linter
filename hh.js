WebInspector = {};
require("./utilities.js");
require("./Object.js");
require("./SourceTokenizer.js");
require("./SourceJavaScriptTokenizer.js");
var fs = require("fs");
var tokenizer = new WebInspector.SourceJavaScriptTokenizer();

for(var i = 2; i < process.argv.length; ++i) {
    processFile(process.argv[i]);
}

function processFile(fileName)
{
    tokenizer.condition = tokenizer.createInitialCondition();
    var text = fs.readFileSync( fileName, "utf-8").split("\n");
    var state = "";
    var className = "";
    var comment = "";

    function isClassHeaderComment(comment)
    {
        return (comment.indexOf("@constructor") >= 0);
    }

    function logYUMLEntry(className, e, impl)
    {
        if (e)
            console.log("[" + e+ "] ^- [" + className + "]");
        if (impl)
            console.log("[" + impl + "] ^-.- [" + className + "]");
    }

    for(var i = 0; i < text.length; ++i) {
        var line = text[i];
        tokenizer.line = line;
        lastColumn = 0;
        while (lastColumn < line.length) {
            var newColumn = tokenizer.nextToken(lastColumn);
            var tokenType = tokenizer.tokenType;
            var token = line.substring(lastColumn, newColumn);
            if (!state) {
                if (tokenType === "javascript-comment") {
                    state = "comment";
                    comment = token;
                }
            } else if (state === "comment") {
                if (tokenType === "javascript-comment") 
                    comment += token;
                else if (tokenType === "whitespace") {
                } else if (tokenType === "javascript-ident") {
                    className += token;
                    state = "class";
                } else if (tokenType === "javascript-keyword" || tokenType === "block-end" || tokenType === "block-start" || tokenType === "brace-start" || tokenType === "brace-end" || tokenType === "javascript-string" || !tokenType) {
                    state = "";
                } else
                    throw "Unexpected token '" + token + "' of type " + tokenType + " in state = " + state;
            } else if (state === "class") {
                if (token === ".")
                    className += ".";
                else if (tokenType === "javascript-ident")
                    className += token;
                else {
                    state = "";
                    if (isClassHeaderComment(comment)) {
                        var extendsClass = comment.match(/@extends *{ *([a-zA-Z0-9._]*)/);
                        extendsClass = extendsClass ? extendsClass[1] : null;
                        var implementsClass = comment.match(/@implements *{ *([a-zA-Z0-9._]*)/);
                        implementsClass = implementsClass ? implementsClass[1] : null;
                        logYUMLEntry(className, extendsClass, implementsClass);
                    }
                    className = "";
                }
            }
            lastColumn = newColumn;
        }
    }
}
