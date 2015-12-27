'use strict';

var Dispatcher = require('../../src/ballade').Dispatcher;
var dispatcher = new Dispatcher();

dispatcher.use(function (payload, next) {
    if (payload.title) {
        setTimeout(function () {
            payload.title += ' is';
            next(payload);
        }, 500);
    }
    else {
        next(payload);
    }
});

dispatcher.use(function (payload, next) {
    if (payload.title) {
        payload.title += ' done';
    }

    next(payload);
});

module.exports = dispatcher;
