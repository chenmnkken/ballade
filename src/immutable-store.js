'use strict';

var Event = require('./event');
var _Immutable;

if (typeof self !== 'undefined' && self.Immutable) {
    _Immutable = self.Immutable;
}
else if (typeof global !== 'undefined' && global.Immutable) {
    _Immutable = global.Immutable;
}
else {
    _Immutable = require('immutable');
}

var typeProfiler = function (subject) {
    return Object.prototype.toString.call(subject).slice(8, -1);
};

/**
 * ImmutableStore Class
 * @param {Object} store schema
 * var immutableStore = new ImmutableStore({foo: 'bar'});
 * @immutableStore.immutable: Immutable data
 * @immutableStore.event: Event instance
 */
var ImmutableStore = function (schema) {
    // If has reference type in schema, should to achieve nested Record
    Object.keys(schema).forEach(function (item) {
        var value = schema[item];
        var type = typeProfiler(value);

        if (type === 'Array' || type === 'Object') {
            schema[item] = _Immutable.fromJS(value);
        }
    });

    this.immutable = new (_Immutable.Record(schema))();
    this.event = new Event();
};

module.exports = ImmutableStore;
