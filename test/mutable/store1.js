'use strict';

var dispatcher = require('./dispatcher');

var schema = {
    title: null,
    playlist: [],
    greetings: null,
};

var store = dispatcher.createMutableStore(schema, {
    'mutable-test1/update-title': function (store, action) {
        return store.mutable.set('title', action.title);
    },

    'mutable-test1/add-music': function (store, action) {
        var playlist = store.mutable.get('playlist');
        playlist.push(action.music);

        return store.mutable.set('playlist', playlist);
    },

    'mutable-test/say-hello': function (store, action) {
        return store.mutable.set('greetings', action.greetings);
    }
});

module.exports = store;
