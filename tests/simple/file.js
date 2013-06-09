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

B.C = function() {
}

var funky = {
    funkyMethod: function() { }
};

B.C.prototype = {
    __proto__: funky
}

new B();

