'use strict';

// accessor for mutable/immutable data

var accessor = {
    set: function (obj, key, value, isImmutable) {
        if (value !== undefined && value !== null) {
            if (isImmutable) {
                obj = obj.set(key, value);
            }
            else {
                obj[key] = value;
            }
        }

        return obj;
    },

    get: function (obj, key, isImmutable) {
        if (isImmutable) {
            return obj.get(key);
        }

        return obj[key];
    },

    'delete': function (obj, key, isImmutable) {
        if (isImmutable) {
            obj.delete(key);
        }
        else if (Array.isArray(obj)) {
            obj.splice(key, 1);
        }
        else {
            delete obj[key];
        }
    }
};

module.exports = accessor;
