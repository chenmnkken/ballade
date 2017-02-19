'use strict';

var toString = Object.prototype.toString;
var Event = require('./event');
var Cache = require('./cache');
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

var _typeof = function (subject) {
    return toString.call(subject).slice(8, -1);
};

var outputImmutableData = function (data) {
    var type = _typeof(data);

    if (type === 'Array' || type === 'Object') {
        return _Immutable.fromJS(data);
    }

    return data;
};

/**
 * Mutable Class
 * Use to mutable object data, the instance can set/get for plain object.
 * @param {Object} store schema
 */
var _ImmutableStore = function (schema) {
    var defaultData = schema.defaultData;
    this.store = {};
    this.cache = {};
    this.schema = schema;

    Object.keys(defaultData).forEach(function (item) {
        if (schema.cacheConfig && schema.cacheConfig[item]) {
            this.cache[item] = new Cache(schema.cacheConfig[item]);
        }
        else {
            this.store[item] = outputImmutableData(defaultData[item]);
        }
    }.bind(this));
};

_ImmutableStore.prototype = {
    /**
     * Set data in store.
     * If the key not in schema, set operation should failed.
     * @param {String} object key
     * @param {Any} data
     * @return {String} object key
     */
    set: function (key, value, fresh) {
        // meke sure value is mutable for input validator
        var isImmutable = _typeof(value.toJS) === 'Function';
        // value is mutable data or immutable data
        var result = this.schema.validator(key, value, isImmutable);
        var newValue;

        if (result.messages) {
            result.messages.forEach(function (item) {
                if (item.type === 'warning') {
                    console.warn('Schema Validation Warning: ' + item.message + ', path is `' + item.path + '`, value is ', item.originalValue);
                }
                else if (item.type === 'error') {
                    console.error('Schema Validation Error: ' + item.message + ', path is `' + item.path + '`, value is ', item.originalValue);
                }
            });
        }

        if ('value' in result) {
            // meke sure value is immutable for immutable store
            newValue = isImmutable ? result.value : outputImmutableData(result.value);

            if (key in this.cache) {
                this.cache[key].set(newValue, fresh, true);
            }
            else {
                this.store[key] = newValue;
            }

            return key;
        }
    },

    /**
     * Get data from store.
     * If data is reference type, should return copies of data
     * @param {String} object key
     * @return {Any} data
     */
    get: function (key, id) {
        var result;

        if (key in this.cache) {
            if (id) {
                result = this.cache[key].get(id, true);
            }
            else {
                result = this.cache[key].cacheStore;
            }
        }
        else {
            result = this.store[key];
        }

        return result;
    },

    /**
     * Delete data from store.
     * @param {String} object key
     * @return {String} object key
     */
    'delete': function (key, id) {
        if (key in this.cache) {
            this.cache[key].delete(id, true);
        }
        else {
            delete this.store[key];
        }

        return key;
    }
};

/**
 * ImmutableStore Class
 * @param {Object} store schema
 * var immutableStore = new ImmutableStore({foo: 'bar'});
 * @immutableStore.immutable: Immutable data
 * @immutableStore.event: Event instance
 */
var ImmutableStore = function (schema) {
    this.immutable = new _ImmutableStore(schema);
    this.event = new Event();
};

module.exports = ImmutableStore;
