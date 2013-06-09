function Foo(arg) {
    this._foo = arg;
    this._processShit();
}

Foo.prototype = {
    _processShit: function() {
        if (this.foo === 2) {
            return 3;
        }
        this._bar = 4;
    }
}
