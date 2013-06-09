function Bar() {
    Foo.call(this);
    this._smth = 3;
}

Bar.prototype = {
    a: function() {
    },

    __proto__: Foo.prototype,

    b: function() {
    }
}
