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
        store.mutable.set('title', action.title);
    },

    'mutable-test2/add-music': function (store, action) {
        var playlist = store.mutable.get('playlist');
        playlist.push(action.music);

        store.mutable.set('playlist', playlist);
    },

    'mutable-test/say-hello': function (store, action) {
        var greetings = store1.mutable.get('greetings') + ' world';
        store.mutable.set('greetings', greetings);
    }
});

module.exports = store;
