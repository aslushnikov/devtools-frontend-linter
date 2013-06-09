A = {};

A.Foo = function(url) {
    this._shortcuts = {};
}

A.Foo.prototype = {
    _registerShortcuts: function() {
        this._shortcuts = 123;
    }
}

A.Baz = function(url) {
    A.Foo.call(this, url);
}

A.Baz.prototype = {
    _registerShortcuts: function() {
        this._shortcuts = 321;
    },

    __proto__: A.Foo.prototype
}
