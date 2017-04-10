'use strict';

var dispatcher = require('./dispatcher');
var Schema = require('../../src/ballade').Schema;
var store1 = require('./store1');

var playitem = new Schema({
    name: String,
    musician: String
});

var schema = new Schema({
    title: String,
    playlist: [playitem],
    greetings: String
});

var store = dispatcher.createMutableStore(schema, {
    'mutable-test2/update-title': function (store, action) {
        store.set('title', action.title);
    },

    'mutable-test2/add-music': function (store, action) {
        var playlist = store.get('playlist');
        playlist.push(action.music);

        store.set('playlist', playlist);
    },

    'mutable-test/say-hello': function (store, action) {
        var greetings = store1.get('greetings') + ' world';
        store.set('greetings', greetings);
    }
});

module.exports = store;
