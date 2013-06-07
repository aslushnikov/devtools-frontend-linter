function foo() {
    return 2;
}

A = function(a, b) {
}

B = function(c, d) {
    A.call(this);
}

B.prototype = {
}

var a = new A.B[C]();

