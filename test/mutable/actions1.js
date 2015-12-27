'use strict';

var dispatcher = require('./dispatcher');

var actions = dispatcher.createActions({
    updateTitle: function (title) {
        return {
            type: 'mutable-test1/update-title',
            title: title
        };
    },

    addMusic: function (music) {
        return {
            type: 'mutable-test1/add-music',
            music: music
        }
    },

    sayHello: function (greetings) {
        return {
            type: 'mutable-test/say-hello',
            greetings: greetings
        }
    }
});

module.exports = actions;
