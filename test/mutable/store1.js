'use strict';

var dispatcher = require('./dispatcher');
var Schema = require('../../src/ballade').Schema;

var musicSchema = new Schema({
    name: String,
    musician: String
});

var schema = new Schema({
    title: String,
    playlist: [musicSchema],
    greetings: String,
    users: {
        id: Number,
        name: String
    }
});

var options = {
    cache: {
        users: {
            id: 'id',
            maxLength: 10
        }
    }
};

var store = dispatcher.createMutableStore(schema, options, {
    'mutable-test1/update-title': function (store, action) {
        store.mutable.set('title', action.title);
    },

    'mutable-test1/add-music': function (store, action) {
        var playlist = store.mutable.get('playlist');
        playlist.push(action.music);

        store.mutable.set('playlist', playlist);
    },

    'mutable-test/say-hello': function (store, action) {
        store.mutable.set('greetings', action.greetings);
    },

    'mutable-test/add-user': function (store, action) {
        store.mutable.set('users', action.user);
    }
});

module.exports = store;
