(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Ballade = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * Ballade 0.2.1
 * author: chenmnkken@gmail.com
 * date: 2016-01-30
 * url: https://github.com/chenmnkken/ballade
 */

'use strict';

var Queue = require('./queue');
var MutableStore = require('./mutable-store');

var Ballade = {
    version: '0.2.1'
};

/**
 * Dispatcher Class
 */
var Dispatcher = function () {
    this.actionTypes = {};
    this.storeQueue = [];
    this.id = Date.now() + Math.round(Math.random() * 1000);

    this.middlewareQueue = new Queue(function (payload) {
        this.__invokeCallback__(payload);
    }.bind(this), true);
};

Dispatcher.prototype = {
    /**
     * When middleware queue is done, then invoke Store callbacks
     * @param {Object} Action payload
     */
    __invokeCallback__: function (payload) {
        this.storeQueue.forEach(function (item) {
            var callback = item.callbacks[payload.type];
            var result;
            var changeKey;

            if (typeof callback === 'function') {
                result = callback(item.store, payload);

                // Invoke mutable store callback
                if (result !== undefined) {
                    item.store.event.publish(result);
                }
            }
        });
    },

    /**
     * Register action middleware
     * Middleware use to process action payload
     * @param {Function} middleware function
     */
    use: function (middleware) {
        if (typeof middleware === 'function') {
            this.middlewareQueue.enter(middleware);
        }
    },

    /**
     * Dispatch Action
     * Dispatch Action to Store callback
     * @param {String} actionsId is make sure every action type do not duplicate
     * @param {Object} action
     */
    __dispatch__: function (actionsId, action) {
        var self = this;
        var payload = action();
        var actionTypes = this.actionTypes;
        var actionType = payload.type;
        var lastActionsId;

        if (!actionType) {
            throw new Error('action type does not exist in \n' + JSON.stringify(payload, null, 2));
        }

        lastActionsId = actionTypes[actionType];

        if (!lastActionsId) {
            actionTypes[actionType] = actionsId;
        }
        else if (lastActionsId !== actionsId) {
            throw new Error('action type "' + actionType + '" is duplicate');
        }

        this.middlewareQueue.execute(payload);
    },

    /**
     * Create Actions
     * @param {String} action creators
     * @return {Object} Actions
     */
    createActions: function (actionCreators) {
        // actionsId is make sure every action type do not duplicate
        var actionsId = (this.id++).toString(32);
        var self = this;
        var name;
        var creator;
        var actions = {};

        for (name in actionCreators) {
            creator = actionCreators[name];

            actions[name] = (function(creator, actionsId) {
                return function () {
                    var args = arguments;

                    self.__dispatch__(actionsId, function (){
                        return creator.apply(null, Array.prototype.slice.call(args));
                    });
                };
            })(creator, actionsId);
        }

        return actions;
    },

    /**
     * Create mutable store
     * @param {Object} store schema
     * @param {Object} store callbacks
     * @return {Object} proxy store instance, it can not set data, only get data
     */
    createMutableStore: function (schema, callbacks) {
        if (!callbacks) {
            throw new Error('schema must in createMutableStore arguments');
        }

        var store = new MutableStore(schema);

        var proxyStore = {
            mutable: {},
            event: {}
        };

        proxyStore.mutable.get = store.mutable.get.bind(store.mutable);
        proxyStore.event.subscribe = store.event.subscribe.bind(store.event);
        proxyStore.event.unsubscribe = store.event.unsubscribe.bind(store.event);

        this.storeQueue.push({
            store: store,
            callbacks: callbacks
        });

        return proxyStore;
    }
};

Ballade.Dispatcher = Dispatcher;

module.exports = Ballade;

},{"./mutable-store":4,"./queue":5}],2:[function(require,module,exports){
/*
 * Performs a deep clone of `subject`, returning a duplicate which can be
 * modified freely without affecting `subject`.
 *
 * The `originals` and `duplicates` variables allow us to copy references as
 * well, and also means we don't have to serialise any object more than once.
 * https://github.com/evlun/copy
 */
function copy (subject, originals, duplicates) {
    if (!(subject instanceof Object))
        return subject

    var type = Object.prototype.toString.call(subject).slice(8, -1),
        duplicate

    // create the base for our duplicate
    switch (type) {
        case 'Array':
            duplicate = []
            break

        case 'Date':
            duplicate = new Date(subject.getTime())
            break

        case 'RegExp':
            duplicate = new RegExp(subject)
            break

        case 'Function':
            break

        case 'Uint8Array':
        case 'Uint8ClampedArray':
        case 'Uint16Array':
        case 'Uint32Array':
        case 'Int8Array':
        case 'Int16Array':
        case 'Int32Array':
        case 'Float32Array':
        case 'Float64Array':
            duplicate = subject.subarray()
            break

        default:
            duplicate = {}
    }

    originals.push(subject)
    duplicates.push(duplicate)

    // special case for arrays
    if (subject instanceof Array) {
        for (var i = 0; i < subject.length; i++) {
            duplicate[i] = copy(subject[i], originals, duplicates)
        }
    }

    var keys = Object.keys(subject).sort(),
        skip = Object.keys(duplicate).sort()

    for (var j = 0; j < keys.length; j++) {
        var key = keys[j]

        // ignore keys in `skip`
        if (skip.length > 0 && key === skip[0]) {
            skip.shift()
            continue
        }

        if (Object.prototype.hasOwnProperty.call(subject, key)) {
            var value = subject[key],
                index = originals.indexOf(value)

            duplicate[key] = index !== -1 ? duplicates[index] : copy(subject[key], originals, duplicates)
        }
    }

    return duplicate
}

/*
 * Wrapper for `copy()`.
 */
module.exports = function(subject) {
    return copy(subject, [], [])
}

},{}],3:[function(require,module,exports){
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

},{}],4:[function(require,module,exports){
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

},{"./copy":2,"./event":3}],5:[function(require,module,exports){
'use strict';

/**
 * Mini Queue Class
 * @param {Function} complete callback,
 * when queue is done, then invoke complete callback
 * @param {Boolean} whether execute workflow of loop
 */
var Queue = function (completeCallback, loop) {
    this.workflows = [];
    this.completeCallback = completeCallback;

    if (loop) {
        this._workflows = [];
    }
};

Queue.prototype = {
    /**
     * Enter queue
     * @param {Function} workflow function
     */
    enter: function (workflow) {
        this.workflows.push(workflow);

        // Backup workflow
        if (this._workflows) {
            this._workflows.push(workflow);
        }
    },

    /**
     * Execute workflow
     * @param {Object} workflow function data required
     */
     execute: function (data, workflows) {
         workflows = workflows || this.workflows.concat();
         var workflow;

         if (workflows.length) {
             workflow = workflows.shift();
             workflow(data, this.execute.bind(this, data, workflows));
         }
         else {
             // Get backup, begin loop
             if (this._workflows) {
                 this.workflows = this._workflows.concat();
             }

             workflows = null;
             this.completeCallback(data);
         }
     }
};

module.exports = Queue;

},{}]},{},[1])(1)
});