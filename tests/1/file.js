var A = function(foo, bar) {
   this._foo = foo;
   this._bar = bar;
}

var B = function() {
    A.call(this);
}

new A();

