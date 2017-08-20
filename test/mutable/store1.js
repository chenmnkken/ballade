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
    },
    count: {
        $type: Number,
        $default: 0
    },
    extended: {
        $type: Boolean,
        $default: false
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
        store.set('title', action.title);
    },

    'mutable-test1/add-music': function (store, action) {
        var playlist = store.get('playlist');
        playlist.push(action.music);

        store.set('playlist', playlist);
    },

    'mutable-test/say-hello': function (store, action) {
        store.set('greetings', action.greetings);
    },

    'mutable-test/add-user': function (store, action) {
        store.set('users', action.user);
    },

    'immutable-test/del-user': function (store, action) {
        store.delete('users', action.userId);
    }
});

module.exports = store;
