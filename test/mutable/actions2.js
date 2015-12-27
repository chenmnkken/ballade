'use strict';

var dispatcher = require('./dispatcher');

var actions = dispatcher.createActions({
    updateTitle: function (title) {
        return {
            type: 'mutable-test2/update-title',
            title: title
        };
    },

    addMusic: function (music) {
        return {
            type: 'mutable-test2/add-music',
            music: music
        }
    }
});

module.exports = actions;
