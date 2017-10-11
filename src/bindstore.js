'use strict';

var bindStore = function (Component, store, callbacks) {
    var originComponentDidMount = Component.prototype.componentDidMount;
    var originComponentWillUnmount = Component.prototype.componentWillUnmount;
    var callbacksArr = Object.keys(callbacks);

    if (callbacksArr.length) {
        Component.prototype.componentDidMount = function (args) {
            var self = this;
            var newCallbacks = {};

            if (!self.__storeCallback__) {
                self.__storeCallback__ = {};
            }

            callbacksArr.forEach(function (item) {
                newCallbacks[item] = callbacks[item].bind(self);
                store.subscribe(item, newCallbacks[item]);
            });

            self.__storeCallback__[store.id] = newCallbacks;

            if (typeof originComponentDidMount === 'function') {
                originComponentDidMount.apply(self, args);
            }
        };

        Component.prototype.componentWillUnmount = function (args) {
            var self = this;

            callbacksArr.forEach(function (item) {
                store.unsubscribe(item, self.__storeCallback__[store.id][item]);
            });

            delete self.__storeCallback__;

            if (typeof originComponentWillUnmount === 'function') {
                originComponentWillUnmount.apply(self, args);
            }
        };
    }

    return Component;
};

module.exports = bindStore;
