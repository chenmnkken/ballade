'use strict';

// @TODO 保持 console

var copy = require('./copy');
var Event = require('./event');
var Cache = require('./cache');

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
var _MutableStore = function (schema) {
    var defaultData = schema.defaultData;
    this.store = {};
    this.cache = {};
    this.schema = schema;

    Object.keys(defaultData).forEach(function (item) {
        if (schema.cacheConfig && schema.cacheConfig[item]) {
            this.cache[item] = new Cache(schema.cacheConfig[item]);
        }
        else {
            this.store[item] = defaultData[item];
        }
    }.bind(this));
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
            if (key in this.cache) {
                this.cache[key].set(result.value, fresh);
            }
            else {
                this.store[key] = result.value;
            }

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
        if (key in this.cache) {
            this.cache[key].delete(id);
        }
        else {
            delete this.store[key];
        }

        return key;
    }
};

/**
 * MutableStore Class
 * @param {Object} store schema
 * var mutableStore = new MmutableStore({foo: 'bar'});
 * @mutableStore.mutable: mutableStore data
 * @mutableStore.event: Event instance
 */
var MutableStore = function (schema) {
    this.mutable = new _MutableStore(schema);
    this.event = new Event();
};

module.exports = MutableStore;
