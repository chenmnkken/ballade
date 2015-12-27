'use strict';

/**
 * Mini Event Class
 */
var Event = function () {
    this.handlers = [];
};

Event.prototype = {
    /**
     * Publish event
     * @param {String} event type
     */
    publish: function (type) {
        this.handlers.forEach(function (item) {
            if (!item.type) {
                item.handler(type);
            }
            else if (item.type === type) {
                item.handler(type);
            }
        });
    },

    /**
     * Subscribe event
     * @param {String} event type, it can be ignored
     * @param {Function} event handler
     */
    subscribe: function (type, handler) {
        var result = {};

        if (typeof type === 'function') {
            result.handler = type;
        }
        else {
            result.handler = handler;
            result.type = type;
        }

        this.handlers.push(result);
    },

    /**
     * Cancel subscribe event
     * @param {String} event type, it optional
     * @param {Function} event handler
     */
    unsubscribe: function (type, handler) {
        if (typeof type === 'function') {
            handler = type;
            type = null;
        }

        var i = 0;
        var item;

        for (; i < this.handlers.length; i++) {
            item = this.handlers[i];

            if (
                (!item.type && item.handeler === handler) ||
                (type && handler && item.type === type && item.handler === handler) ||
                (type && item.type === type) ||
                (handler && item.handler === handler)
                ) {
                this.handlers.splice(i--, 1);
            }
        }
    }
};

module.exports = Event;
