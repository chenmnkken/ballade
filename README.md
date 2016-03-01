# Ballade

Reinterpreted Flux application architecture, for unidirectional data flow in React.

[中文文档](https://github.com/chenmnkken/ballade/blob/master/README_CN.md)

## Two version

[ballade.js](https://github.com/chenmnkken/ballade/blob/master/dist/ballade.js) by default, Ballade provides `store` is mutable.

[ballade.immutable.js](https://github.com/chenmnkken/ballade/blob/master/dist/ballade.immutable.js) it also provides another option, `store` is immutable, need dependence [immutable-js](https://github.com/facebook/immutable-js).

## Install

### npm

Install `ballade` using npm.

```
$ npm install ballade
```

and can be required like this:

```js
var Dispatcher = require('ballade').Dispatcher;
```

Note: if you want use `ballade` & `immutable`, you should install [immutable-js](https://github.com/facebook/immutable-js).


```
$ npm install immutable
```

and can be required like this:

```js
var Dispatcher = require('ballade/src/ballade.immutable').Dispatcher;
```

### browser

To use `ballade` from a browser, download js file in [dist](https://github.com/chenmnkken/ballade/tree/master/dist).

```js
// mutable version
<script src="ballade.js"></script>
<script>
var Dispatcher = Ballade.Dispatcher;
</script>

// immutable version
<script src="immutable.js"></script>
<script src="ballade.immutable.js"></script>
<script>
var Dispatcher = Ballade.Dispatcher;
</script>
```

## Architecture Introduction

### Store

**Store** is an storage center of data, provides set and get data interface, just like accessor.

In **Views** or **Controller-views** (React Component), only get data from **Store**. In **Store Callbacks**, can set and get data if you want.

When data changes, **Store** should publish event for changes.

Accessor of **Store** have mutable and immutable, for mutable data and immutable data.

---

### Actions

All operations, like user interactions or fetch data from server, as long as the data will cause changes in **Store**, it is a **Action**.

If you want change data in **Store**, only trigger a **Action**. Every **Action** have a unique **ActionType** and payload, **ActionType** just like **Action** unique name, payload is transfer to **Store** of data.

---

### Dispatcher

**Dispatcher** use to connect **Actions** and **Store**, transfer payload in **Action** to **Store**.

---

### Actions Middleware

When transfer payload to **Store**, middleware can process payload, each middleware transfer payload to next middleware when current middleware end processing. If you want fetch data from server, you can register a middleware.

---

### Store Callbacks

When action is trigger, **Store** need a callback corresponding with action, use to set data, **ActionType** corresponding with **Store** callback name.

## API

* **Dispatcher**

Main class use to create **Dispatcher** instance.

```js
var Dispatcher = require('ballade').Dispatcher;
var dispatcher = new Dispatcher();
```
---

* **dispatcher.use(middleware)**
  * `middleware` *Function*

Register a middleware, all payload of **Actions** will through the middleware. Middleware can register multiple.

```js
dispatcher.use(function (payload, next) {
    // modify payload.count
	if (count in payload) {
	    payload.count++;
	}

	// must invoke next callback,
	// payload through the callback transfer to next middleware
	next();
});
```

If you need fetch data from server.

```js
dispatcher.use(function (payload, next) {
    // payload whether include uri
	if (payload.uri) {
	    fetch(payload.uri, payload.options || {}).then(function(response){
	        return response.json();
	    })
	    .then(function(response){
	        payload.response = response;
	        // next callback in a Asynchronous function
	        next();
	    });
	}
	// If not uri, just invoke next callback
	else {
	    next();
	}
});
```
---

* **dispatcher.createActions(actionCreators)**
  * `actionCreators` *Object*

Create an group **Actions**.

```js
var actions = dispatcher.ceateActions({
    updateTitle: function (title) {
        return {
            type: 'example/update-title',
            title: title
        };
    }
});

// trigger a action, and transfer title
actions.updateTitle('foo');
```

Note: **ActionType** must be unique, if have duplicate will throw Error. if application is complex, make sure the **ActionType** is unique, recommend use pseudo namespace. In `example/update-title` the `example` is namaspace.

---

* **dispatcher.createMutableStore(schema, callbacks)**
  * `schema` *Object*
  * `callbacks` *Object*

Create an mutable **Store**.

`schema` is data model for **Store**, only key in `schema`, can be set and get data. `Schema` can suggestion to developer this **Store** what have data.

Definition an `schema` for **Store**.

```js
var schema = {
    title: null,
    meta: {
        votes: null,
        favs: null
    }
};
```

Let's create `exampleStore`:

```js
var exampleStore = dispatcher.createMutableStore(schema, {
    // This is Store callback
    'example/update-title': function (store, action) {
        return store.mutable.set('title', action.title);
    }
});
```

The `exampleStore` is use to **Views** or **Controller-views** (React Component), only get data and subscribe the data changs.

```js
// return title from store
exampleStore.mutable.get('title');
// no set method in exampleStore
console.log(exampleStore.mutable.set) // => undefined
```

In `example/update-title` callback, `store` can set and get data if you want, and this callback **must return store set or delete operations result**, **Store** need the result publish event for changes.

---

* **dispatcher.createImmutableStore(schema, callbacks)**
  * `schema` *Object*
  * `callbacks` *Object*

```js
var exampleStore = dispatcher.createImmutableStore(schema, {
    // This is Store callback
    'example/update-title': function (store, action) {
        return store.immutable.set('title', action.title);
    }
});
```

Create an immutable **Store**.

Note: `createImmutableStore` only available in `ballade.immutable.js` and need dependence [immutable-js](https://github.com/facebook/immutable-js).

---

* **store.mutable**

Accessor for mutable data, `exampleStore.mutable` and `store.mutable` is accessor for mutable data.

---

* **store.mutable.set(key, value)**
  * `key` *String*  
  * `value` *Anything*

Set data in store, if the key not in schema, set operation should failed. This method will return key.

```js
var key = store.mutable.set('title', 'foo');
console.log(key) // => 'title'
```

Note: set method only use in **Store** callback.

---

* **store.mutable.get(key)**
  * `key` *String*  

Get data from store, If data is reference type (Object or Array), should return copies of data.

```js
var title = store.mutable.get('title');
console.log(title) // => 'foo'

// If title is object, title = { foo: 'bar' }
// It return copies of object
var title = store.mutable.get('title');
console.log(title.foo) // => 'bar'

title.foo = 'baz';
console.log(title.foo) // => 'baz'

console.log(store.mutable.get('title').foo) // => 'bar'
```

---

* **store.mutable.get(key)**
  * `key` *String*  

Delete data from **Store**.

---

* **store.immutable**

Accessor for immutable data, `exampleStore.immutable` and `store.immutable` is accessor for immutable data.

Note: `store.immutable` accessor only create by `createImmutableStore`.

`store.immutable` accessor just warp a **Immutable** instance, so it include all `Immutable` instance prototype method.

```js
store.immutable.set
store.immutable.setIn
store.immutable.get
store.immutable.getIn
store.immutable.update
store.immutbale.updateIn
...
```

More `Immutable` API in [Immtable Document](http://facebook.github.io/immutable-js/docs/#/).

---

* **store.event.subscribe(type, handler)**
  * `type` *String* *optional*
  * `handler` *Function*

Subscribe event, `type` is event type, it is optional, it corresponding with key in `schema`. `handler` is handle function for changes.

`exampleStore.event.subscribe` is subscribe the data changes.

```js
// If title is changed, callback will invoke.
exampleStore.event.subscribe('title', function () {
    var title = store.mutable.get('title');
    console.log(title);

    // or
    var title = store.immutable.get('title');
    console.log(title);    
});
```
---

* **store.event.unsubscribe(type, handler)**
  * `type` *String* *optional*
  * `handler` *Function* *optional*

Cancel subscribe event, `type` is event type, it is optional. `handler` is handle function for changes, if `type` not empty, `handler` is optional.

```js
exampleStore.event.unsubscribe('title');
```

### No `waitFor`

In Flux, it provides `waitFor` method use to between dependence **Store**, this is not good design, it should make application more complex. In [flux/examples/flux-chat/js/stores/MessageStore.js](https://github.com/facebook/flux/blob/master/examples/flux-chat/js/stores/MessageStore.js#L101), if you remove this code, the example still work.

```js
ChatAppDispatcher.waitFor([ThreadStore.dispatchToken]);
```

Of course, the `waitFor` not useless in Flux, it make developer more confused.

Dependence between **Store** in Ballade, just like use a variable, you need make sure variable is available, it is simple.

```js
var storeA = dispatcher.createMutableStore(schema, {
    'example/update-title': function (store, action) {
        return store.mutable.set('title', action.title);
    }
});

// If storeB dependence storeA
var storeB = dispatcher.createMutableStore(schema, {
    'example/update-title': function (store, action) {
        var title = storeA.mutable.get('title') + '!';
        return store.mutable.set('title', title);
    }
});
```

### Examples

* Mutable [TodoMVC](https://github.com/chenmnkken/ballade/tree/master/examples/ballade-mutable-todomvc)
* Immutable [TodoMVC](https://github.com/chenmnkken/ballade/tree/master/examples/ballade-immutable-todomvc)

### Test

```
$ npm install
$ npm test
```

### Build

```
$ npm install
$ npm run build
```

### Thanks

* [Flux](https://github.com/facebook/flux)
* [Immutable](https://github.com/facebook/immutable-js/)

### License

MIT @ [Yiguo Chan](https://github.com/chenmnkken)
