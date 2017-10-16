# Schema

## Why Schama?

The concept of Schema originates from stored data to database, for reliable data when stored data to database, predefined the data structure and type, only validation data is stored.

When Ballade used for development App on Browser, we can seen as Store is simply  database, the all data from Store in UI Views, Schema make sure the stored operation is controllable, so get data is controllable too. If the App data is controllable, the UI Views is controllable too.

The design idea of Ballade Schema originates from [Mongoose Schema](http://mongoosejs.com/docs/schematypes.html).


## Usage Schema

### Basic Usage

The core feature of Schema is definition data structure and type.

```js
var Schema = require('ballade').Schema;

var schema1 = new Schema({
    str: String,
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
```

For above Schema instance, in actual storage, the data is should like the below.

```js
{
    str: 'hello',
    num: 2,
    bol: false,
    date: 'Sun Feb 12 2017 09:25:53 GMT+0800 (CST)',
    strArr: ['a', 'b'],
    numArr: [2, 4, 6],
    dateArr: ['Sun Feb 12 2017 09:25:53 GMT+0800 (CST)'],
    objArr: [{
        name: 'this is name',
        title: 'this is title'
    }],
    anyArr: [1, '2', false, { foo: 'bar' }],
    anyObj: {foo: 'bar', 'a': {b: 'c'}},
    obj: {
        votes: 200,
        favs:  100,
        foo: {
            bar: 'bar'
        }
    }
}
```

#### Schema types:

* String
* Number
* Boolean
* Date
* Array
* Object
* Mixed

Array and Object both support nested.

Mixed is any type, if the data is Mixed type, Schema should not any validation. Mixed not built-in constructor in JavaScript, therefore set data is Mixed, in fact set `Array` or `Object`, above schema1 example, `anyArr: []` and `anyObj: {}` the children is Mixed, `[]` and `{}` same as `Array` and `Object`.

`anyArr: []` same as `anyArr: Array`.

`anyObj: {}` same as `anyObj: Object`.

### Types Validation

Above example, can also use `$type`.

```js
// simply
new Schema({
    str: String
});

// $type
new Schema({
    str: {
        $type: String
    }
});
```

What time is use `$type`? Ballade Schema also include others types validation, be used for data stored validation more easily.

For example, make sure stored string is lowercase letter.

```js
new Schema({
    str: {
        $type: String,
        $lowercase: true   // configure the lowercase letter
    }
});
```

If stored `str = 'Hello'`, the final result is `str: 'hello'`. Types validation can multiple simultaneous use. For below example, the vaule is lowercase letter and trimed.

```js
new Schema({
    str: {
        $type: String,
        $lowercase: true,  // configure the lowercase letter
        $trim: true        // configure the trim
    }
});
```

Different data type have different types validation auxiliary options. There are also some options is general.

Array and Object is not have validation auxiliary options, because Array and Object both is Mixed type, the Mixed type is not validation.

**General Options**

* `$required` *Boolean*

Value is required.

* `$default` *Any*

Default value.

* `$validate` *Function*

Custom validation function.

**String Options**

* `$lowercase` *Boolean*

The value is converted to lowercase.

* `$uppercase` *Boolean*

The value is converted to uppercase.

* `$trim` *Boolean*

The value is trimed.

* `$match` *Regexp*

Match the given regexp expression.

* `$enum` *Array*

Match the list of conditions.

**Number Options**

* `$min` *Number*

Cannot be less than this value.

* `$max` *Number*

Cannot be greater than this value.

**Date Options**

* `$min` *Date*

Cannot be less than this date value.

* `$max` *Date*

Cannot be greater than this value.

### Error Handler

If data invaild, Schema try to convert base type, whether success or failure will give tips. If the convert still failed will throw `error` message.

#### Conversion Message Types

* `warning` Successful conversion will show `warning` type message, the storage can be normal.

* `error` Conversion is failed will show `error` type message, the storage is failed too.

`warning` message:

```js
// schema
new Schema({
    str: String
});

// This storage will throw warning message, but conversion is success.
// condition: str = 2;
// result: str === '2';
```

`error` message:

```js
// schema
new Schema({
    num: Number
});

// This storage will failed, because conversion is failed.
// condition: num = 'hello';
// result: num === undefined;
```

The value is `null` or `undefined`, will throw error message, can't be stored.

### Nested Schema

The actual storage scenario is more complex, for complex scenario, Schema support nested, be uesd for `Array` and `Object` data type.

Simply types definition for nested schema.

```js
new Schema({
    objArr: [{
        name: String,
        title: String
    }]
});
```

If want use auxiliary options for types validation, Schema must be nested.

```js
var childSchema = new Schema({
    name: {
        $type: String,
        $lowercase: true
    },
    title: {
        $type: String,
        $uppercase: true
    }
});

var parentSchema = new Schema({
    objArr: [childSchema]  // Nested Schema
});
```

### For Immutable Data

Ballade Schema also support immutable data validation. Immutable data validation same as mutable data, there is no difference.

```js
// schema
new Schema({
   foo: {
       bar: String,
       biz: String
   }
});

// mutable data
foo = {
    bar: 'bar',
    biz: 'biz'
};

// immutable data
foo = Immutable.Map({
    bar: 'bar',
    biz: 'biz'
});
```
