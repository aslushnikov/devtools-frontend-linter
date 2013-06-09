var analyzer = require('./ast-analyzer.js');

function JSClass(className, init, proto) {
    proto = proto || {props: {}, superClass: null};
    this._ivars = {};
    this._processIvars(init);
    this._className = className;
    for(var i in proto.props) {
        this._ivars[i] = true;
        this._processIvars(proto.props[i]);
    }
    this._superClass = proto.superClass;
}

JSClass.prototype = {
    _processIvars: function(node) {
        var ivars = analyzer.instanceVariables(node);
        for(var ivar in ivars) {
            this._ivars[ivar] = true;
        }
    },

    superClass: function() {
        return this._superClass;
    },

    ivars: function() {
        return this._ivars;
    },

    name: function() {
        return this._className;
    }
}

module.exports = JSClass;
