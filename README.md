# Ballade

Reinterpreted Flux application architecture, for unidirectional data flow in React.

[0.2.x update version to 1.0](https://github.com/chenmnkken/ballade/blob/master/update-guide.md)

[中文文档](https://github.com/chenmnkken/ballade/blob/master/README_CN.md)

## Two version

[ballade.js](https://github.com/chenmnkken/ballade/blob/master/dist/ballade.js) by default, Ballade provides Store is mutable.

[ballade.immutable.js](https://github.com/chenmnkken/ballade/blob/master/dist/ballade.immutable.js) it also provides another option, Store is immutable, need dependence [immutable-js](https://github.com/facebook/immutable-js).

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

Notice: if you want use `ballade` & `immutable`, you should install [immutable-js](https://github.com/facebook/immutable-js).


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

Store is an storage center of data, provides set and get data interface, just like accessor.

In Views or Controller-views (React Component), can only get data from Store. In Store Callbacks, both of set and get data from Store.

If data changed, Store should publish event for data changes.

There are two types of Store accessor, mutable and immutable, for mutable data and immutable data, respectively by `createMutableStore` and `createImmutableStore` method created.

Data stored in Store must configure Schema, make sure the data is valid.

Store has Cache module, be used for data cache. The Cache module integrates `localStorage` and `sessionStorage` for persistence cache.

---

### Actions

All of operations, like user interactions or fetch data from server, as long as the data will cause changes in Store, the operation as a Action. The operation that causes the data change can be either set or update data.

If you want change data in Store, can only trigger a Action.

Every Action have includes a unique ActionType and payload, ActionType just like Action unique name, payload data is transfer to Store of data.

---

### Dispatcher

Dispatcher be used for connect Actions and Store, responsible for transfer payload data from Action to specified Store.

---

### Actions Middleware

When transfer payload to Store, middleware can process payload data, each middleware transfer payload data to next middleware when current middleware end processing.

If you want fetch data from server, you can register a middleware.

---

### Store Callbacks

When action is trigger, **Store** need a callback corresponding with action, use to set data, **ActionType** corresponding with **Store** callback name.

## API

* Class
	* [Ballade.Dispatcher](#balladedispatcher)
	* [Ballade.Schema](#balladeschema)
* Dispatcher instance
	* [dispatcher.use](#dispatcherusemiddleware)
	* [dispatcher.createActions](#dispatchercreateactionsactioncreators)
	* [dispatcher.createMutableStore](#dispatchercreatemutablestoreschema-options-callbacks)
	* [dispatcher.createImmutableStore](#dispatchercreateimmutablestoreschema-options-callbacks)
* Store instance
	* [store.set](#storesetkey-value)
	* [store.get](#storegetkey-id)
	* [store.delete](#storedeletekey-id)
	* [store.subscribe](#storesubscribetype-handler)
	* [store.unsubscribe](#storeunsubscribetype-handler)
	* [store.publish](#storepublishtype-changedvalue)
* Others
	* [Ballade.binStore](#balladebindstorecomponent-store-callbacks)
	* [Ballade.immutableDeepEqual](#balladeimmutabledeepequalcomponent)

### Ballade.Dispatcher()

Main class use to create a Dispatcher instance.

```js
var Dispatcher = require('ballade').Dispatcher;
var dispatcher = new Dispatcher();
```
---

### Ballade.Schema()

Be used for create a Schema instance.

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

The Schema used for describe data structure in Store, and validation data, if the data is invalid, then can't stored. View details about [Schema documentation](https://github.com/chenmnkken/ballade/blob/master/schema.md).

---

### **dispatcher.use(middleware)**
  * `middleware` *Function*

Register a middleware, all payload of Actions will through the middleware. Middleware can register multiple.

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

If you need fetch data from server, you should register a middleware.

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

### **dispatcher.createActions(actionCreators)**
  * `actionCreators` *Object*

Create an group Actions.

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

> **Notice:** ActionType must be unique, if have duplicate will throw Error. if application is complex, make sure the ActionType is unique, recommend use pseudo namespace. In `example/update-title` the `example` is namaspace.

---

### dispatcher.createMutableStore(schema [,options], callbacks)
  * `schema` *Schema instance*
  * `options` *Object* *optional*
  * `callbacks` *Object*

Create an mutable Store.

#### schema

Definition an Schema for Store.

```js
var schema = new Schema({
    title: String,
    meta: {
        votes: String,
        favs: String
    }
});
```

#### callbacks

Now, let's create `exampleStore`:

```js
var exampleStore = dispatcher.createMutableStore(schema, {
    // This is Store callback
    'example/update-title': function (store, action) {
        store.set('title', action.title);
    }
});
```

The `exampleStore` be used for Views or Controller-views (React Component), can only get data and subscribe the data changs, can't stored data in Store.

```js
// return title from store
exampleStore.get('title');
// no set method in exampleStore
console.log(exampleStore.set) // => undefined
```

In `example/update-title` callback, `store` can set and get data if you want.

#### options

When create an Store instance, also specified by options for Store.

* `options.error` *Function*

If Schema validation data error, will trigger this callback function.

```
options.error = function (error, store) {
    console.log(error.key);      // error key
    console.log(error.type);     // error type
    console.log(error.messages); // error message
    console.log(store);          // Store instance
};
```

* `options.cache` *Object*

Be used for configure cache for data item in Store, view details about [Cache  documentation](https://github.com/chenmnkken/ballade/blob/master/cache.md).

---

### dispatcher.createImmutableStore(schema, callbacks)
  * `schema` *Schema instance*
  * `options` *Object* *optional*
  * `callbacks` *Object*

```js
var exampleStore = dispatcher.createImmutableStore(schema, {
    // This is Store callback
    'example/update-title': function (store, action) {
        store.set('title', action.title);
    }
});
```

Create an immutable Store, the params usage method same as `createMutableStore`.

> **Notice:** `createImmutableStore` only available in `ballade.immutable.js` and need dependence [immutable-js](https://github.com/facebook/immutable-js).

---

### store.set(key, value)
  * `key` *String*  
  * `value` *Anything*

Set data in store, if the key not definition in schema, the set operation should failed. This method will return key.

```js
var key = store.set('title', 'foo');
console.log(key) // => 'title'
```

> **Notice:** set method can only use in Store callback.

---

### store.get(key [,id])
  * `key` *String*
  * `id` *String* *optional*

Get data from store, If data is reference type (Object or Array), should return copies of data.

If the key has configure the cache, when get data from Store should specify cache `id`, if not specify this param, should return all cached data.

```js
var title = store.get('title');
console.log(title) // => 'foo'

// If title is object, title = { foo: 'bar' }
// It return copies of object
var title = store.get('title');
console.log(title.foo) // => 'bar'

title.foo = 'baz';
console.log(title.foo) // => 'baz'
console.log(store.get('title').foo) // => 'bar'
```

> **Notice:** If Store is Immutable type (created by `dispatcher.createImmutableStore`), then return data is Immutable type.

---

### store.delete(key [,id])
  * `key` *String*  
  * `id` *String* *optional*

Delete data from **Store**.

If the key has configure the cache, when delete data from Store should specify cache `id`.

---

### store.subscribe(type, handler)
  * `type` *String* *optional*
  * `handler` *Function*

Subscribe event, `type` is event type, it is optional, it corresponding with key in Schema. `handler` is handle function for data changes.

```js
// If title is changed, callback will invoke.
exampleStore.subscribe('title', function (changedValue) {
    console.log(changedValue);  // should return changed title
});
```

The first argument of `handler` is changed data, corresponding the `changedValue` of `publish` method.

---

### store.unsubscribe(type, handler)
  * `type` *String* *optional*
  * `handler` *Function* *optional*

Cancel subscribe event, `type` is event type, it is optional. `handler` is handle function for changes, if `type` not empty, `handler` is optional.

```js
exampleStore.unsubscribe('title');
```

---

### store.publish(type, changedValue)
  * `type` *String*
  * `changedValue` *Anything*

Broadcast an event, `type` is event type, it corresponding with key in Schema.

`changedValue` is used for transmit changed value to event subscriber.

```js
exampleStore.publish('title', 'This is changed title');
```

---

### Ballade.bindStore(Component, store, callbacks)

Bind Store for React Component, the binded Component has receive Store data changes.

* `Component` *React Component*
* `store` *Store instance*
* `callbacks` *Function*

```javascript
var bindStore = require('ballade').bindStore;

App = bindStore(App, todosStore, {
    todos: function (value) {
        this.setState({
            $todos: value
        });
    }
});
```

In above example, `App` Component binded `todosStore`, if `todos` data in  `todosStore` changes, then will trigger callback function. In the callback function, `value` is changed data.

And in this function, `this` pointing Component.

`bindStore` is easy usage in React Component, in `componentDidMount` and `componentWillUnmount` stage of Compoent, don't need bind or unbind data changes event in Store.

### Ballade.immutableDeepEqual(Component)

* `Component` *React Component*

`immutableDeepEqual` method will optimize `shouldComponentUpdate` of React Compoent. If the component `props` or `state` is Immutable data, only the data is real changed, then trigger `render` of component.

> **Notice:** The `immutableDeepEqual` method only definition in `ballade.immutable.js`.

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
        store.set('title', action.title);
    }
});

// If storeB dependence storeA
var storeB = dispatcher.createMutableStore(schema, {
    'example/update-title': function (store, action) {
        var title = storeA.get('title') + '!';
        store.set('title', title);
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
