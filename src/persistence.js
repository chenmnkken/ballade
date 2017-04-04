'use strict';

// persistence for localStorage / sessionStorage
var PREFIX = 'Ballade.';

var baseTypes = {
    'string': true,
    'number': true,
    'null': true,
    'undefind': true,
    'boolean': true
};

var persistence = {
    set: function (key, value, type, isImmutable) {
        if (type !== 'localStorage' && type !== 'sessionStorage') {
            throw new Error('persistence params must be set localStorage or sessionStorage');
        }

        key = PREFIX + key;
        var valueType = typeof value;

        if (baseTypes[valueType]) {
            value += '';
        }
        else {
            if (isImmutable) {
                value = value.toJS();
            }

            value = JSON.stringify(value);
        }

        value = valueType + '@' + value;
        window[type].setItem(key, value);
    },

    get: function (key, type) {
        if (type !== 'localStorage' && type !== 'sessionStorage') {
            throw new Error('persistence type must be set localStorage or sessionStorage');
        }

        key = PREFIX + key;
        var value = window[type].getItem(key);

        if (!value) {
            return;
        }

        var index = value.indexOf('@');
        var valueType = value.slice(0, index);

        value = value.slice(index + 1);

        if (baseTypes[valueType]) {
            return value;
        }

        return JSON.parse(value);
    },

    'delete': function (key, type) {
        if (type !== 'localStorage' && type !== 'sessionStorage') {
            throw new Error('persistence type must be set localStorage or sessionStorage');
        }

        key = PREFIX + key;
        window[type].removeItem(key);
    }
};

module.exports = persistence;
