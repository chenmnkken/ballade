'use strict';

/* global self */

var Store = require('./store');
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

/**
 * ImmutableStore Class
 * @param {Object} store schema
 * @param {Object} store options
 * options.cache set cache in store
 * options.error schema validator error
 * var immutableStore = new ImmutableStore({foo: 'bar'});
 * @immutableStore.immutable: Immutable data
 * @immutableStore.event: Event instance
 */
var ImmutableStore = function (schema, options) {
    Store.call(this, schema, options, _Immutable);
};

ImmutableStore.prototype = Object.create(Store.prototype, {
    constructor: {
        value: ImmutableStore,
        enumerable: false,
        writable: true,
        configurable: true
    }
});

module.exports = ImmutableStore;
