function Foo() {
    this._bar = 1;
}

Foo.prototype = {
    fooish: function() {
        return 42;
    }
}
