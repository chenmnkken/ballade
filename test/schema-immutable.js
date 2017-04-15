'use strict';

var assert = require('assert');
var Immutable = require('immutable');
var Schema = require('../src/schema');
var fromJS = Immutable.fromJS;
var Map = Immutable.Map;
var List = Immutable.List;

describe('Schema validator test immutable data', function () {
    describe('schema validator & cast', function () {
        var schema1 = new Schema({
            str:  String,
            num: Number,
            strArr: [String],
            numArr: [Number],
            dateArr: [Date],
            objArr: [{
                name: String,
                title: String
            }],
            anyArr: [],
            anyObj: {},
            obj: {
                votes: Number,
                favs:  Number,
                foo: {
                    bar: String
                }
            }
        });

        describe('schema type common validator', function () {
            it('all of data should vaild', function (done) {
                var date = new Date();

                var objArr = fromJS([{name: 'Ballade', title: 'Ballade test'}]);
                var objArrResult = schema1.validator('objArr', objArr, true);

                var anyArr = fromJS([1, '2', false, {name: 'Ballade', title: 'Ballade test'}]);
                var anyArrResult = schema1.validator('anyArr', anyArr, true);

                var anyObj = Map({foo: 'bar', bar: 'biz', age: 23});
                var anyObjResult = schema1.validator('anyObj', anyObj, true);

                var obj = fromJS({votes: 2, favs: 100, foo: {bar: 'biz'}, redundant: 'Redundant'});
                var objResult = schema1.validator('obj', obj, true);

                var strArr = List(['1', 'hello', 'world']);
                var numArr = List([3, 5, 7]);
                var dateArr = List([date, date]);

                assert.strictEqual(schema1.validator('strArr', strArr, true).value, strArr);
                assert.strictEqual(schema1.validator('numArr', numArr, true).value, numArr);
                assert.strictEqual(schema1.validator('dateArr', dateArr, true).value, dateArr);
                assert.strictEqual(objArrResult.value, objArr);
                assert.strictEqual(anyArrResult.value, anyArr);
                assert.strictEqual(anyObjResult.value, anyObj);
                assert(Immutable.is(objResult.value, obj.delete('redundant')));

                done();
            });
        });

        describe('schema type cast validator', function () {
            it('data is valid, but will throw warning', function (done) {
                var strResult = schema1.validator('str', 1, true);
                var numResult = schema1.validator('num', '2', true);

                assert.strictEqual(strResult.value, '1');
                assert.strictEqual(strResult.messages[0].path, 'str');
                assert.strictEqual(strResult.messages[0].originalValue, 1);
                assert.strictEqual(strResult.messages[0].type, 'warning');

                assert.strictEqual(numResult.value, 2);
                assert.strictEqual(numResult.messages[0].path, 'num');
                assert.strictEqual(numResult.messages[0].originalValue, '2');
                assert.strictEqual(numResult.messages[0].type, 'warning');

                done();
            });

            it('data is invalid, will throw error', function (done) {
                var numResult = schema1.validator('num', 'hello');
                var obj = Map({foo: 'bar'});
                var strResult = schema1.validator('str', obj, true);

                assert.strictEqual(numResult.messages[0].path, 'num');
                assert.strictEqual(numResult.messages[0].originalValue, 'hello');
                assert.strictEqual(numResult.messages[0].type, 'error');

                assert.strictEqual(strResult.messages[0].path, 'str');
                assert.strictEqual(strResult.messages[0].originalValue, obj);
                assert.strictEqual(strResult.messages[0].type, 'error');

                done();
            });
        });
    });

    describe('schema options', function () {
        var schema2 = new Schema({
            bar: {
                biz: {
                    $type: String,
                    $required: true
                },
                count: Number
            },
            obj: {
                votes: {
                    $type: Number,
                    $default: 1
                },
                favs:  Number
            }
        });

        it('required option is work', function (done) {
            var obj = Map({
                count: 100
            });

            var result1 = schema2.validator('bar', obj, true);
            obj = obj.set('biz', 'biz');
            var result2 = schema2.validator('bar', obj, true);

            assert.strictEqual(result1.value.get('count'), 100);
            assert.strictEqual(result1.messages[0].path, 'bar.biz');
            assert.strictEqual(result1.messages[0].originalValue, undefined);
            assert.strictEqual(result1.messages[0].type, 'error');
            assert.strictEqual(result2.value.get('biz'), 'biz');

            done();
        });

        it('default option is work', function (done) {
            var obj = Map({
                favs: 1
            });

            var result1 = schema2.validator('obj', obj, true);

            obj = obj.set('favs', 2);
            obj = obj.set('votes', 2);

            var result2 = schema2.validator('obj', obj, true);

            assert.strictEqual(result1.value.get('favs'), 1);
            assert.strictEqual(result1.value.get('votes'), 1);
            assert.strictEqual(result2.value.get('favs'), 2);
            assert.strictEqual(result2.value.get('votes'), 2);

            done();
        });
    });

    describe('schema nested', function () {
        var schema3 = new Schema({
            foo: {
                bar: {
                    $type: String,
                    $default: 'bar'
                },
                biz: String
            },
            count: Number
        });

        var schema4 = new Schema({
            arr: [schema3]
        });

        var schema5 = new Schema({
            str: {
                $type: String,
                $uppercase: true
            },
            num: Number
        });

        var schema6 = new Schema({
            meta: schema5
        });

        it('child schema is work', function (done) {
            var arr = fromJS([{
                foo: {
                    biz: 'biz'
                },
                count: 100
            }, {
                foo: {
                    bar: 'hello',
                    biz: 1
                },
                count: '122'
            }]);

            var result = schema4.validator('arr', arr, true);

            assert.strictEqual(result.value.getIn([0, 'foo', 'bar']), 'bar');
            assert.strictEqual(result.value.getIn([0, 'foo', 'biz']), 'biz');
            assert.strictEqual(result.value.getIn([0, 'count']), 100);

            assert.strictEqual(result.value.getIn([1, 'foo', 'bar']), 'hello');
            assert.strictEqual(result.value.getIn([1, 'foo', 'biz']), '1');
            assert.strictEqual(result.value.getIn([1, 'count']), 122);

            assert.strictEqual(result.messages[0].path, 'arr[1].foo.biz');
            assert.strictEqual(result.messages[0].originalValue, 1);
            assert.strictEqual(result.messages[0].type, 'warning');

            assert.strictEqual(result.messages[1].path, 'arr[1].count');
            assert.strictEqual(result.messages[1].originalValue, '122');
            assert.strictEqual(result.messages[1].type, 'warning');

            var result2 = schema6.validator('meta', Map({
                str: 'hello',
                num: 100
            }), true);

            assert.strictEqual(result2.value.get('str'), 'HELLO');
            assert.strictEqual(result2.value.get('num'), 100);
            assert.strictEqual(result2.messages, undefined);

            done();
        });
    });
});
