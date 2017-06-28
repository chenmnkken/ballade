(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Ballade = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

// accessor for mutable/immutable data

var accessor = {
    set: function (obj, key, value, isImmutable) {
        if (value !== undefined && value !== null) {
            if (isImmutable) {
                obj = obj.set(key, value);
            }
            else {
                obj[key] = value;
            }
        }

        return obj;
    },

    get: function (obj, key, isImmutable) {
        if (isImmutable) {
            return obj.get(key);
        }

        return obj[key];
    },

    'delete': function (obj, key, isImmutable) {
        if (isImmutable) {
            obj = obj.delete(key);
        }
        else if (Array.isArray(obj)) {
            obj = obj.splice(key, 1);
        }
        else {
            delete obj[key];
        }

        return obj;
    }
};

module.exports = accessor;

},{}],2:[function(require,module,exports){
/**
 * Ballade 1.0.3
 * author: chenmnkken@gmail.com
 * date: 2017-06-28
 * url: https://github.com/chenmnkken/ballade
 */

'use strict';

var Queue = require('./queue');
var Schema = require('./schema');
var MutableStore = require('./store');
var bindStore = require('./bindstore');

var Ballade = {
    version: '1.0.3',
    Schema: Schema,
    bindStore: bindStore
};

/**
 * Dispatcher Class
 */
var Dispatcher = function () {
    this.actionTypes = {};
    this.storeQueue = [];
    this.id = Date.now() + Math.round(Math.random() * 1000);

    this.middlewareQueue = new Queue(function (payload) {
        this.__invokeCallback__(payload);
    }.bind(this), true);
};

Dispatcher.prototype = {
    /**
     * When middleware queue is done, then invoke Store callbacks
     * @param {Object} Action payload
     */
    __invokeCallback__: function (payload) {
        this.storeQueue.forEach(function (item) {
            var callback = item.callbacks[payload.type];

            if (typeof callback === 'function') {
                callback(item.store, payload);
            }
        });
    },

    /**
     * Register action middleware
     * Middleware use to process action payload
     * @param {Function} middleware function
     */
    use: function (middleware) {
        if (typeof middleware === 'function') {
            this.middlewareQueue.enter(middleware);
        }
    },

    /**
     * Dispatch Action
     * Dispatch Action to Store callback
     * @param {String} actionsId is make sure every action type do not duplicate
     * @param {Object} action
     */
    __dispatch__: function (actionsId, action) {
        var payload = action();
        var actionTypes = this.actionTypes;
        var actionType = payload.type;
        var lastActionsId;

        if (!actionType) {
            throw new Error('action type does not exist in \n' + JSON.stringify(payload, null, 2));
        }

        lastActionsId = actionTypes[actionType];

        if (!lastActionsId) {
            actionTypes[actionType] = actionsId;
        }
        else if (lastActionsId !== actionsId) {
            throw new Error('action type "' + actionType + '" is duplicate');
        }

        this.middlewareQueue.execute(payload);
    },

    /**
     * Create Actions
     * @param {String} action creators
     * @return {Object} Actions
     */
    createActions: function (actionCreators) {
        // actionsId is make sure every action type do not duplicate
        var actionsId = (this.id++).toString(32);
        var self = this;
        var name;
        var creator;
        var actions = {};

        for (name in actionCreators) {
            creator = actionCreators[name];

            actions[name] = (function (creator, actionsId) {
                return function () {
                    var args = arguments;

                    self.__dispatch__(actionsId, function () {
                        return creator.apply(null, Array.prototype.slice.call(args));
                    });
                };
            })(creator, actionsId);
        }

        return actions;
    },

    /**
     * Create mutable store
     * @param {Object} store schema
     * @param {Object} store options
     * @param {Object} store callbacks
     * @return {Object} proxy store instance, it can not set data, only get data
     */
    createMutableStore: function (schema, options, callbacks) {
        if (!callbacks) {
            callbacks = options;
            options = null;
        }

        var store = new MutableStore(schema, options);

        var proxyStore = {
            get: store.get.bind(store),
            publish: store.publish.bind(store),
            subscribe: store.subscribe.bind(store),
            unsubscribe: store.unsubscribe.bind(store)
        };

        this.storeQueue.push({
            store: store,
            callbacks: callbacks
        });

        return proxyStore;
    }
};

Ballade.Dispatcher = Dispatcher;

module.exports = Ballade;

},{"./bindstore":3,"./queue":8,"./schema":9,"./store":10}],3:[function(require,module,exports){
'use strict';

var bindStore = function (Component, store, callbacks) {
    var originComponentDidMount = Component.prototype.componentDidMount;
    var originComponentWillUnmount = Component.prototype.componentWillUnmount;
    var newCallbacks = {};
    var callbacksArr = Object.keys(callbacks);

    Component.prototype.componentDidMount = function (args) {
        var self = this;

        callbacksArr.forEach(function (item) {
            newCallbacks[item] = callbacks[item].bind(self);
            store.subscribe(item, newCallbacks[item]);
        });

        if (typeof originComponentDidMount === 'function') {
            originComponentDidMount.apply(self, args);
        }
    };

    Component.prototype.componentWillUnmount = function (args) {
        var self = this;

        callbacksArr.forEach(function (item) {
            store.unsubscribe(item, newCallbacks[item]);
        });

        if (typeof originComponentWillUnmount === 'function') {
            originComponentWillUnmount.apply(self, args);
        }
    };

    return Component;
};

module.exports = bindStore;

},{}],4:[function(require,module,exports){
'use strict';

// simple cache module
// @TODO add expires options

var accessor = require('./accessor');
var proxyGet = accessor.get;

var MAX_LENGTH = 20;

var Cache = function (options) {
    if (!options.id) {
        throw new Error('Cache must set a ' + options.id);
    }

    this.id = options.id;
    this.maxLength = options.maxLength || MAX_LENGTH;
    this.cacheStore = [];
};

Cache.prototype = {
    set: function (value, fresh, isImmutable) {
        var idKey = this.id;
        var cacheStore = this.cacheStore;
        var length = cacheStore.length;

        // update cache
        if (fresh) {
            cacheStore.some(function (item, i) {
                if (proxyGet(item, idKey, isImmutable) === proxyGet(value, idKey, isImmutable)) {
                    cacheStore[i] = value;
                    return true;
                }
            });
        }
        // push cache
        else {
            // limit length
            if (length === this.maxLength) {
                cacheStore.shift();
            }

            cacheStore.push(value);
        }
    },

    get: function (id, isImmutable) {
        var cacheStore = this.cacheStore;
        var i = cacheStore.length - 1;
        var idKey = this.id;
        var idValue = id;
        var item;

        for (; i > -1; i--) {
            item = cacheStore[i];
            if (proxyGet(item, idKey, isImmutable) === idValue) {
                return item;
            }
        }
    },

    'delete': function (id, isImmutable) {
        var cacheStore = this.cacheStore;
        var i = cacheStore.length - 1;
        var idKey = this.id;
        var idValue = id;
        var item;

        for (; i > -1; i--) {
            item = cacheStore[i];
            if (proxyGet(item, idKey, isImmutable) === idValue) {
                cacheStore.splice(i, 1);
                break;
            }
        }
    }
};

module.exports = Cache;

},{"./accessor":1}],5:[function(require,module,exports){
/*
 * Performs a deep clone of `subject`, returning a duplicate which can be
 * modified freely without affecting `subject`.
 *
 * The `originals` and `duplicates` variables allow us to copy references as
 * well, and also means we don't have to serialise any object more than once.
 * https://github.com/evlun/copy
 */
function copy (subject, originals, duplicates) {
    if (!(subject instanceof Object)) {
        return subject;
    }

    var type = Object.prototype.toString.call(subject).slice(8, -1);
    var duplicate;

    // create the base for our duplicate
    switch (type) {
        case 'Array':
            duplicate = [];
            break;

        case 'Date':
            duplicate = new Date(subject.getTime());
            break;

        case 'RegExp':
            duplicate = new RegExp(subject);
            break;

        case 'Function':
            break;

        case 'Uint8Array':
        case 'Uint8ClampedArray':
        case 'Uint16Array':
        case 'Uint32Array':
        case 'Int8Array':
        case 'Int16Array':
        case 'Int32Array':
        case 'Float32Array':
        case 'Float64Array':
            duplicate = subject.subarray();
            break;

        default:
            duplicate = {};
    }

    originals.push(subject);
    duplicates.push(duplicate);

    // special case for arrays
    if (subject instanceof Array) {
        for (var i = 0; i < subject.length; i++) {
            duplicate[i] = copy(subject[i], originals, duplicates);
        }
    }

    var keys = Object.keys(subject).sort();
    var skip = Object.keys(duplicate).sort();

    for (var j = 0; j < keys.length; j++) {
        var key = keys[j];

        // ignore keys in `skip`
        if (skip.length > 0 && key === skip[0]) {
            skip.shift();
            continue;
        }

        if (Object.prototype.hasOwnProperty.call(subject, key)) {
            var value = subject[key];
            var index = originals.indexOf(value);

            duplicate[key] = index !== -1 ? duplicates[index] : copy(subject[key], originals, duplicates);
        }
    }

    return duplicate;
};

/*
 * Wrapper for `copy()`.
 */
module.exports = function (subject) {
    return copy(subject, [], []);
};

},{}],6:[function(require,module,exports){
'use strict';

/**
 * Mini Event Class
 */
var Event = function () {
    this.handlers = [];
};

Event.prototype = {
    /**
     * Publish event
     * @param {String} event type
     */
    publish: function (type, value) {
        this.handlers.forEach(function (item) {
            if (item.type === type) {
                item.handler(value);
            }
        });
    },

    /**
     * Subscribe event
     * @param {String} event type
     * @param {Function} event handler
     */
    subscribe: function (type, handler) {
        this.handlers.push({
            type: type,
            handler: handler
        });
    },

    /**
     * Cancel subscribe event
     * @param {String} event type
     * @param {Function} event handler
     */
    unsubscribe: function (type, handler) {
        if (typeof type === 'function') {
            handler = type;
            type = null;
        }

        var i = 0;
        var item;
        var flag = false;

        for (; i < this.handlers.length; i++) {
            item = this.handlers[i];

            if (type && handler) {
                flag = item.type === type && item.handler === handler;
            }
            else if (type) {
                flag = item.type === type;
            }
            else if (handler) {
                flag = item.handler === handler;
            }

            if (flag) {
                this.handlers.splice(i--, 1);
            }
        }
    }
};

module.exports = Event;

},{}],7:[function(require,module,exports){
'use strict';

// persistence for localStorage / sessionStorage
var PREFIX = 'Ballade.';

var baseTypes = {
    'string': true,
    'number': true,
    'null': true,
    'undefind': true,
    'boolean': true
};

var persistence = {
    set: function (key, value, type, isImmutable) {
        if (type !== 'localStorage' && type !== 'sessionStorage') {
            throw new Error('persistence params must be set localStorage or sessionStorage');
        }

        key = PREFIX + key;
        var valueType = typeof value;

        if (baseTypes[valueType]) {
            value += '';
        }
        else {
            if (isImmutable) {
                value = value.toJS();
            }

            value = JSON.stringify(value);
        }

        value = valueType + '@' + value;
        window[type].setItem(key, value);
    },

    get: function (key, type) {
        if (type !== 'localStorage' && type !== 'sessionStorage') {
            throw new Error('persistence type must be set localStorage or sessionStorage');
        }

        key = PREFIX + key;
        var value = window[type].getItem(key);

        if (!value) {
            return;
        }

        var index = value.indexOf('@');
        var valueType = value.slice(0, index);

        value = value.slice(index + 1);

        if (baseTypes[valueType]) {
            return value;
        }

        return JSON.parse(value);
    },

    'delete': function (key, type) {
        if (type !== 'localStorage' && type !== 'sessionStorage') {
            throw new Error('persistence type must be set localStorage or sessionStorage');
        }

        key = PREFIX + key;
        window[type].removeItem(key);
    }
};

module.exports = persistence;

},{}],8:[function(require,module,exports){
'use strict';

/**
 * Mini Queue Class
 * @param {Function} complete callback,
 * when queue is done, then invoke complete callback
 * @param {Boolean} whether execute workflow of loop
 */
var Queue = function (completeCallback, loop) {
    this.workflows = [];
    this.completeCallback = completeCallback;

    if (loop) {
        this._workflows = [];
    }
};

Queue.prototype = {
    /**
     * Enter queue
     * @param {Function} workflow function
     */
    enter: function (workflow) {
        this.workflows.push(workflow);

        // Backup workflow
        if (this._workflows) {
            this._workflows.push(workflow);
        }
    },

    /**
     * Execute workflow
     * @param {Object} workflow function data required
     */
    execute: function (data, workflows) {
        workflows = workflows || this.workflows.concat();
        var workflow;

        if (workflows.length) {
            workflow = workflows.shift();
            workflow(data, this.execute.bind(this, data, workflows));
        }
        else {
            // Get backup, begin loop
            if (this._workflows) {
                this.workflows = this._workflows.concat();
            }

            workflows = null;
            this.completeCallback(data);
        }
    }
};

module.exports = Queue;

},{}],9:[function(require,module,exports){
'use strict';

// @TODO String hooks add email、url
// @TODO Array unique

var accessor = require('./accessor');
var proxySet = accessor.set;
var proxyGet = accessor.get;
var proxyDelete = accessor.delete;

var TYPE = '__schemaType__';
var HOOK = '__schemaTypeHook__';
var CONTAINER = '__schemaContainer__';
var ITEM = '__schemaItem__';
var CONSTRUCTOR = '__schemaConstructor__';
var CHILD = '__schemaChild__';

var toString = Object.prototype.toString;

var _typeof = function (subject, isImmutable) {
    // immutable data covert to mutable data before type detect
    if (isImmutable && typeof subject.toJS === 'function') {
        subject = subject.toJS();
    }

    return toString.call(subject).slice(8, -1);
};

var valueConvertHooks = {
    $required: function (value) {
        return value;
    },

    $default: function (value, defaultValue) {
        if (value === null || value === undefined) {
            if (_typeof(defaultValue) === 'Function') {
                return defaultValue();
            }
            return defaultValue;
        }

        return value;
    },

    $validate: function (value, validateFn) {
        return validateFn(value);
    },

    'String': {
        $lowercase: function (value) {
            return value.toLowerCase();
        },

        $uppercase: function (value) {
            return value.toUpperCase();
        },

        $trim: function (value) {
            return value.trim();
        },

        $match: function (value, regexp) {
            if (_typeof(regexp) !== 'RegExp') {
                throw new Error('Schema Options Error: `match` property must be RegExp');
            }

            if (regexp.test(value)) {
                return value;
            }
        },

        $enum: function (value, enumArray) {
            if (!Array.isArray(enumArray) || !enumArray.length) {
                throw new Error('Schema Options Error: `enum` must be correct Array');
            }

            if (~enumArray.indexOf(value)) {
                return value;
            }
        }
    },

    'Number': {
        $min: function (value, minValue) {
            if (value >= minValue) {
                return value;
            }
        },

        $max: function (value, maxValue) {
            if (value <= maxValue) {
                return value;
            }
        }
    }
};

valueConvertHooks.Date = valueConvertHooks.Number;

var typecast = function (path, value, dataType) {
    var result = {};

    if (value === null || value === undefined) {
        return result;
    }

    try {
        result.value = dataType[CONSTRUCTOR](value);

        if (dataType[TYPE] !== 'Date') {
            result.message = {
                path: path,
                originalValue: value,
                type: 'warning',
                message: 'Expect type is ' + dataType[TYPE] + ', not ' + _typeof(value)
            };
        }
    }
    catch (ex) {
        result.message = {
            path: path,
            originalValue: value,
            type: 'error',
            message: 'Cast to ' + dataType[TYPE] + ' failed, ' + ex.message
        };
    }

    if (dataType[TYPE] === 'Number') {
        if (!isFinite(result.value)) {
            result.message = {
                path: path,
                originalValue: value,
                type: 'error',
                message: 'Cast to ' + dataType[TYPE] + ' failed'
            };

            delete result.value;
        }
    }
    else if (dataType[TYPE] === 'String') {
        if (typeof value === 'object') {
            result.message = {
                path: path,
                originalValue: value,
                type: 'error',
                message: 'Cast to ' + dataType[TYPE] + ' failed'
            };

            delete result.value;
        }
    }

    return result;
};

var createDataTypes = function (schemaData, dataTypes, defaultData) {
    // nested array
    var isArray = Array.isArray(schemaData);
    var _schemaData = isArray ? schemaData.slice(0, 1) : Object.keys(schemaData);

    _schemaData.forEach(function (item) {
        var data = isArray ? item : schemaData[item];
        item = isArray ? ITEM : item;
        dataTypes[item] = {};

        // basic schema type
        // data: String
        if (typeof data === 'function') {
            dataTypes[item][TYPE] = data.name;
            dataTypes[item][CONSTRUCTOR] = data;
        }
        // array schema type
        // data: [String]
        else if (Array.isArray(data)) {
            dataTypes[item][CONTAINER] = 'Array';
            if (!data.length) {
                dataTypes[item][TYPE] = 'Mixed';
                return;
            }

            defaultData[item] = [];
            createDataTypes(data, dataTypes[item], defaultData[item]);
        }
        // object schema type
        // data: { item: String }
        else if (_typeof(data) === 'Object') {
            if (!Object.keys(data).length) {
                dataTypes[item][TYPE] = 'Mixed';
                return;
            }

            if (typeof data.$type === 'function') {
                dataTypes[item][TYPE] = data.$type.name;
                dataTypes[item][CONSTRUCTOR] = data.$type;
                dataTypes[item][HOOK] = [];

                // regist hooks
                Object.keys(data).forEach(function (subItem) {
                    // filter false hook
                    if (subItem !== '$type' && (subItem === '$default' || data[subItem])) {
                        dataTypes[item][HOOK].push({
                            key: subItem,
                            value: data[subItem]
                        });

                        if (subItem === '$default') {
                            if (_typeof(data[subItem]) === 'Function') {
                                if (item === ITEM) {
                                    defaultData.push(data.$default());
                                }
                                else {
                                    defaultData[item] = data.$default();
                                }
                            }
                            else {
                                if (item === ITEM) {
                                    defaultData.push(data.$default);
                                }
                                else {
                                    defaultData[item] = data.$default;
                                }
                            }
                        }
                    }
                });

                if (!dataTypes[item][HOOK].length) {
                    delete dataTypes[item][HOOK];
                }
            }
            // nested schema
            else if (data instanceof Schema) {
                dataTypes[item][TYPE] = 'Schema';
                dataTypes[item][CHILD] = data;

                if (item === ITEM) {
                    // If object is empty don't push to Array/List
                    if (Object.keys(data.defaultData).length) {
                        defaultData.push(data.defaultData);
                    }
                }
                else {
                    defaultData[item] = data.defaultData;
                }
            }
            else {
                dataTypes[item][CONTAINER] = 'Object';
                defaultData[item] = {};
                createDataTypes(data, dataTypes[item], defaultData[item]);
            }
        }
        else {
            throw new Error('Set `' + item + '` schema error, may be forget set `$type` property or `type Constructor Function`');
        }
    });
};

var valueConverter = function (value, dataType) {
    var result = {};
    var type = dataType[TYPE];

    dataType[HOOK].forEach(function (item) {
        if (result.message) {
            return;
        }

        var itemKey = item.key;
        var itemValue = item.value;
        var converter = valueConvertHooks[itemKey] || valueConvertHooks[type][itemKey];

        if (converter) {
            value = converter(value, itemValue);

            if (value === undefined) {
                result.message = 'Value convert faild for `' + itemKey + '` schema options';
            }
        }
    });

    result.value = value;
    return result;
};

var objectValidator = function (value, dataType, path, isImmutable) {
    var result = {};
    var messages = [];
    var self = this;
    var schemaKeysLength = 0;
    // var valueKeysLength = valueKeys.length;
    var valueKeys;

    // Object.keys(value).forEach(function (item) {
    Object.keys(dataType).forEach(function (item) {
        // filter private property
        if (item.slice(0, 8) === '__schema') {
            return;
        }

        schemaKeysLength++;

        // If the key not in Schema, delete it
        // if (!(item in dataType)) {
        //     delete value[item];
        //     return;
        // }

        var itemDataType = dataType[item];
        var itemValue = proxyGet(value, item, isImmutable);
        var itemPath = path + '.' + item;
        var convertResult;
        var castResult;
        var bakValue;

        // nested data
        if (itemDataType[CONTAINER]) {
            castResult = self.validator(item, itemValue, isImmutable, itemDataType, itemPath);

            if ('value' in castResult) {
                value = proxySet(value, item, castResult.value, isImmutable);
            }

            if (castResult.messages) {
                messages = messages.concat(castResult.messages);
            }
        }
        else {
            if (itemValue !== undefined && _typeof(itemValue) !== itemDataType[TYPE]) {
                castResult = typecast(itemPath, itemValue, itemDataType);

                if ('value' in castResult) {
                    value = proxySet(value, item, castResult.value, isImmutable);
                }
                else {
                    value = proxyDelete(value, item, isImmutable);
                }

                if (castResult.message) {
                    messages.push(castResult.message);
                }
            }

            if (itemDataType[HOOK]) {
                bakValue = proxyGet(value, item, isImmutable);
                convertResult = valueConverter(bakValue, itemDataType);
                value = proxySet(value, item, convertResult.value, isImmutable);

                if (convertResult.message) {
                    messages.push({
                        path: itemPath,
                        originalValue: bakValue,
                        type: 'error',
                        message: convertResult.message
                    });

                    value = proxyDelete(value, item, isImmutable);
                }
            }
        }
    });

    if (isImmutable) {
        value.forEach(function(_, item) {
            // If the key not in Schema, delete it
            if (!(item in dataType)) {
                value = proxyDelete(value, item, true);
            }
        });
    }
    else {
        valueKeys = Object.keys(value);

        if (valueKeys.length > schemaKeysLength) {
            valueKeys.forEach(function (item) {
                // If the key not in Schema, delete it
                if (!(item in dataType)) {
                    delete value[item];
                }
            });
        }

        valueKeys = null;
    }

    result.value = value;

    if (messages.length) {
        result.messages = messages;
    }

    return result;
};

var arrayValidator = function (value, dataType, path, isImmutable) {
    var result = {};
    var messages = [];
    var self = this;
    var itemDataType = dataType[ITEM];
    var containerType = itemDataType[CONTAINER];
    var itemType = itemDataType[TYPE];
    var itemChild = itemDataType[CHILD];
    var itemHook = itemDataType[HOOK];

    value.forEach(function (item, i) {
        var hasValue = true;
        var itemPath = path + '[' + i + ']';
        var convertResult;
        var castResult;
        var bakValue;
        var validationResult;

        // nested data
        if (containerType) {
            castResult = self.validator(ITEM, item, isImmutable, itemDataType, itemPath);
            value = proxySet(value, i, castResult.value, isImmutable);

            if (castResult.messages) {
                messages = messages.concat(castResult.messages);
            }
        }
        else {
            if (itemType === 'Schema') {
                validationResult = objectValidator.call(self, item, itemChild.dataTypes, itemPath, isImmutable);

                if ('value' in validationResult) {
                    value = proxySet(value, i, validationResult.value, isImmutable);
                }

                if ('messages' in validationResult) {
                    messages = messages.concat(validationResult.messages);
                }
            }
            else {
                if (_typeof(item) !== itemType) {
                    castResult = typecast(itemPath, item, itemDataType);

                    if ('value' in castResult) {
                        value = proxySet(value, i, castResult.value, isImmutable);
                    }
                    else {
                        proxyDelete(value, i, isImmutable);
                        hasValue = false;
                    }

                    if (castResult.message) {
                        messages.push(castResult.message);
                    }
                }

                if (hasValue && itemHook) {
                    bakValue = proxyGet(value, i, isImmutable);
                    convertResult = valueConverter(bakValue, itemDataType);
                    value = proxySet(value, i, convertResult.value, isImmutable);

                    if (convertResult.message) {
                        messages.push({
                            path: itemPath,
                            originalValue: bakValue,
                            type: 'error',
                            message: convertResult.message
                        });

                        proxyDelete(value, i, isImmutable);
                    }
                }
            }
        }
    });

    result.value = value;

    if (messages.length) {
        result.messages = messages;
    }

    return result;
};

var basicValidator = function (value, dataType, path) {
    var result = {};
    var messages = [];
    var type = _typeof(value);
    var convertResult;
    var castResult;

    if (dataType[TYPE] === type) {
        result.value = value;
    }
    else {
        castResult = typecast(path, value, dataType);

        if ('value' in castResult) {
            result.value = castResult.value;
        }

        if (castResult.message) {
            messages.push(castResult.message);
        }
    }

    if ('value' in result && dataType[HOOK]) {
        convertResult = valueConverter(result.value, dataType);
        result.value = convertResult.value;

        if (convertResult.message) {
            messages.push({
                path: path,
                originalValue: result.value,
                type: 'error',
                message: convertResult.message
            });

            delete result.value;
        }
    }

    if (messages.length) {
        result.messages = messages;
    }

    return result;
};

var Schema = function (schemaData) {
    if (_typeof(schemaData) !== 'Object') {
        throw new Error('Schema type must be plain Object');
    }

    this.dataTypes = {};
    this.defaultData = {};

    createDataTypes(schemaData, this.dataTypes, this.defaultData);
};

Schema.prototype = {
    validator: function (key, value, isImmutable, dataType, path) {
        dataType = dataType || this.dataTypes[key];
        path = path || key;

        if (value === undefined) {
            return {};
        }

        var containerType = dataType[CONTAINER];
        var type = _typeof(value, isImmutable);

        if (!dataType) {
            return [{
                path: path,
                originalValue: value,
                type: 'error',
                message: 'Not declared in Schema'
            }];
        }

        if (dataType[TYPE] === 'Mixed') {
            return {
                value: value
            };
        }

        if (dataType[TYPE] === 'Schema') {
            return objectValidator.call(this, value, dataType[CHILD].dataTypes, path, isImmutable);
        }

        if (containerType === 'Array' && type === 'Array') {
            return arrayValidator.call(this, value, dataType, path, isImmutable);
        }

        if (containerType === 'Object' && type === 'Object') {
            return objectValidator.call(this, value, dataType, path, isImmutable);
        }

        return basicValidator.call(this, value, dataType, path);
    }
};

module.exports = Schema;

},{"./accessor":1}],10:[function(require,module,exports){
'use strict';

var toString = Object.prototype.toString;
var copy = require('./copy');
var Event = require('./event');
var Cache = require('./cache');
var persistence = require('./persistence');

var baseTypes = {
    'string': true,
    'number': true,
    'null': true,
    'undefind': true,
    'boolean': true
};

var _typeof = function (subject) {
    return toString.call(subject).slice(8, -1);
};

var outputImmutableData = function (data, _Immutable) {
    var type = _typeof(data);

    if (type === 'Array' || type === 'Object') {
        return _Immutable.fromJS(data);
    }

    return data;
};

/**
 * Store Class
 * @param {Object} store schema
 * @param {Object} store options
 * options.cache set cache in store
 * options.error schema validator error
 * var Store = new MStore({foo: 'bar'});
 * @Store.mutable: Store data
 * @Store.event: Event instance
 */
var Store = function (schema, options, _Immutable) {
    Event.call(this);
    options = options || {};

    var defaultData = schema.defaultData;
    var cacheOptions = options.cache;
    var self = this;

    this.store = {};
    this.cache = {};
    this.schema = schema;
    this.Immutable = _Immutable;
    this.options = options;

    Object.keys(schema.dataTypes).forEach(function (key) {
        var hasCache = cacheOptions && key in cacheOptions;
        var hasIdCache = false;
        var value;

        if (hasCache && cacheOptions[key].id) {
            self.cache[key] = new Cache(cacheOptions[key]);
            hasIdCache = true;
        }

        if (hasCache && cacheOptions[key].persistence) {
            value = persistence.get(cacheOptions[key].persistence.prefix + '.' + key, cacheOptions[key].persistence.type);
        }

        if (!value) {
            value = defaultData[key];
        }

        if (value) {
            if (_Immutable) {
                value = outputImmutableData(value, _Immutable);
            }

            if (hasIdCache) {
                self.cache[key].set(value, false, !!_Immutable);
            }
            else {
                self.store[key] = value;
            }
        }
    });
};

Store.prototype = Object.create(Event.prototype, {
    constructor: {
        value: Store,
        enumerable: false,
        writable: true,
        configurable: true
    }
});

/**
 * Set data in store.
 * If the key not in schema, set operation should failed.
 * @param {String} object key
 * @param {Any} data
 * @param {Boolean} whether update cache
 * @return {String} object key
 */
Store.prototype.set = function (key, value, fresh) {
    var options = this.options;
    var cacheOptions = options.cache;
    var isImmutable = this.Immutable && _typeof(value.toJS) === 'Function';
    var result = this.schema.validator(key, value, isImmutable);
    var errors = [];
    var newValue;

    if (result.messages) {
        result.messages.forEach(function (item) {
            if (item.type === 'warning') {
                console.warn('Schema Validation Warning: ' + item.message + ', path is `' + item.path + '`, value is ', item.originalValue);
            }
            else if (item.type === 'error') {
                console.error('Schema Validation Error: ' + item.message + ', path is `' + item.path + '`, value is ', item.originalValue);
                errors.push(item);
            }
        });

        if (options && options.error) {
            options.error({
                key: key,
                type: 'SCHEMA_VALIDATION_ERROR',
                messages: errors
            }, this);
        }
    }

    if ('value' in result) {
        if (this.Immutable) {
            newValue = isImmutable ? result.value : outputImmutableData(result.value, this.Immutable);
        }
        else {
            newValue = result.value;
        }

        if (key in this.cache) {
            this.cache[key].set(newValue, fresh, isImmutable);
        }
        else {
            this.store[key] = newValue;
        }

        if (cacheOptions && cacheOptions[key] && cacheOptions[key].persistence) {
            persistence.set(
                cacheOptions[key].persistence.prefix + '.' + key,
                newValue,
                cacheOptions[key].persistence.type,
                isImmutable
            );
        }

        this.publish(key, newValue);
        return key;
    }
};

/**
 * Get data from store.
 * If data is reference type, should return copies of data
 * @param {String} object key
 * @param {String} Cache id
 * @return {Any} data
 */
Store.prototype.get = function (key, id) {
    var isImmutable = !!this.Immutable;
    var result;
    var type;

    if (key in this.cache) {
        if (id) {
            result = this.cache[key].get(id, isImmutable);
        }
        else {
            result = this.cache[key].cacheStore;
        }
    }
    else {
        result = this.store[key];
    }

    if (isImmutable) {
        return result;
    }

    type = typeof result;

    if (baseTypes[type]) {
        return result;
    }

    return copy(result);
};

/**
 * Delete data from store.
 * @param {String} object key
 * @param {String} Cache id
 * @return {String} object key
 */
Store.prototype.delete = function (key, id) {
    var cacheOptions = this.options.cache;

    if (id && key in this.cache) {
        this.cache[key].delete(id, !!this.Immutable);
    }
    else {
        delete this.store[key];
    }

    if (cacheOptions && cacheOptions[key] && cacheOptions[key].persistence) {
        persistence.delete(
            cacheOptions[key].persistence.prefix + '.' + key,
            cacheOptions[key].persistence.type
        );
    }

    return key;
};

module.exports = Store;

},{"./cache":4,"./copy":5,"./event":6,"./persistence":7}]},{},[2])(2)
});