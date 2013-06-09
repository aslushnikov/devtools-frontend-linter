var A = function(foo, bar) {
   this._foo = foo;
   this._bar = bar;
}

A.prototype = {
    myFoo: function() {
    },

    myBar: function() {
    }
}

A.prototype.myLager = "asdf";

var B = function() {
    A.call(this);
}

B.prototype = {
    __proto__: A.prototype,
    myBar: function() {
    }
}

function foo() {
}

new B();

