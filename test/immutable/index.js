'use strict';

var Immutable = require('immutable');
var assert = require('assert');
var actions1 = require('./actions1');
var actions2 = require('./actions2');
var store1 = require('./store1');
var store2 = require('./store2');

describe('Ballade immutable test', function () {
    describe('actions 1', function () {
        describe('updateTitle action 1', function () {
            it('should return: [foo is done]', function (done) {
                var firstUpdate = function (key) {
                    var title = store1.get('title');

                    assert.strictEqual(title, 'foo is done');
                    store1.unsubscribe('title', firstUpdate);
                    done();
                };

                store1.subscribe('title', firstUpdate);
                actions1.updateTitle('foo');
            });
        });

        describe('updateTitle action 2', function () {
            it('should return: [bar is done]', function (done) {
                var secondUpdate = function (key) {
                    var title = store1.get('title');

                    assert.strictEqual(title, 'bar is done');
                    store1.unsubscribe(secondUpdate);
                    done();
                };

                setTimeout(function () {
                    store1.subscribe('title', secondUpdate);
                    actions1.updateTitle('bar');
                }, 1000);
            });
        });

        describe('addMusic action', function () {
            it('should add music to playlist', function (done) {
                var handlePlaylist = function (key) {
                    var playlist = store1.get('playlist');
                    var newPlaylist;

                    assert.strictEqual(playlist.getIn([0, 'name']), 'Ballade No.1');
                    assert.strictEqual(playlist.getIn([0, 'musician']), 'Chopin');

                    // test unwriteable
                    playlist.push(Immutable.Map({
                        name: 'Suite No.3 in D',
                        musician: 'Bach'
                    }));

                    newPlaylist = store1.get('playlist');

                    assert.strictEqual(newPlaylist.size, 1);
                    assert.strictEqual(newPlaylist.getIn([0, 'name']), 'Ballade No.1');
                    assert.strictEqual(newPlaylist.getIn([0, 'musician']), 'Chopin');

                    store1.unsubscribe('playlist');
                    done();
                };

                store1.subscribe('playlist', handlePlaylist);

                actions1.addMusic({
                    name: 'Ballade No.1',
                    musician: 'Chopin'
                });
            });
        });
    });

    describe('actions 2', function () {
        describe('updateTitle action', function () {
            it('should return: [baz is done]', function (done) {
                var firstUpdate = function (key) {
                    var title = store2.get('title');

                    assert.strictEqual(title, 'baz is done');
                    store2.unsubscribe('title');
                    done();
                };

                store2.subscribe('title', firstUpdate);
                actions2.updateTitle('baz');
            });
        });

        describe('addMusic action', function () {
            it('should add music to playlist', function (done) {
                var handlePlaylist = function (key) {
                    var playlist = store2.get('playlist');
                    var newPlaylist;

                    assert.strictEqual(playlist.getIn([0, 'name']), 'Suite No.3 in D');
                    assert.strictEqual(playlist.getIn([0, 'musician']), 'Bach');

                    playlist.push(Immutable.Map({
                        name: 'Ballade No.1',
                        musician: 'Chopin'
                    }));

                    newPlaylist = store2.get('playlist');

                    assert.strictEqual(newPlaylist.size, 1);
                    assert.strictEqual(newPlaylist.getIn([0, 'name']), 'Suite No.3 in D');
                    assert.strictEqual(newPlaylist.getIn([0, 'musician']), 'Bach');

                    store2.unsubscribe('playlist');
                    done();
                };

                store2.subscribe('playlist', handlePlaylist);

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
                    var greetings = store2.get('greetings');

                    assert.strictEqual(greetings, 'Hello world');
                    store2.unsubscribe('greetings');
                    done();
                };

                store2.subscribe('greetings', sayHello);
                actions1.sayHello('Hello');
            });
        });
    });

    describe('$default for store', function () {
        it('should return $default value number 0', function (done) {
            var count = store1.get('count');
            assert.strictEqual(count, 0);
            done();
        });

        it('should return $default value boolean false', function (done) {
            var extended = store1.get('extended');
            assert.strictEqual(extended, false);
            done();
        });
    });

    describe('cache for store', function () {
        it('should cache users in store', function (done) {
            var i = 0;

            for (; i < 12; i++) {
                actions1.addUser({
                    id: i,
                    name: 'Xiaoming Li0' + (i + 1)
                });
            }

            actions1.addUser({
                id: 11,
                name: 'Xiaoming Li01'
            });

            var users = store1.get('users');
            var user5 = store1.get('users', 5);

            assert.strictEqual(users.length, 10);
            assert.strictEqual(user5.get('id'), 5);
            assert.strictEqual(user5.get('name'), 'Xiaoming Li06');
            assert.strictEqual(store1.get('users', 11).get('name'), 'Xiaoming Li01');
            actions1.delUser(11);
            assert.strictEqual(store1.get('users', 11), undefined);
            done();
        });
    });
});
