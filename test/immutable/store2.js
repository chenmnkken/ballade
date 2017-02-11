'use strict';

var Immutable = require('immutable');
var dispatcher = require('./dispatcher');
var store1 = require('./store1');
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
    'immutable-test2/update-title': function (store, action) {
        return store.immutable.set('title', action.title);
    },

    'immutable-test2/add-music': function (store, action) {
        var playlist = store.immutable.get('playlist');
        playlist = playlist.push(Immutable.Map(action.music));
        return store.immutable.set('playlist', playlist);
    },

    'immutable-test/say-hello': function (store, action) {
        var greetings = store1.immutable.get('greetings') + ' world';
        return store.immutable.set('greetings', greetings);
    }
});

module.exports = store;
