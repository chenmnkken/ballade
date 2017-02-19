'use strict';

// simple cache module

var accessor = require('./accessor');
var proxySet = accessor.set;

var MAX_LENGTH = 20;

var Cache = function (options) {
    if (!options.id) {
        throw new Error('Cache must set a ' + idKey);
    }

    this.id = options.id;
    this.maxLength = options.maxLength || MAX_LENGTH;
    this.cacheStore = [];
};

Cache.prototype = {
    set: function (value, fresh, isImmutable) {
        var idKey = this.id;
        var cacheStore = this.cacheStore;
        var length = cacheStore.length;

        // update cache
        if (fresh) {
            cacheStore.some(function (item, i) {
                if (proxyGet(item, idKey, isImmutable) === proxyGet(value, idKey, isImmutable)) {
                    cacheStore[i] = value;
                    return true;
                }
            });
        }
        // push cache
        else {
            // limit length
            if (length === this.maxLength) {
                cacheStore.shift();
            }

            cacheStore.push(value);
        }
    },

    get: function (id, isImmutable) {
        var cacheStore = this.cacheStore;
        var i = cacheStore.length - 1;
        var idKey = this.id;
        var idValue = id + '';
        var item;

        for (; i > -1; i--) {
            item = cacheStore[i];
            if (proxyGet(item, idKey, isImmutable) === idValue) {
                return item;
            }
        }
    },

    'delete': function (id, isImmutable) {
        var cacheStore = this.cacheStore;
        var i = cacheStore.length - 1;
        var idKey = this.id;
        var idValue = id + '';
        var item;

        for (; i > -1; i--) {
            item = cacheStore[i];
            if (proxyGet(item, idKey, isImmutable) === idValue) {
                cacheStore.splice(i, 1);
                break;
            }
        }
    }
};

module.exports = Cache;
