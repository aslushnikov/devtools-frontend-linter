A.Bar = function(url) {
    A.Foo.call(this, url);
}

A.Bar.prototype = {
    check: function() {
        this._shortcuts = "aa";
    },

    __proto__: A.Foo.prototype
}
