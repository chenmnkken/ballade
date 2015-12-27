'use strict';

var copy = require('./copy');
var Event = require('./event');

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
var Mutable = function (schema) {
    this.store = {};

    Object.keys(schema).forEach(function (item) {
        this.store[item] = schema[item];
    }.bind(this));
};

Mutable.prototype = {
    /**
     * Set data in store.
     * If the key not in schema, set operation should failed.
     * @param {String} object key
     * @param {Any} data
     * @return {String} object key
     */
    set: function (key, value) {
        if (key in this.store) {
            this.store[key] = value;
            return key;
        }
    },

    /**
     * Get data from store.
     * If data is reference type, should return copies of data
     * @param {String} object key
     * @return {Any} data
     */
    get: function (key) {
        var result = this.store[key];
        var type = typeof result;

        if (baseTypes[type]) {
            return result;
        }

        return copy(result);
    },

    /**
     * Delete data from store.
     * @param {String} object key
     * @return {String} object key
     */
    delete: function (key) {
        delete this.store[key];
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
    this.mutable = new Mutable(schema);
    this.event = new Event();
};

module.exports = MutableStore;
