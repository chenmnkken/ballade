'use strict';

var bindStore = function (Component, store, callbacks) {
    var storeEvent = store.event;
    var originComponentDidMount = Component.prototype.componentDidMount;
    var originComponentWillUnmount = Component.prototype.componentWillUnmount;
    var newCallbacks = {};
    var callbacksArr = Object.keys(callbacks);

    Component.prototype.componentDidMount = function (args) {
        var self = this;

        callbacksArr.forEach(function (item) {
            newCallbacks[item] = callbacks[item].bind(self);
            storeEvent.subscribe(item, newCallbacks[item]);
        });

        if (typeof originComponentDidMount === 'function') {
            originComponentDidMount.apply(self, args);
        }
    };

    Component.prototype.componentWillUnmount = function (args) {
        var self = this;

        callbacksArr.forEach(function (item) {
            storeEvent.unsubscribe(item, newCallbacks[item]);
        });

        if (typeof originComponentWillUnmount === 'function') {
            originComponentWillUnmount.apply(self, args);
        }
    };

    return Component;
};

module.exports = bindStore;
