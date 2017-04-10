# Cache in Store

## Cache usage scenarios

For the high frequency data storage scenario, the cache data can effectively reduce the server request pressure. For example, in a single page web application for a large list of page loading, most of the time the data has been loaded should not be launched second requests, this is the convenience of the front-end cache.

But in single page web application, if the cache data is not limit, will cause browser memory resource consumption. Ballade cache module make sure the browser memory is controllable and limited.

Definition schema.

```
const schema1 = new Schema({
    photo: {
    	id: String,
    	title: String,
    	width: Number,
    	height: Number
    }
});

const schema2 = new Schema({
    avatar: String,
    photos: {
        key: String,
        list: [schema1],
        total: Number
    }
});
```

Limited data cache length for `photos`, when create Store need configure `cache`  options.

```
const options = {
    cache: {
        photos: {
            id: 'key'  // 'key' is unique id
        }
    }
};
```

In limited data cache length case, need specify a `id` field, and make sure the `id` is unique. Above example, the `photos` used `key` for cache unique `id` field.

When create Store just specify the `options`.

```js
const store = dispatcher.createImmutableStore(schema2, options, {
    'fetch-photos': (store, action) => {
        const photos = action.response.data;
        photos.key = action.key;
        // Stored data in Store, and the ability to cache data
        store.set('photos', photos);
    }
});
```

Get data from Store in UI Views required data id.

```
const id = '001';
store.get('photos', id); => Will output id is 001 data
```

## Persistent Store

In most cases, signle page web application expect persistent data in local. Persistent cache just used `localStorage` or `sessionStorage`.

Ballade cache module can persistent data in local, don't operation `localStorage ` or `sessionStorage`, only specify `persistence` option.

For above example, will cache `avatar` data in local, just configure below.

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

`persistence.type` is persistence cache type, `persistence.prefix` is persistence cache prefix, make sure the key is unique.

Get data from cache same as common methods of use. When application is startup, the data will get data from localStorage.

```
store.get('avatar'); => Output avatar persistence cache
```

> **Notice:** When used Ballade storage data to `localStorage`, think about what time to clear the data, avoid persistence cache is limited.

Of cause, persistence cache and common cache can simultaneous use.

