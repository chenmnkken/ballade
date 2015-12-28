# Ballade

重新诠释 Flux 的应用架构，在 React 中更便捷的使用单向数据流。

## 两个版本

[ballade.js](https://github.com/chenmnkken/ballade/blob/master/dist/ballade.js) 默认情况下, Ballade 提供的 **Store** 的数据是可变的.

[ballade.immutable.js](https://github.com/chenmnkken/ballade/blob/master/dist/ballade.immutable.js) 同时也提供了另一个选择, 提供的 **Store** 的数据是不可变的, 但是需要依赖 [immutable-js](https://github.com/facebook/immutable-js).

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

**Store** 是一个数据的存储中心，提供了「写入」和「读取」数据的接口，就像一个数据的「访问器」。

在 **Views** 或 **Controller-views** （React 组件）中，只能从 **Store** 中「读取」数据，在 **Store Callbacks** 中，才能自由的「写入」和「读取」数据。

当数据变化的时候，**Store** 会发送一个数据变化的事件。

**Store** 的数据「访问器」分为 `mutable`（可变）和 `immutable`（不可变）的两种，分别对应了`mutable` 和 `immutable` 两种不同的数据结构。

---

### Actions

所有的操作，像用户的交互行为或者从服务器获取一个数据，只要会引起数据变化的操作都可以把它看作是一个 **Action**，引起数据变化的操作可以是「写入」或「更新」数据。

如果想「写入」或「更新」**Store** 中的数据，只能发起一个 **Action**。每个 **Action** 都有一个唯一的 **ActionType** 和 payload 数据，**ActionType** 可以理解为这个 **Action** 唯一的名字，payload 数据就是传递给 **Store** 的数据。

---

### Dispatcher

**Dispatcher** 用于连接 **Actions** 和 **Store** 的「调度员」，负责将 **Action** 产生的 payload 数据分发给指定的 **Store**。

---

### Actions Middleware

在传送 payload 数据到 **Store** 时，可以注册一些中间件来处理 payload 数据，每个中间件会把处理完的 payload 结果再传递给下一个中间件。假如你想从服务器取数据，可以注册一个中间件。

---

### Store Callbacks

当 **Action** 触发的时候，**Store** 需要一个与该 **Action** 对应的回调函数来处理 payload 数据，这时可以将数据写入到 **Store** 中。**ActionType** 需要与 **Store** 的回调函数名相对应。

## API

* **Dispatcher()**

用于创建一个 **Dispatcher** 的实例。

```js
var Dispatcher = require('ballade').Dispatcher;
var dispatcher = new Dispatcher();
```
---

* **dispatcher.use(middleware)**
  * `middleware` *Function*

注册一个中间件，所有 **Action** 的 payload 数据都会通过中间件，中间件可以注册多个。

```js
dispatcher.use(function (payload, next) {
    // 修改 payload.count
	if (count in payload) {
	    payload.count++;
	}

	// 在中间件中，必须执行 next 函数，
	// 这样才能将处理完的 payload 数据传递给下一个中间件
	next(payload);
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
	        next(payload);
	    });
	}
	// 如果不包含 uri 字段，则不作任何处理
	else {
	    next(payload);
	}
});
```
---

* **dispatcher.createActions(actionCreators)**
  * `actionCreators` *Object*

创建一组 **Actions**。

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

Note: **ActionType** must be unique, if application is complex, make sure the **ActionType** is unique, recommend use pseudo namespace. In `example/update-title` the `example` is namaspace.

注意: **ActionType** 必须是唯一的，如果有重名，会给出错误提示。如果一个应用比较复杂，为了确保 **ActionType** 不重复，建议使用「伪命名空间」来进行区分， 在 `example/update-title` 中，`example` 就是「伪命名空间」。

---

* **dispatcher.createMutableStore(schema, callbacks)**
  * `schema` *Object*
  * `callbacks` *Object*

创建一个「可变」的 **Store**。

`schema` 就是该 **Store** 的数据模型，只有数据的 key 在 `schema` 中，才能对其进行「写入」或「更新」数据，这可以让开发者知道该 **Store** 中有哪些数据，能让数据操作更加清晰透明。

为 **Store** 定义一组 `schema`。

```js
var schema = {
    title: null,
    meta: {
        votes: null,
        favs: null
    }
};
```

现在让我们创建一个 `exampleStore`：

```js
var exampleStore = dispatcher.createMutableStore(schema, {
    // 这就是 Store 的回调函数
    'example/update-title': function (store, action) {
        return store.mutable.set('title', action.title);
    }
});
```

`exampleStore` 用于 **Views** 或 **Controller-views**（React 组件）中，并且只能获取数据和接受数据变化的通知，不能「写入」数据（这其实屏蔽了尝试直接向 **Store** 写入和更新数据的可能）。

```js
// return title from store
exampleStore.mutable.get('title');
// no set method in exampleStore
console.log(exampleStore.mutable.set) // => undefined
```

在 `example/update-title` 的回调函数中，`store` 可以自由的「写入」和「读取」数据，并且该函数**必须返回 store「写入」或「删除」数据操作的结果**，只有这样 **Store** 才能依赖返回结果来发送数据变更的事件。

---

* **dispatcher.createImmutableStore(schema, callbacks)**
  * `schema` *Object*
  * `callbacks` *Object*

```js
var exampleStore = dispatcher.createImmutableStore(schema, {
    'example/update-title': function (store, action) {
        return store.immutable.set('title', action.title);
    }
});
```

创建一个「不可变」的 **Store**。

注意：`createImmutableStore` 只定义在了 `ballade.immutable.js` 中，并且需要依赖 [immutable-js](https://github.com/facebook/immutable-js)。

---

* **store.mutable**

「可变」数据的访问器。上面的 `exampleStore.mutable` 和 `store.mutable` 都是「可变」数据的访问器。

---

* **store.mutable.set(key, value)**
  * `key` *String*  
  * `value` *Anything*

通过访问器来「写入」数据到 **Store** 中，如果数据的 key 没有在 `schema` 中定义，操作会失败。该方法会返回「写入」数据的 key。

```js
var key = store.mutable.set('title', 'foo');
console.log(key) // => 'title'
```

注意：「写入」方法只能在 **Store** 的回调函数中使用。

---

* **store.mutable.get(key)**
  * `key` *String*  

从 **Store** 中「读取」数据，如果该数据是引用类型（对象或数组），会返回该克隆的数据。

```js
var title = store.mutable.get('title');
console.log(title) // => 'foo'

// 如果 title 是一个对象, title = { foo: 'bar' }
// 会返回 title 的克隆对象
var title = store.mutable.get('title');
console.log(title.foo) // => 'bar'

title.foo = 'baz';
console.log(title.foo) // => 'baz'

console.log(store.mutable.get('title').foo) // => 'bar'
```

* **store.mutable.delete(key)**
  * `key` *String*  

从 **Store** 中「删除」数据。

---

* **store.immutable**

「不可变」数据的访问器。上面的 `exampleStore.immutable` 和 `store.immutable` 都是「不可变」数据的访问器。

Note: `store.immutable` accessor only available `createImmutableStore`.

注意：`store.immutable` 访问器只能通过执行 `createImmutableStore` 来创建。

`store.immutable` accessor just a **Immutable** instance.

`store.immutable` 访问器只是封装了 `Immutable` 的实例，所以它包含了 `Immutable` 实例的所有原型方法。

```js
store.immutable.set
store.immutable.setIn
store.immutable.get
store.immutable.getIn
store.immutable.update
store.immutbale.updateIn
...
```

查看更多的 `Immutable` API 可以直接访问 [Immutable Document](http://facebook.github.io/immutable-js/docs/#/).

---

* **store.event.subscribe(type, handler)**
  * `type` *String* *optional*
  * `handler` *Function*

Subscribe event, `type` is event type, it is optional.

订阅 **Store** 中的数据变化的事件。`type` 就是事件类型，它是可选的，它和定义在 `schema` 中的数据 key 相对应。`hanlder` 则是数据变化的处理函数。

```js
// 如果 titile 有变化，回调函数则会执行
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

取消事件订阅，`type` 就是事件类型，它是可选的，它和定义在 `schema` 中的数据 key 相对应。`hanlder` 则是数据变化的处理函数，如果 `type` 不为空，`handler` 也是可选的。

```js
exampleStore.event.unsubscribe('title');
```

### 你其实不需要 `waitFor`

在 Flux 中，它提供了一个 `waitFor` 来处理 **Store** 之间的依赖，这并不是一个好的设计，只会让应用变得更复杂。在 [flux/examples/flux-chat/js/stores/MessageStore.js](https://github.com/facebook/flux/blob/master/examples/flux-chat/js/stores/MessageStore.js#L101) 这个例子中，如果删除下面这行代码，该例子仍然能很好的运行。

```js
ChatAppDispatcher.waitFor([ThreadStore.dispatchToken]);
```

当然，这里并不是说 `waitFor` 一无是处，只是它让开发者对 Flux 的理解更加困惑。

在 Ballade 中处理 **Store** 之间的依赖，相当简单，就像你要使用一个变量，那么你得先定义这个变量，它本来就这么简单。

```js
var storeA = dispatcher.createMutableStore(schema, {
    'example/update-title': function (store, action) {
        return store.mutable.set('title', action.title);
    }
});

// 假如 storeB 依赖了 storeA
var storeB = dispatcher.createMutableStore(schema, {
    'example/update-title': function (store, action) {
        var title = storeA.mutable.get('title') + '!';
        return store.mutable.set('title', title);
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

MIT @ [Yiguo Chan](https://github.com/chenmnkken)
