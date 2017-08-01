# 0.2.x 升级至 1.0

**1. 移除了 `store.mutable` 和 `store.immutable` 两个命名空间**

**0.2.x**

在 0.2.x 的版本中，`createMutableStore` 返回的 Store 包含了 `mutable` 的命名空间，并且提供了 `set`、`get`、`delete` 三个方法。

`creatImmutableStore` 返回的 Store 包含了 `immutable` 的命名空间，`store.immutable` 实际上是 Immutable 的实例。

```javascript
var exampleStore1 = dispatcher.createMutableStore(schema, callbacks);
console.log(typeof exampleStore1.mutable.set === 'function'); // true
console.log(typeof exampleStore1.mutable.get === 'function'); // true
console.log(typeof exampleStore1.mutable.delete === 'function'); // true

var exampleStore2 = dispatcher.createImmutableStore(schema, callbacks);
console.log(exampleStore1.immutable instanceof Immutable);          // true
console.log(typeof exampleStore1.immutable.set === 'function');    // true
console.log(typeof exampleStore1.immutable.setIn === 'function');  // true
console.log(typeof exampleStore1.immutable.get === 'function');    // true
console.log(typeof exampleStore1.immutable.getIn === 'function');  // true
console.log(typeof exampleStore1.immutable.delete === 'function'); // true
```

**1.0**

在 1.0 的版本中，`createMutableStore` 和 `creatImmutableStore` 返回的 Store 都没有了 `mutable` 和 `immutable` 的命名空间，都提供了相同的 `set`、`get`、`delete` 三个方法。

```javascript
var exampleStore1 = dispatcher.createMutableStore(schema, callbacks);
console.log(typeof exampleStore1.set === 'function');    // true
console.log(typeof exampleStore1.get === 'function');    // true
console.log(typeof exampleStore1.delete === 'function'); // true

var exampleStore2 = dispatcher.createImmutableStore(schema, callbacks);
console.log(typeof exampleStore2.set === 'function');    // true
console.log(typeof exampleStore2.get === 'function');    // true
console.log(typeof exampleStore2.delete === 'function'); // true
```

对于 `creatImmutableStore` 返回的 Store，其获取到的数据都会是 Immutable 类型的。

**2. Store 的 get 和 delete 方法增加了第二个参数**

增加的参数用于获取和删除缓存的数据。

**3. 移除了 `store.event` 的命名空间**

原来的 Store 处理事件的方法都在 `store.event` 的命名空间中，现在可以直接在一级命名空间进行事件处理方法的访问。

**0.2.x**

```js
var exampleStore1 = dispatcher.createMutableStore(schema, callbacks);
console.log(typeof exampleStore1.event.publish === 'function'); // true
console.log(typeof exampleStore1.event.subscribe === 'function'); // true
console.log(typeof exampleStore1.event.unsubscribe === 'function'); // true
```

**1.0**

```js
var exampleStore1 = dispatcher.createMutableStore(schema, callbacks);
console.log(typeof exampleStore1.publish === 'function'); // true
console.log(typeof exampleStore1.subscribe === 'function'); // true
console.log(typeof exampleStore1.unsubscribe === 'function'); // true
```

**4. Store Callbacks 无需再有返回值**

原来的 Store Callbacks 都要返回数据变化的 key，这样 Store 才知道变化的数据的 key。现在只要有 set 操作，Store 都知道数据变化的 key。

**0.2.x**

```js
var exampleStore = dispatcher.createImmutableStore(schema, {
    'example/update-title': function (store, action) {
        return store.set('title', action.title);
    }
});
```

**1.0**

```js
var exampleStore = dispatcher.createImmutableStore(schema, {
    'example/update-title': function (store, action) {
        store.set('title', action.title);
    }
});
```

**5. Schema 的优化**

1.0 的 Schema 完全重构，详见 [Schema](/schema.md)。

**6. `createMutableStore` 和 `createImmutableStore` 增加了 `options`**

`options.error` 回调函数可以监听数据校验失败的错误。

`options.cache` 可以对数据进行缓存，详见 [Cache](/cache.md)。

**7. publish 和 subscribe 方法增加了变化的数据的发送和接收**

在 1.0 的版本中，`publish(type, changedValue)` 中的 `changedValue` 可以将广播事件的时候将变化的数据发送出去，而在 `subscribe(type, handler)` 中的 `handler` 事件处理函数的第一个参数就是 `publish` 传递过来的 `changedValue`。

**8. 增加了 `Ballade.bindStore` 方法**

**9. 增加了 `Ballade.immutableDeepEqual` 方法**

