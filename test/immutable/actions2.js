'use strict';

var dispatcher = require('./dispatcher');

var actions = dispatcher.createActions({
    updateTitle: function (title) {
        return {
            type: 'immutable-test2/update-title',
            title: title
        };
    },

    addMusic: function (music) {
        return {
            type: 'immutable-test2/add-music',
            music: music
        }
    }
});

module.exports = actions;
