'use strict';

var Dispatcher = require('../../src/ballade.immutable').Dispatcher;
var dispatcher = new Dispatcher();

dispatcher.use(function (payload, next) {
    if (payload.title) {
        setTimeout(function () {
            payload.title += ' is';
            next();
        }, 500);
    }
    else {
        next();
    }
});

dispatcher.use(function (payload, next) {
    if (payload.title) {
        payload.title += ' done';
    }

    next();
});

module.exports = dispatcher;
