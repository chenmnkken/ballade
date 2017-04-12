# 0.2.x update to 1.0

**1. Remove `store.mutable` and `store.immutable` two namespace**

**0.2.x**

In 0.2.x version, `createMutableStore` returned Store include `mutable` namespace, and has `set` `get` `delete` three methods.

`creatImmutableStore` returned Store include `immutable` namespace, `store.immutable` actually is Immutable instance.

```javascript
var exampleStore1 = dispatcher.createMutableStore(schema, callbacks);
console.log(typeof exampleStore1.mutable.set === 'fcunction'); // true
console.log(typeof exampleStore1.mutable.get === 'fcunction'); // true
console.log(typeof exampleStore1.mutable.delete === 'fcunction'); // true

var exampleStore2 = dispatcher.createImmutableStore(schema, callbacks);
console.log(exampleStore1.immutable instanceof Immutable);          // true
console.log(typeof exampleStore1.immutable.set === 'fcunction');    // true
console.log(typeof exampleStore1.immutable.setIn === 'fcunction');  // true
console.log(typeof exampleStore1.immutable.get === 'fcunction');    // true
console.log(typeof exampleStore1.immutable.getIn === 'fcunction');  // true
console.log(typeof exampleStore1.immutable.delete === 'fcunction'); // true
```

**1.0**

In 1.0 version, `createMutableStore` and `creatImmutableStore` returned Store both not `mutable` and `immutable` namespace, both have `set` `get` `delete` three methods.

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

For `creatImmutableStore` returned Store, the geted data will immutable data.

**2. Store.get and Store.delete added second argument**

Added argument be used for get and delete cached data.

**3. Remove `store.event` namespace**

**0.2.x**

```js
var exampleStore1 = dispatcher.createMutableStore(schema, callbacks);
console.log(typeof exampleStore1.event.publish === 'fcunction'); // true
console.log(typeof exampleStore1.event.subscribe === 'fcunction'); // true
console.log(typeof exampleStore1.event.unsubscribe === 'fcunction'); // true
```

**1.0**

```js
var exampleStore1 = dispatcher.createMutableStore(schema, callbacks);
console.log(typeof exampleStore1.publish === 'fcunction'); // true
console.log(typeof exampleStore1.subscribe === 'fcunction'); // true
console.log(typeof exampleStore1.unsubscribe === 'fcunction'); // true
```

**4. Store Callbacks no return value**

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

**5. Schema Feature**

View details about [Schema documentation](/schema.md).

**6. `createMutableStore` and `createImmutableStore` added `options`**

`options.error` If Schema validation data error, will trigger this callback function.

`options.cache` Be used for configure cache for data item in Store, view details about [Cache documentation](/cache.md).

**7. `publish` and `subscribe` added `changedValue`**

`changedValue` is used for transmit changed value to event subscriber.

**8. Added `Ballade.bindStore` method**

**9. Added `Ballade.immutableDeepEqual` method**

