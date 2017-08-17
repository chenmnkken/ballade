'use strict';

var toString = Object.prototype.toString;
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

var _typeof = function (subject) {
    return toString.call(subject).slice(8, -1);
};

var outputImmutableData = function (data, _Immutable) {
    var type = _typeof(data);

    if (type === 'Array' || type === 'Object') {
        return _Immutable.fromJS(data);
    }

    return data;
};

/**
 * Store Class
 * @param {Object} store schema
 * @param {Object} store options
 * options.cache set cache in store
 * options.error schema validator error
 * var Store = new MStore({foo: 'bar'});
 * @Store.mutable: Store data
 * @Store.event: Event instance
 */
var Store = function (schema, options, _Immutable) {
    Event.call(this);
    options = options || {};

    var defaultData = schema.defaultData;
    var cacheOptions = options.cache;
    var self = this;

    this.store = {};
    this.cache = {};
    this.schema = schema;
    this.Immutable = _Immutable;
    this.options = options;

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

        if (value === null || value === undefined) {
            value = defaultData[key];
        }

        if (value !== null && value !== undefined) {
            if (_Immutable) {
                value = outputImmutableData(value, _Immutable);
            }

            if (hasIdCache) {
                self.cache[key].set(value, false, !!_Immutable);
            }
            else {
                self.store[key] = value;
            }
        }
    });
};

Store.prototype = Object.create(Event.prototype, {
    constructor: {
        value: Store,
        enumerable: false,
        writable: true,
        configurable: true
    }
});

/**
 * Set data in store.
 * If the key not in schema, set operation should failed.
 * @param {String} object key
 * @param {Any} data
 * @param {Boolean} whether update cache
 * @param {Boolean} If pureSet is true, do not publish data change event.
 * @return {String} object key
 */
Store.prototype.set = function (key, value, fresh, pureSet) {
    var options = this.options;
    var cacheOptions = options.cache;
    var isImmutable = this.Immutable && _typeof(value.toJS) === 'Function';
    var result = this.schema.validator(key, value, isImmutable);
    var errors = [];
    var newValue;

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

        if (options && options.error) {
            options.error({
                key: key,
                type: 'SCHEMA_VALIDATION_ERROR',
                messages: errors
            }, this);
        }
    }

    if ('value' in result) {
        if (this.Immutable) {
            newValue = isImmutable ? result.value : outputImmutableData(result.value, this.Immutable);
        }
        else {
            newValue = result.value;
        }

        if (key in this.cache) {
            this.cache[key].set(newValue, fresh, isImmutable);
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

        if (!pureSet) {
            this.publish(key, newValue);
        }

        return key;
    }
};

/**
 * Get data from store.
 * If data is reference type, should return copies of data
 * @param {String} object key
 * @param {String} Cache id
 * @return {Any} data
 */
Store.prototype.get = function (key, id) {
    var isImmutable = !!this.Immutable;
    var result;
    var type;

    if (key in this.cache) {
        if (id !== undefined) {
            result = this.cache[key].get(id, isImmutable);
        }
        else {
            result = this.cache[key].cacheStore;
        }
    }
    else {
        result = this.store[key];
    }

    if (isImmutable) {
        return result;
    }

    type = typeof result;

    if (baseTypes[type]) {
        return result;
    }

    return copy(result);
};

/**
 * Delete data from store.
 * @param {String} object key
 * @param {String} Cache id
 * @return {String} object key
 */
Store.prototype.delete = function (key, id) {
    var cacheOptions = this.options.cache;

    if (id && key in this.cache) {
        this.cache[key].delete(id, !!this.Immutable);
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
};

module.exports = Store;
