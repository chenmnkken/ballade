'use strict';

var Immutable = require('immutable');
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

var store = dispatcher.createImmutableStore(schema, options, {
    'immutable-test1/update-title': function (store, action) {
        store.immutable.set('title', action.title);
    },

    'immutable-test1/add-music': function (store, action) {
        var playlist = store.immutable.get('playlist');
        playlist = playlist.push(Immutable.Map(action.music));
        store.immutable.set('playlist', playlist);
    },

    'immutable-test/say-hello': function (store, action) {
        store.immutable.set('greetings', action.greetings);
    },

    'immutable-test/add-user': function (store, action) {
        store.immutable.set('users', action.user);
    }
});

module.exports = store;
