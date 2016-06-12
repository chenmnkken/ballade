/**
 * Ballade 0.2.2
 * author: chenmnkken@gmail.com
 * date: 2016-06-12
 * url: https://github.com/chenmnkken/ballade
 */

'use strict';

var Queue = require('./queue');
var MutableStore = require('./mutable-store');

var Ballade = {
    version: '0.2.2'
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
