'use strict';

var dispatcher = require('./dispatcher');

var actions = dispatcher.createActions({
    updateTitle: function (title) {
        return {
            type: 'immutable-test1/update-title',
            title: title
        };
    },

    addMusic: function (music) {
        return {
            type: 'immutable-test1/add-music',
            music: music
        }
    },

    sayHello: function (greetings) {
        return {
            type: 'immutable-test/say-hello',
            greetings: greetings
        }
    },

    addUser: function (user) {
        return {
            type: 'immutable-test/add-user',
            user: user
        }
    },

    delUser: function (userId) {
        return {
            type: 'immutable-test/del-user',
            userId: userId
        }
    }
});

module.exports = actions;
