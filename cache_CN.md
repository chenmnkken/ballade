# Store 中的缓存设计

## 缓存的使用场景

对于请求频次高的数据存储场景来说，前端适当的缓存数据，可以有效的降低对服务端的请求压力。比如在单页应用中对某个大列表进行分页加载时，大部分时候已加载过的数据不应该再发起第二次请求，这是前端缓存的便利性。

但是单页应用中如果对数据进行无限制的缓存，会导致浏览器的内存暴涨，最终耗光系统的资源。此时有限制性的缓存很有必要。通过使用 Ballade 提供的缓存模块，可以确保缓存到 store 中的数据不会无限的增长。

先定义 Schema。

```
var schema1 = new Schema({
    photo: {
    	id: String,
    	title: String,
    	width: Number,
    	height: Number
    }
});

var schema2 = new Schema({
    avatar: String,
    photos: {
        key: String,
        list: [schema1],
        total: Number
    }
});
```

对 `photos` 的数据进行限制长度的缓存，需要在创建 Store 时设置 `cache` 的配置。

```
var options = {
    cache: {
        photos: {
            id: 'key'  // 设置 key 作为缓存的唯一 id
        }
    }
};
```

在限制长度的缓存中，需要指定一个 `id` 字段，该字段的值必须确保是唯一的，如上面 `photos` 的数据就使用 `key` 这个字段来作为缓存的唯一 `id` 字段名。

创建 Store 时传上该配置即可。

```
var store = dispatcher.createImmutableStore(schema2, options, {
    'fetch-photos': (store, action) => {
        const photos = action.response.data;
        photos.key = action.key;
        // 存入 Store，并且具备缓存数据的能力
        store.set('photos', photos);
    }
});
```

在 UI View 中获取 Store 中的数据还需带上对应的数据 id。

```
const id = '001';
store.get('photos', id); => 直接输出 001 对应的数据
```

通过 `maxLength` 可以限定缓存数据的最大长度，如果超出最大长度，则会采用先进先出的策略，先清除最先缓存的数据，然后才缓存新的数据。

```
var options = {
    cache: {
        photos: {
            id: 'key'  // 设置 key 作为缓存的唯一 id
        }
    }
};
```

## 持久化的 Store

很多时候，单页应用期望能将一些数据持久化到本地，通过集成 `localStorage` 和 `sessionStorage` 就可以进行持久化的缓存。

Ballade 的缓存模块可以将数据持久化到本地，无需直接操作 `localStorage` 和 `sessionStorage`，只要在数据存储时指定 `persistence` 选项即可。

对于上面的例子来说，想对 `avatar` 的数据做本地缓存，那么缓存配置应该是这样的：

```
const options = {
    cache: {
        avatar: {
            persistence: {
                type: 'localStorage',
                prefix: 'user'
            }
        }
    }
};
```

其中 `persistence.type` 指定的持久化的类型，`persistence.prefix` 指定的持久化缓存的前缀，避免数据存储时的存储 key 的冲突。

访问缓存的数据与之前获取 Store 中的用法没有差别，应用在启动的时候会自动从本地缓存中获取持久化的数据。

```
store.get('avatar'); => 输出 avatar 的持久化缓存数据
```

**注意：** 使用 Ballade 向 `localStorage` 存储数据时非常便捷，但也需要考虑应该什么时候清除该数据，以避免持久化缓存的空间无限膨胀。

当然，持久化的缓存可以和普通的缓存结合使用。
