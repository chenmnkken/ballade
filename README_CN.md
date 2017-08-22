# Ballade

重新诠释 Flux 的应用架构，在 React 中更便捷的使用单向数据流。

[0.2.x 升级至 1.0](https://github.com/chenmnkken/ballade/blob/master/update-guide_CN.md)

## 两个版本

[ballade.js](https://github.com/chenmnkken/ballade/blob/master/dist/ballade.js) 默认情况下, Ballade 提供的 Store 的数据是 Mutable（可变）的.

[ballade.immutable.js](https://github.com/chenmnkken/ballade/blob/master/dist/ballade.immutable.js) 同时也提供了另一个选择, 提供的 Store 的数据是 Immutable（不可变）的, 但是需要依赖 [immutable-js](https://github.com/facebook/immutable-js).

## 安装

### npm

使用 npm 来安装 `ballade`。

```
$ npm install ballade
```

然后像这样使用：

```js
var Dispatcher = require('ballade').Dispatcher;
```

注意：如果你想使用 `ballade` 和 `immutable`，还需要同时安装 [immutable-js](https://github.com/facebook/immutable-js).

```
$ npm install immutable
```

然后像这样使用：

```js
var Dispatcher = require('ballade/src/ballade.immutable').Dispatcher;
```

### 浏览器

如果直接在浏览器中使用 `ballade`，从 [dist](https://github.com/chenmnkken/ballade/tree/master/dist) 下载你需要的版本即可。

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

## 架构介绍

### Store

Store 是一个数据的存储中心，提供了「写入」和「读取」数据的接口，就像一个数据的「访问器」。

在 Views 或 Controller-views （React 组件）中，只能从 Store 中「读取」数据，在 Store Callbacks 中，才能自由的「写入」和「读取」数据。

当数据变化的时候，Store 会发送一个数据变化的事件。

Store 的数据「访问器」分为 Mutable（可变）和 Immutable（不可变）的两种，分别由 `createMutableStore` 和 `createImmutableStore` 方法来创建。

存入到 Store 的数据都要配置 Schema，以对数据进行校验。

Store 提供了 Cache（缓存）模块，便于对数据进行缓存。Cache 模块同时还和 `localStorage`、`sessionStorage` 相结合，做持久化的缓存。

---

### Actions

所有的操作，像用户的交互行为或者从服务器获取一个数据，只要会引起数据变化的操作都可以把它看作是一个 Action，引起数据变化的操作可以是「写入」或「更新」数据。

如果想「写入」或「更新」Store 中的数据，只能发起一个 Action。

每个 Action 都包含一个 ActionType 和 payload。ActionType 是这个 Action 的唯一的名字，payload 数据就是传递给 Store 的数据。

---

### Dispatcher

Dispatcher 用于连接 Actions 和 Store 的「调度员」，负责将 Action 产生的 payload 数据分发给指定的 Store。

---

### Actions Middleware

在传送 payload 数据到 Store 的过程中，可以注册一些中间件来处理 payload 数据，每个中间件会把处理完的 payload 结果再传递给下一个中间件，当所有的中间件都处理完后，才会将数据存入到 Store 中。

比如你想从服务器取数据，可以注册一个中间件来统一处理。

---

### Store Callbacks

当 Action 触发的时候，Store 需要一个与该 Action 对应的回调函数来处理 payload 数据，这时可以将数据写入到 Store 中。ActionType 需要与 Store 的回调函数名相对应。

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
	* [store.set](#storesetkey-value-pureset)
	* [store.get](#storegetkey-id)
	* [store.delete](#storedeletekey-id)
	* [store.subscribe](#storesubscribetype-handler)
	* [store.unsubscribe](#storeunsubscribetype-handler)
	* [store.publish](#storepublishtype-changedvalue)
* Others
	* [Ballade.binStore](#balladebindstorecomponent-store-callbacks)
	* [Ballade.immutableDeepEqual](#balladeimmutabledeepequalcomponent)

### Ballade.Dispatcher()

用于创建一个 Dispatcher 的实例。

```js
var Dispatcher = require('ballade').Dispatcher;
var dispatcher = new Dispatcher();
```
---

### Ballade.Schema()

用于创建一个 Schema 的实例。

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

Schema 用于描述存储在 Store 中的数据结构，并对存储的数据进行校验，如果校验有问题，则无法存储。查看详细的 [Schema 文档](https://github.com/chenmnkken/ballade/blob/master/schema_CN.md)。

---

### dispatcher.use(middleware)
  * `middleware` *Function*

注册一个中间件，所有 Action 的 payload 数据都会通过中间件，中间件可以注册多个。

```js
dispatcher.use(function (payload, next) {
    // 修改 payload.count
	if (count in payload) {
	    payload.count++;
	}

	// 在中间件中，必须执行 next 函数，
	// 这样才能将处理完的 payload 数据传递给下一个中间件
	next();
});
```

如果想从服务器获取数据，应该注册一个专门用于获取数据的中间件。

```js
dispatcher.use(function (payload, next) {
    // 可以通过中间件中是否包含 uri 字段来判断是否使用 fetch 来取数据
	if (payload.uri) {
	    fetch(payload.uri, payload.options || {}).then(function(response){
	        return response.json();
	    })
	    .then(function(response){
	        payload.response = response;
	        // 异步函数中的 next 回调
	        next();
	    });
	}
	// 如果不包含 uri 字段，则不作任何处理
	else {
	    next();
	}
});
```
---

### dispatcher.createActions(actionCreators)
  * `actionCreators` *Object*

创建一组 Actions。

```js
var actions = dispatcher.ceateActions({
    updateTitle: function (title) {
        return {
            type: 'example/update-title',
            title: title
        };
    }
});

// 触发一个 action，并传递 title 的数据
actions.updateTitle('foo');
```

> **注意:** ActionType 必须是唯一的，如果有重名，会给出错误提示。如果一个应用比较复杂，为了确保 ActionType 不重复，建议使用「伪命名空间」来进行区分， 在 `example/update-title` 中，`example` 就是「伪命名空间」。

---

### dispatcher.createMutableStore(schema [,options], callbacks)
  * `schema` *Schema instance*
  * `options` *Object* *optional*
  * `callbacks` *Object*

用于创建一个 Mutable（可变）的 Store。

#### schema

为 Store 定义一组 Schema。

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

现在让我们创建一个 `exampleStore`：

```js
var exampleStore = dispatcher.createMutableStore(schema, {
    // 这就是 Store 的回调函数
    'example/update-title': function (store, action) {
        store.set('title', action.title);
    }
});
```

`exampleStore` 用于 Views 或 Controller-views（React 组件）中，并且只能获取数据和接受数据变化的通知，不能「写入」数据（这其实屏蔽了尝试直接向 Store 写入和更新数据的可能）。

```js
// return title from store
exampleStore.get('title');
// no set method in exampleStore
console.log(exampleStore.set) // => undefined
```

在 `example/update-title` 的回调函数中，store 可以自由的「写入」和「读取」数据。

#### options

创建 Store 的时候，还能通过 `options` 为其指定一些选项。

* `options.error` *Function*

当 Schema 校验错误时会触发该回调函数。

```
options.error = function (error, store) {
    console.log(error.key);      // 发生错误的 key
    console.log(error.type);     // 错误类型
    console.log(error.messages); // 错误消息
    console.log(store);  // Store 实例
};
```

* `options.cache` *Object* `options.cache[key]` 这里的 key 需要和 Schema 中的 key 对应。
* `options.cache[key].id` *String* 缓存的唯一 id，读取数据的时候需要指定对应的 id
* `options.cache[key].maxLength` *Number* 默认值为 20，缓存数据的最大长度，超过该长度的话会将最先缓存的数据清除，然后再添加新的数据。
* `options.cache[key].persistence.type` `String` 持久化缓存的类型，目前支持 `localStorage` 和 `sessionStorage`。
* `options.cache[key].persistence.prefix` `String` 持久化缓存的前缀，添加自定义的前缀可以防止存储 key 的冲突。

为数据项配置缓存，详见关于 [cache 的文档](https://github.com/chenmnkken/ballade/blob/master/cache_CN.md)。

---

### dispatcher.createImmutableStore(schema [,options], callbacks)
  * `schema` *Object*
  * `options` *Object* *optional*
  * `callbacks` *Object*

```js
var exampleStore = dispatcher.createImmutableStore(schema, {
    'example/update-title': function (store, action) {
        store.set('title', action.title);
    }
});
```

创建一个 Immutable（不可变）的 Store，参数的使用方法和 `createMutableStore` 一致。

> **注意：**`createImmutableStore` 只定义在了 `ballade.immutable.js` 中，并且需要依赖 [immutable-js](https://github.com/facebook/immutable-js)。

---

### store.set(key, value [,pureSet])
  * `key` *String*
  * `value` *Anything*
  * `pureSet` *Boolean* *optional*

通过访问器来「写入」数据到 Store 中，如果数据的 `key` 没有在 Schema 中定义，操作会失败。

```js
var key = store.set('title', 'foo');
console.log(key) // => 'title'
```

对于 mutable 的 Store 来说，可以存储 mutable 类型的数据。对于 immutable 类型的 Store 来说，无论是存储 mutable 还是 immutable，都会转化为 immutable 类型的数据，所有最终获取到的数据都是 immutable 类型的。

如果数据写入 store 成功，同时还会触发数据变更的事件，如果将 `pureSet` 设置成 `true`，将不再触发数据变更的事件，默认为 `false`。

> **注意**：「写入」方法只能在 Store 的回调函数中使用。

---

### store.get(key [,id])
  * `key` *String*
  * `id` *String* *optional*

从 Store 中「读取」数据，如果该数据是引用类型（对象或数组），会返回该克隆的数据。

如果有指定设置缓存，在获取数据的时候需指定缓存 `id`，如果没有指定该参数，会返回所有缓存的数据。

```js
var title = store.get('title');
console.log(title) // => 'foo'

// 如果 title 是一个对象, title = { foo: 'bar' }
// 会返回 title 的克隆对象
var title = store.get('title');
console.log(title.foo) // => 'bar'

title.foo = 'baz';
console.log(title.foo) // => 'baz'
console.log(store.get('title').foo) // => 'bar'
```

> **注意：** 如果 Store 是 Immutable 类型（通过 `dispatcher.createImmutableStore` 创建的）的，那么通过 `get` 返回的都会是 immutable 类型的数据。

---

### store.delete(key [,id])
  * `key` *String*  
  * `id` *String* *optional*

从 Store 中删除数据。

如果有指定设置缓存，在删除数据的时候需指定缓存 `id`。

---

### store.subscribe(type, handler)
  * `type` *String* *optional*
  * `handler` *Function*

订阅 Store 中的数据变化的事件。`type` 就是事件类型，它是可选的，它和定义在 Schema 中的数据 key 相对应。`handler` 则是数据变化的处理函数。

```js
// 如果 titile 有变化，回调函数则会执行
exampleStore.subscribe('title', function (changedValue) {
    console.log(changedValue); // 返回变化后的 title
});
```

`handler` 的第一个参数是发生变化的数据，与 `publish` 中的 `changedValue` 对应。

---

### store.unsubscribe(type, handler)
  * `type` *String* *optional*
  * `handler` *Function* *optional*

取消事件订阅，`type` 就是事件类型，它是可选的，它和定义在 Schema 中的数据 key 相对应。`handler` 则是数据变化的处理函数，如果 `type` 不为空，`handler` 也是可选的。

```js
exampleStore.unsubscribe('title');
```

---

### store.publish(type, changedValue)
  * `type` *String*
  * `changedValue` *Anything*

广播一个事件，`type` 就是事件类型，它和定义在 Schema 中的数据 key 相对应。`changedValue`用于在广播事件时向订阅者传递变化的数据。

```js
exampleStore.publish('title', 'This is changed title');
```

---

### Ballade.bindStore(Component, store, callbacks)

将 React 组件和 Store 进行绑定，使绑定的组件能响应 Store 的数据变化，该方法会返回一个新的 `React Component`。

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

在上面的实例中，`App` 组件在绑定了 `todosStore` 后，当 `todosStore` 中的 `todos` 的数据变化，则会执行对应的回调函数。在该回调函数中，会通过 `value` 向函数传递变化的数据. 在该回调函数中，`this` 指向的是 `App` 实例。

`bindStore` 简化了 React 组件在使用时，需要在 `componentDidMount` 和 `componentWillUnmount` 阶段频繁绑定和解绑 Store 的数据变化的事件。

### Ballade.immutableDeepEqual(Component)

* `Component` *React Component*

`immutableDeepEqual` 方法会对 React 组件的 `shouldComponentUpdate` 方法进行优化，如果组件的 `props` 或 `state` 中有用到 Immutable 的数据，该方法只有在数据变化才会执行组件的 `render` 函数。该方法会返回一个新的 `React Component`。

```
var immutableDeepEqual = require('ballade').immutableDeepEqual;
App = immutableDeepEqual(App);
```

仅在 `ballade.immutable.js` 的版本中才有的方法，详见 [http://stylechen.com/react-and-immutable.html](http://stylechen.com/react-and-immutable.html)。

## 你其实不需要 `waitFor`

在 Flux 中，它提供了一个 `waitFor` 来处理 Store 之间的依赖，这并不是一个好的设计，只会让应用变得更复杂。在 [flux/examples/flux-chat/js/stores/MessageStore.js](https://github.com/facebook/flux/blob/master/examples/flux-chat/js/stores/MessageStore.js#L101) 这个例子中，如果删除下面这行代码，该例子仍然能很好的运行。

```js
ChatAppDispatcher.waitFor([ThreadStore.dispatchToken]);
```

当然，这里并不是说 `waitFor` 一无是处，只是它让开发者对 Flux 的理解更加困惑。

在 Ballade 中处理 Store 之间的依赖，相当简单，就像你要使用一个变量，那么你得先定义这个变量，它本来就这么简单。

```js
var storeA = dispatcher.createMutableStore(schema, {
    'example/update-title': function (store, action) {
        store.set('title', action.title);
    }
});

// 假如 storeB 依赖了 storeA
var storeB = dispatcher.createMutableStore(schema, {
    'example/update-title': function (store, action) {
        var title = storeA.get('title') + '!';
        store.set('title', title);
    }
});
```

### 例子

* Mutable [TodoMVC](https://github.com/chenmnkken/ballade/tree/master/examples/ballade-mutable-todomvc)
* Immutable [TodoMVC](https://github.com/chenmnkken/ballade/tree/master/examples/ballade-immutable-todomvc)

### 单元测试

```
$ npm install
$ npm test
```

### 构建

```
$ npm install
$ npm run build
```

### 感谢

* [Flux](https://github.com/facebook/flux)
* [Immutable](https://github.com/facebook/immutable-js/)

### License

MIT @ [Yiguo Chen](https://github.com/chenmnkken)
