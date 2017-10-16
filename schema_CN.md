# Schema

## 为什么会有 Schema ？

Schema 的概念源于数据库中的数据存储，为了确保数据在存储到数据库中的时候数据是「可控」的，可以在存储数据时对数据结构、数据类型进行预定义，只有符合定义好的条件时才会存入。

在 Ballade 应用于前端开发中的时候，我们可以把 Store 当作一个简单的前端数据库，界面中所有的数据都是来源于 Store，Schema 确保了数据库的「写入」是可控的，那么从其中「读取」的数据也会是可控的。如果前端的数据都是可控的话，那么可以确保前端的界面不会因为数据的错误、异常而出现问题。这样一来，数据可控也就意味着界面可控。

Ballade 的 Schema 的设计思想就来源于 [Mongoose Schema](http://mongoosejs.com/docs/schematypes.html)。


## Schema 的使用

### 基本使用

Schema 的核心功能就是提前定义好数据的结构和数据项的类型。

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

对于上面的 schema 实例，在实际存储时符合 schema 定义的合法数据结果应该是下面这样的。

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

#### Schema 的类型:

Schema 支持如下类型的数据：

* String
* Number
* Boolean
* Date
* Array
* Object
* Mixed

Array 和 Object 是支持嵌套的。

Mixed 就是任意类型，使用 Mixed 类型时，Schema 将不作任何校验。与其他类型不同，Mixed 并不是 JavaScript 内置的构造函数，因此要设置数据为 Mixed 类型，实际上就是设置 `Array` 或 `Object`. 像上面的 schema1 例子中，`anyArr: []` 和 `anyObj: {}` 的子元素就是 Mixed 类型，`[]` 和 `{}` 字面量的写法等同于 `Array` 和 `Object` 构造函数的写法。

`anyArr: []` 等价于 `anyArr: Array`.

`anyObj: {}` 等价于 `anyObj: Object`.

### 类型校验选项

对于类型描述，上面给出的写法是简写的，也可以使用 `$type` 属性来指定。

```js
// 简写
new Schema({
    str: String
});

// 使用 $type 字段
new Schema({
    str: {
        $type: String
    }
});
```

那么什么情况下该使用 `$type` 呢？Ballade 的 Schema 还内置了其他很多不同的类型校验选项，用来更方便的数据的存储校验。

如可以指定存储的字符串是小写的。

```js
new Schema({
    str: {
        $type: String,
        $lowercase: true   // 设置存储时的字符串是小写的
    }
});
```

那么当写入 `str = 'Hello'` 这种数据时，最终的存储结果就会是 `str: 'hello'`。类型校验选项可以有多个组合使用。如下面就定义了存储时的值既要是小写也没有首尾空格。

```js
new Schema({
    str: {
        $type: String,
        $lowercase: true,  // 设置存储时的字符串是小写的
        $trim: true        // 去掉首尾空格
    }
});
```

不同的数据类型，有不同的类型校验辅助选项，也有一些是通用的校验选项。

Array 和 Object 没有辅助选项一说，因为设置这两种类型的数据实际上是 Mixed 类型，凡是 Mixed 类型，不做任何校验。

**通用选项：**

* `$required` *Boolean* 指定该字段必须要有值，如果存储时没值将抛出错误；
* `$default` *Any* 指定该字段默认的值，如果存储时没有指定值将使用默认的值；
* `$validate` *Function* 自定义校验的方法，存储值时会调用该校验方法；

**字符串的选项：**

* `$lowercase` *Boolean* 指定该字段在存储时转化成小写；
* `$uppercase` *Boolean* 指定该字段在存储时转化成大写；
* `$trim` *Boolean* 指定该字段在存储时去掉首位空格；
* `$match` *Regexp* 指定该字段在存储时必须和给出的正则相匹配；
* `$enum` *Array* 指定该字段在存储时必须和给出的条件列表相匹配；

**数值的选项：**

* `$min` *Number* 指定该字段在存储时其数值范围不能小于该值；
* `$max` *Number* 指定该字段在存储时其数值范围不能大于该值；

**日期的选项：**

* `$min` *Date* 指定该字段在存储时其日期时间范围不能小于该值；
* `$max` *Date* 指定该字段在存储时其日期时间范围不能大于该值；

### 错误处理

数据存储时如果类型校验不成功，Schema 内部会先尝试进行基本的转换，无论转换是否成功都会给出相应的消息提示。如果转换失败，则会给出 `error` 类型的消息。

**不同的消息类型：**

* `warning` 转换成功，则会给出 `warning` 类型的消息，存储可以正常进行；
* `error` 转换失败，则会给出 `error` 类型的消息，存储不可以正常进行；

`warning` 类型的消息；

```js
// schema
new Schema({
    str: String
});

// 这种存储场景因为可以转换，会给出 warning 的消息提示
// 条件：str = 2;
// 结果：str === '2'
```

`error` 类型的消息；

```js
// schema
new Schema({
    num: Number
});

// 这种存储场景不能转换，会给出 error 的消息提示
// 条件：num = 'hello';
// 结果：num === undefined;
```

对于 `null` 和 `undefined` 的值，则会直接给出 `error` 类型的消息，不能存储。

### 嵌套的 Schema

实际的数据存储场景会比较复杂，为了能满足实际的复杂场景，Schema 支持嵌套，这种情况主要出现在 `Array` 类型和 `Object` 类型的数据存储时。

简单的类型定义使用下面这种简单的嵌套写法是没有问题的。

```js
new Schema({
    objArr: [{
        name: String,
        title: String
    }]
});
```

但是要对每个数据项中的对象的属性使用类型校验辅助选项时就必须要使用 Schema 嵌套了。

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
    objArr: [childSchema]  // 嵌套的 Schema
});
```


### 对于 Immutable 类型数据的支持

Ballade 的 Schema 还支持 Immutable 类型的数据校验，所以在使用 Immutable 的 Store 时也可以无障碍的使用 Schema 的。

Mutable 类型和 Immutable 类型的数据在 Schema 的定义上是没有任何区别的。

```js
// schema
new Schema({
   foo: {
       bar: String,
       biz: String
   }
});

// mutable 数据
foo = {
    bar: 'bar',
    biz: 'biz'
};

// immutable 数据
foo = Immutable.Map({
    bar: 'bar',
    biz: 'biz'
});
```
