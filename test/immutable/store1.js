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
    greetings: String
});

var store = dispatcher.createImmutableStore(schema, {
    'immutable-test1/update-title': function (store, action) {
        return store.immutable.set('title', action.title);
    },

    'immutable-test1/add-music': function (store, action) {
        var playlist = store.immutable.get('playlist');
        playlist = playlist.push(Immutable.Map(action.music));
        return store.immutable.set('playlist', playlist);
    },

    'immutable-test/say-hello': function (store, action) {
        return store.immutable.set('greetings', action.greetings);
    }
});

module.exports = store;
