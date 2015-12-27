'use strict';

var Immutable = require('immutable');
var dispatcher = require('./dispatcher');

var schema = {
    title: null,
    playlist: [],
    greetings: null,
};

var store = dispatcher.createImmutableStore(schema, {
    'immutable-test1/update-title': function (store, action) {
        return store.immutable.set('title', action.title);
    },

    'immutable-test1/add-music': function (store, action) {
        return store.immutable.update('playlist', (playlist) => (
            playlist.push(Immutable.Map(action.music))
        ));
    },

    'immutable-test/say-hello': function (store, action) {
        return store.immutable.set('greetings', action.greetings);
    }
});

module.exports = store;
