'use strict';

var assert = require('assert');
var Schema = require('../src/schema');

describe('Schema validator test mutable data', function () {
    describe('schema validator & cast', function () {
        var schema1 = new Schema({
            str:  String,
            num: Number,
            bol: Boolean,
            date: Date,
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
                var dateStr = '2017-04-03T08:16:02.616Z';
                var objArrResult = schema1.validator('objArr', [{name: 'Ballade', title: 'Ballade test'}]);
                var anyArrResult = schema1.validator('anyArr', [1, '2', false, {name: 'Ballade', title: 'Ballade test'}]);
                var anyObjResult = schema1.validator('anyObj', {foo: 'bar', bar: 'biz', age: 23});
                var objResult = schema1.validator('obj', {votes: 2, favs: 100, foo: {bar: 'biz'}, redundant: 'Redundant'});

                assert.strictEqual(schema1.validator('str', '1').value, '1');
                assert.strictEqual(schema1.validator('num', 1).value, 1);
                assert.strictEqual(schema1.validator('bol', false).value, false);
                assert.strictEqual(schema1.validator('date', date).value, date);
                assert.strictEqual(schema1.validator('date', dateStr).value.getTime(), new Date(dateStr).getTime());

                assert.deepStrictEqual(schema1.validator('strArr', ['1', 'hello', 'world']).value, ['1', 'hello', 'world']);
                assert.deepStrictEqual(schema1.validator('numArr', [3, 5, 7]).value, [3, 5, 7]);
                assert.deepStrictEqual(schema1.validator('dateArr', [date, date]).value, [date, date]);
                assert.deepStrictEqual(objArrResult.value, [{name: 'Ballade', title: 'Ballade test'}]);
                assert.deepStrictEqual(anyArrResult.value, [1, '2', false, {name: 'Ballade', title: 'Ballade test'}]);
                assert.deepStrictEqual(anyObjResult.value, {foo: 'bar', bar: 'biz', age: 23});
                assert.deepStrictEqual(objResult.value, {votes: 2, favs: 100, foo: {bar: 'biz'}});

                done();
            });
        });

        describe('schema type cast validator', function () {
            it('data is valid, but will throw warning', function (done) {
                var strResult = schema1.validator('str', 1);
                var numResult = schema1.validator('num', '2')

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
                var strResult = schema1.validator('str', {foo: 'bar'});

                assert.strictEqual(numResult.messages[0].path, 'num');
                assert.strictEqual(numResult.messages[0].originalValue, 'hello');
                assert.strictEqual(numResult.messages[0].type, 'error');

                assert.strictEqual(strResult.messages[0].path, 'str');
                assert.deepStrictEqual(strResult.messages[0].originalValue, {foo: 'bar'});
                assert.strictEqual(strResult.messages[0].type, 'error');

                done();
            });
        });

        describe('schema is Mixed', function () {
            it('data type is Mixed, and default data is empty', function (done) {
                assert.strictEqual(schema1.dataTypes.anyArr.__schemaType__, 'Mixed');
                assert.strictEqual(schema1.dataTypes.anyObj.__schemaType__, 'Mixed');
                assert.strictEqual(Array.isArray(schema1.defaultData.anyArr), true);
                assert.strictEqual(Object.keys(schema1.defaultData.anyObj).length, 0);
                done();
            });
        });
    });

    describe('schema options', function () {
        var schema2 = new Schema({
            str1:  {
                $type: String,
                $lowercase: true
            },
            str2:  {
                $type: String,
                $uppercase: true,
                $trim: true
            },
            str3:  {
                $type: String,
                $match: /abcd\w+/
            },
            str4: {
                $type: String,
                $lowercase: true,
                $enum: ['js', 'javascript']
            },
            num1: {
                $type: Number,
                $min: 0
            },
            num2: {
                $type: Number,
                $max: 10
            },
            num3: {
                $type: Number,
                $min: 5,
                $max: 10
            },
            bol: {
                $type: Boolean
            },
            foo: {
                $type: String,
                $required: true
            },
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

        it('string type data is correct convert', function (done) {
            assert.strictEqual(schema2.validator('str1', 'Ballade').value, 'ballade');
            assert.strictEqual(schema2.validator('str2', 'ballade ').value, 'BALLADE');
            assert.strictEqual(schema2.validator('str3', 'abcdefg').value, 'abcdefg');
            assert.strictEqual(schema2.validator('str4', 'js').value, 'js');
            assert.strictEqual(schema2.validator('str4', 'java').value, undefined);
            assert.strictEqual(schema2.validator('str4', 'javascript').value, 'javascript');
            assert.strictEqual(schema2.validator('str4', 'JavaScript').value, 'javascript');

            done();
        });

        it('number type data is correct convert', function (done) {
            assert.strictEqual(schema2.validator('num1', 5).value, 5);
            assert.strictEqual(schema2.validator('num2', '5').value, 5);
            assert.strictEqual(schema2.validator('num3', 8).value, 8);
            assert.strictEqual(schema2.validator('num3', 4).value, undefined);
            done();
        });

        it('boolean type data valid', function (done) {
            assert.strictEqual(schema2.validator('bol', false).value, false);
            done();
        });

        it('required option is work', function (done) {
            var result1 = schema2.validator('bar', {
                count: 100
            });

            var result2 = schema2.validator('bar', {
                count: 100,
                biz: 'biz'
            });

            assert.strictEqual(schema2.validator('foo', 'bar').value, 'bar');
            assert.strictEqual(result1.value.count, 100);
            assert.strictEqual(result1.messages[0].path, 'bar.biz');
            assert.strictEqual(result1.messages[0].originalValue, undefined);
            assert.strictEqual(result1.messages[0].type, 'error');
            assert.strictEqual(result2.value.biz, 'biz');

            done();
        });

        it('default option is work', function (done) {
            var result1 = schema2.validator('obj', {
                favs: 1
            });

            var result2 = schema2.validator('obj', {
                votes: 2,
                favs: 2
            });

            assert.strictEqual(result1.value.favs, 1);
            assert.strictEqual(result1.value.votes, 1);
            assert.strictEqual(result2.value.favs, 2);
            assert.strictEqual(result2.value.votes, 2);

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
            var result = schema4.validator('arr', [{
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

            assert.strictEqual(result.value[0].foo.bar, 'bar');
            assert.strictEqual(result.value[0].foo.biz, 'biz');
            assert.strictEqual(result.value[0].count, 100);

            assert.strictEqual(result.value[1].foo.bar, 'hello');
            assert.strictEqual(result.value[1].foo.biz, '1');
            assert.strictEqual(result.value[1].count, 122);

            assert.strictEqual(result.messages[0].path, 'arr[1].foo.biz');
            assert.strictEqual(result.messages[0].originalValue, 1);
            assert.strictEqual(result.messages[0].type, 'warning');

            assert.strictEqual(result.messages[1].path, 'arr[1].count');
            assert.strictEqual(result.messages[1].originalValue, '122');
            assert.strictEqual(result.messages[1].type, 'warning');

            var result2 = schema6.validator('meta', {
                str: 'hello',
                num: 100
            });

            assert.strictEqual(result2.value.str, 'HELLO');
            assert.strictEqual(result2.value.num, 100);
            assert.strictEqual(result2.messages, undefined);

            done();
        });
    });

    describe('schema default data', function () {
        it('schema has default data', function (done) {
            var todoSchema = new Schema({
                id: {
                    $type: String,
                    $default: (+new Date() + Math.floor(Math.random() * 999999)).toString(36)
                },
                complete: {
                    $type: Boolean,
                    $default: false
                },
                text: {
                    $type: String,
                    $default: "Ballade Getting Started"
                }
            });

            var todosSchema = new Schema({
                todos: [todoSchema]
            });

            var todoDefault = todosSchema.defaultData.todos[0];

            assert.strictEqual(typeof todoDefault.id, 'string');
            assert.strictEqual(todoDefault.complete, false);
            assert.strictEqual(todoDefault.text, "Ballade Getting Started");
            done();
        });
    });
});
