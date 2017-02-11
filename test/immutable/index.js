'use strict';

var Immutable = require('immutable');
var assert = require('assert');
var actions1 = require('./actions1');
var actions2 = require('./actions2');
var store1 = require('./store1');
var store2 = require('./store2');

describe('Ballade immutable test', function () {
    describe('actions 1', function () {
        describe('upTitle action 1', function () {
            it('should return: [foo is done]', function (done) {
                var firstUpdate = function (key) {
                    var title = store1.immutable.get('title');

                    assert.strictEqual(title, 'foo is done');
                    store1.event.unsubscribe('title');
                    done();
                };

                store1.event.subscribe('title', firstUpdate);
                actions1.updateTitle('foo');
            });
        });

        describe('upTitle action 2', function () {
            it('should return: [bar is done]', function (done) {
                var secondUpdate = function (key) {
                    if (key === 'title') {
                        var title = store1.immutable.get('title');

                        assert.strictEqual(title, 'bar is done');
                        store1.event.unsubscribe(secondUpdate);
                        done();
                    }
                };

                setTimeout(function () {
                    store1.event.subscribe(secondUpdate);
                    actions1.updateTitle('bar');
                }, 1000);
            });
        });

        describe('addMusic action', function () {
            it('should add music to playlist', function (done) {
                var handlePlaylist = function (key) {
                    var playlist = store1.immutable.get('playlist');
                    var newPlaylist;

                    assert.strictEqual(playlist.getIn([0, 'name']), 'Ballade No.1');
                    assert.strictEqual(playlist.getIn([0, 'musician']), 'Chopin');

                    // test unwriteable
                    playlist.push(Immutable.Map({
                        name: 'Suite No.3 in D',
                        musician: 'Bach'
                    }));

                    newPlaylist = store1.immutable.get('playlist');

                    assert.strictEqual(newPlaylist.size, 1);
                    assert.strictEqual(newPlaylist.getIn([0, 'name']), 'Ballade No.1');
                    assert.strictEqual(newPlaylist.getIn([0, 'musician']), 'Chopin');

                    store1.event.unsubscribe('playlist');
                    done();
                };

                store1.event.subscribe('playlist', handlePlaylist);

                actions1.addMusic({
                    name: 'Ballade No.1',
                    musician: 'Chopin'
                });
            });
        });
    });

    describe('actions 2', function () {
        describe('upTitle action', function () {
            it('should return: [baz is done]', function (done) {
                var firstUpdate = function (key) {
                    var title = store2.immutable.get('title');

                    assert.strictEqual(title, 'baz is done');
                    store2.event.unsubscribe('title');
                    done();
                };

                store2.event.subscribe('title', firstUpdate);
                actions2.updateTitle('baz');
            });
        });

        describe('addMusic action', function () {
            it('should add music to playlist', function (done) {
                var handlePlaylist = function (key) {
                    var playlist = store2.immutable.get('playlist');
                    var newPlaylist;

                    assert.strictEqual(playlist.getIn([0, 'name']), 'Suite No.3 in D');
                    assert.strictEqual(playlist.getIn([0, 'musician']), 'Bach');

                    playlist.push(Immutable.Map({
                        name: 'Ballade No.1',
                        musician: 'Chopin'
                    }));

                    newPlaylist = store2.immutable.get('playlist');

                    assert.strictEqual(newPlaylist.size, 1);
                    assert.strictEqual(newPlaylist.getIn([0, 'name']), 'Suite No.3 in D');
                    assert.strictEqual(newPlaylist.getIn([0, 'musician']), 'Bach');

                    store2.event.unsubscribe('playlist');
                    done();
                };

                store2.event.subscribe('playlist', handlePlaylist);

                actions2.addMusic({
                    name: 'Suite No.3 in D',
                    musician: 'Bach'
                });
            });
        });
    });

    describe('store2 dependence store1', function () {
        describe('say hello action', function () {
            it('should return: [Hello world]', function (done) {
                var sayHello = function (key) {
                    var greetings = store2.immutable.get('greetings');

                    assert.strictEqual(greetings, 'Hello world');
                    store2.event.unsubscribe('greetings');
                    done();
                };

                store2.event.subscribe('greetings', sayHello);
                actions1.sayHello('Hello');
            });
        });
    });
});
