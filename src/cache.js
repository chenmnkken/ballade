'use strict';

// simple cache module
// @TODO add expires options

var accessor = require('./accessor');
var proxyGet = accessor.get;

var MAX_LENGTH = 20;

var Cache = function (options) {
    if (!options.id) {
        throw new Error('Cache must set a ' + options.id);
    }

    this.id = options.id;
    this.maxLength = options.maxLength || MAX_LENGTH;
    this.cacheStore = [];
    this.idKeys = {};
};

Cache.prototype = {
    set: function (value, isImmutable) {
        var idKey = this.id;
        var cacheStore = this.cacheStore;
        var length = cacheStore.length;
        var idValue = proxyGet(value, idKey, isImmutable);

        if (idValue === undefined) {
            return;
        }

        // update cache
        if (this.idKeys[idValue]) {
            cacheStore.some(function (item, i) {
                if (proxyGet(item, idKey, isImmutable) === idValue) {
                    cacheStore[i] = value;
                    return true;
                }
            });
        }
        // push cache
        else {
            this.idKeys[idValue] = true;

            // limit length
            if (length === this.maxLength) {
                idValue = proxyGet(cacheStore[0], idKey, isImmutable);
                delete this.idKeys[idValue];
                cacheStore.shift();
            }

            cacheStore.push(value);
        }
    },

    get: function (id, isImmutable) {
        var cacheStore = this.cacheStore;
        var i = cacheStore.length - 1;
        var idKey = this.id;
        var idValue = id;
        var item;

        if (this.idKeys[idValue]) {
            for (; i > -1; i--) {
                item = cacheStore[i];
                if (proxyGet(item, idKey, isImmutable) === idValue) {
                    return item;
                }
            }
        }
    },

    'delete': function (id, isImmutable) {
        var cacheStore = this.cacheStore;
        var i = cacheStore.length - 1;
        var idKey = this.id;
        var idValue = id;
        var item;

        if (this.idKeys[idValue]) {
            for (; i > -1; i--) {
                item = cacheStore[i];
                if (proxyGet(item, idKey, isImmutable) === idValue) {
                    cacheStore.splice(i, 1);
                    delete this.idKeys[idValue];
                    break;
                }
            }
        }
    }
};

module.exports = Cache;
