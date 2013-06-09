var fs = require('fs')
  , analyzer = require('../ast-analyzer.js')

describe("Function declarations analyzer", function() {
    function funs(text) {
        var ast = analyzer.ast(text);
        return analyzer.definedFunctions(ast);
    }
    it("should report function statement", function() {
        funs("function foo() { }").should.have.keys("foo");
        funs("function foo(a, b) { }").should.have.keys("foo");
    });
    it("should report function expression", function() {
        funs("var foo = function() {}").should.have.keys("foo");
        funs("var foo = function bar() {}").should.have.keys("foo");
        funs("Foo.bar = function bar() {}").should.have.keys("Foo.bar");
    });
});

describe("Class usage analyzer", function() {
    function classes(text) {
        var ast = analyzer.ast(text);
        return analyzer.usedClasses(ast);
    }
    it("should report 'new' statement", function() {
        classes("var a = new Foo()").should.have.keys("Foo");
        classes("var a = new Foo.Bar()").should.have.keys("Foo.Bar");
        classes("new Foo.Bar()").should.have.keys("Foo.Bar");
        classes("(new Foo.Bar())").should.have.keys("Foo.Bar");
        classes("function a() { return new Foo.Bar(); }").should.have.keys("Foo.Bar");
    });
    it("should report 'call(this,..)' statement", function() {
        classes("function Foo() { Bar.call(this); }").should.have.keys("Bar");
        classes("function Foo() { Bar.call(); }").should.not.have.keys("Bar");
        classes("function Foo() { Bar.Baz.call(a, this); }").should.not.have.keys("Bar.Bar");
        classes("function Foo() { Bar.Baz.call(this); }").should.have.keys("Bar.Baz");
    });
});

describe("Prototypes analyzer", function() {
    function protos(text) {
        var ast = analyzer.ast(text);
        return analyzer.classPrototypes(ast);
    }
    it("should parse prototype object expression", function() {
        protos("Foo.prototype = { bar: 213 };").should.have.property("Foo")
            .with.property("props")
            .with.property("bar");
    });
    it("should parse prototype properties", function() {
        protos("Foo.prototype.baz = 213;").should.have.property("Foo")
            .with.property("props")
            .with.property("baz");
        protos("Foo.prototype.baz.maz = 213;").should.have.property("Foo")
            .with.property("props")
            .with.property("baz");
    });
    it("should parse __proto__ property", function() {
        protos("Foo.prototype.__proto__ = new Bar();").should.have.property("Foo")
            .with.property("superClass", "Bar");
        protos("Foo.prototype.__proto__ = new Bar.Baz();").should.have.property("Foo")
            .with.property("superClass", "Bar.Baz");
        protos("Foo.prototype.__proto__ = Bar.Baz;").should.have.property("Foo")
            .with.property("superClass", "Bar.Baz");
        protos("Foo.prototype.__proto__ = Bar.prototype;").should.have.property("Foo")
            .with.property("superClass", "Bar");
        protos("Foo.prototype = { __proto__: Bar }").should.have.property("Foo")
            .with.property("superClass", "Bar");
        protos("Foo.prototype = { __proto__: new Bar }").should.have.property("Foo")
            .with.property("superClass", "Bar");
        protos("Foo.prototype = { __proto__: Bar.prototype }").should.have.property("Foo")
            .with.property("superClass", "Bar");
        protos("Foo.prototype = { __proto__: Bar.Baz.prototype }").should.have.property("Foo")
            .with.property("superClass", "Bar.Baz");
        var mixed = protos("Foo.prototype = { __proto__: Bar.Baz.prototype, oppa: 42 }");
        mixed.should.have.property("Foo")
            .with.property("superClass", "Bar.Baz");
        mixed.should.have.property("Foo")
            .with.property("props")
            .with.property("oppa");
    });
    it("should parse infer classic inheritance", function() {
        protos("Foo.prototype = new Bar();").should.have.property("Foo")
            .with.property("superClass", "Bar");
        protos("Foo.prototype = new Bar.Baz();").should.have.property("Foo")
            .with.property("superClass", "Bar.Baz");
    });
});

describe("Instance variables analyzer", function() {
    function ivars(text) {
        var ast = analyzer.ast(text);
        return analyzer.instanceVariables(ast);
    }
    it("should parse instance variables in functions", function() {
        ivars("function bar() { this.foo = 1; }").should.have.property("foo");
    });
});
