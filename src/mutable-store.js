'use strict';

/* global self */

var copy = require('./copy');
var Event = require('./event');
var Cache = require('./cache');
var persistence = require('./persistence');

var baseTypes = {
    'string': true,
    'number': true,
    'null': true,
    'undefind': true,
    'boolean': true
};

/**
 * Mutable Class
 * Use to mutable object data, the instance can set/get for plain object.
 * @param {Object} store schema
 */
var _MutableStore = function (schema, options) {
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
            if (hasIdCache) {
                self.cache[key].set(value, true);
            }
            else {
                self.store[key] = value;
            }
        }
    });
};

_MutableStore.prototype = {
    /**
     * Set data in store.
     * If the key not in schema, set operation should failed.
     * @param {String} object key
     * @param {Any} data
     * @param {Boolean} whether update cache
     * @return {String} object key
     */
    set: function (key, value, fresh) {
        var result = this.schema.validator(key, value);
        var options = this.options;
        var cacheOptions = options.cache;
        var errors = [];
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

            if (options && options.error) {
                options.error({
                    key: key,
                    type: 'SCHEMA_VALIDATION_ERROR',
                    messages: errors
                }, self);
            }
        }

        if ('value' in result) {
            newValue = result.value;

            if (key in this.cache) {
                this.cache[key].set(newValue, fresh);
            }
            else {
                this.store[key] = newValue;
            }

            if (cacheOptions && cacheOptions[key] && cacheOptions[key].persistence) {
                persistence.set(
                    cacheOptions[key].persistence.prefix + '.' + key,
                    result.value,
                    cacheOptions[key].persistence.type
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
     * @param {String} Cache id
     * @return {Any} data
     */
    get: function (key, id) {
        var result;
        var type;

        if (key in this.cache) {
            if (id) {
                result = this.cache[key].get(id);
            }
            else {
                result = this.cache[key].cacheStore;
            }
        }
        else {
            result = this.store[key];
        }

        type = typeof result;

        if (baseTypes[type]) {
            return result;
        }

        return copy(result);
    },

    /**
     * Delete data from store.
     * @param {String} object key
     * @param {String} Cache id
     * @return {String} object key
     */
    'delete': function (key, id) {
        var cacheOptions = this.options.cache;

        if (key in this.cache) {
            this.cache[key].delete(id);
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
 * MutableStore Class
 * @param {Object} store schema
 * @param {Object} store options
 * options.cache set cache in store
 * options.error schema validator error
 * var mutableStore = new MmutableStore({foo: 'bar'});
 * @mutableStore.mutable: mutableStore data
 * @mutableStore.event: Event instance
 */
var MutableStore = function (schema, options) {
    this.mutable = new _MutableStore(schema, options);
    this.event = this.mutable.event;
};

module.exports = MutableStore;
