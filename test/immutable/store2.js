'use strict';

var Immutable = require('immutable');
var dispatcher = require('./dispatcher');
var store1 = require('./store1');

var schema = {
    title: null,
    playlist: [],
    greetings: null
};

var store = dispatcher.createImmutableStore(schema, {
    'immutable-test2/update-title': function (store, action) {
        return store.immutable.set('title', action.title);
    },

    'immutable-test2/add-music': function (store, action) {
        return store.immutable.update('playlist', (playlist) => (
            playlist.push(Immutable.Map(action.music))
        ));
    },

    'immutable-test/say-hello': function (store, action) {
        var greetings = store1.immutable.get('greetings') + ' world';
        return store.immutable.set('greetings', greetings);
    }
});

module.exports = store;
