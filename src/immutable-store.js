'use strict';

/* global self */

var toString = Object.prototype.toString;
var Event = require('./event');
var Cache = require('./cache');
var persistence = require('./persistence');
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
var _ImmutableStore = function (schema, options) {
    options = options || {};
    this.store = {};
    this.cache = {};
    this.schema = schema;
    this.event = new Event();
    this.options = options;

    var defaultData = schema.defaultData;
    var cacheOptions = options.cache;
    var self = this;

    Object.keys(schema.dataTypes).forEach(function (key) {
        var hasCache = cacheOptions && key in cacheOptions;
        var hasIdCache = false;
        var value;

        if (hasCache && cacheOptions[key].id) {
            self.cache[key] = new Cache(cacheOptions[key]);
            hasIdCache = true;
        }

        if (hasCache && cacheOptions[key].persistence) {
            value = persistence.get(cacheOptions[key].persistence.prefix + '.' + key, cacheOptions[key].persistence.type);
        }

        if (!value) {
            value = defaultData[key];
        }

        if (value) {
            value = outputImmutableData(value);

            if (hasIdCache) {
                self.cache[key].set(value, true, true);
            }
            else {
                self.store[key] = value;
            }
        }
    });
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
        var self = this;
        var options = this.options;
        var cacheOptions = options.cache;
        // meke sure value is mutable for input validator
        var isImmutable = _typeof(value.toJS) === 'Function';
        // value is mutable data or immutable data
        var result = this.schema.validator(key, value, isImmutable);
        var newValue;
        var errors = [];

        if (result.messages) {
            result.messages.forEach(function (item) {
                if (item.type === 'warning') {
                    console.warn('Schema Validation Warning: ' + item.message + ', path is `' + item.path + '`, value is ', item.originalValue);
                }
                else if (item.type === 'error') {
                    console.error('Schema Validation Error: ' + item.message + ', path is `' + item.path + '`, value is ', item.originalValue);
                    errors.push(item);
                }
            });

            if (options.error) {
                options.error({
                    key: key,
                    type: 'SCHEMA_VALIDATION_ERROR',
                    messages: errors
                }, self);
            }
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

            if (cacheOptions && cacheOptions[key] && cacheOptions[key].persistence) {
                persistence.set(
                    cacheOptions[key].persistence.prefix + '.' + key,
                    newValue,
                    cacheOptions[key].persistence.type,
                    isImmutable
                );
            }

            this.event.publish(key, newValue);
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
        var cacheOptions = this.options.cache;

        if (id && key in this.cache) {
            this.cache[key].delete(id, true);
        }
        else {
            delete this.store[key];
        }

        if (cacheOptions && cacheOptions[key] && cacheOptions[key].persistence) {
            persistence.delete(
                cacheOptions[key].persistence.prefix + '.' + key,
                cacheOptions[key].persistence.type
            );
        }

        return key;
    }
};

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
    this.immutable = new _ImmutableStore(schema, options);
    this.event = this.immutable.event;
};

module.exports = ImmutableStore;
