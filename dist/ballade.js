(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Ballade = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * Ballade 1.0.0
 * author: chenmnkken@gmail.com
 * date: 2017-02-12
 * url: https://github.com/chenmnkken/ballade
 */

'use strict';

var Queue = require('./queue');
var Schema = require('./schema');
var MutableStore = require('./mutable-store');

var Ballade = {
    version: '1.0.0',
    Schema: Schema
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
            var result;
            var changeKey;

            if (typeof callback === 'function') {
                result = callback(item.store, payload);

                // Invoke mutable store callback
                if (result !== undefined) {
                    item.store.event.publish(result);
                }
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
        var self = this;
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

            actions[name] = (function(creator, actionsId) {
                return function () {
                    var args = arguments;

                    self.__dispatch__(actionsId, function (){
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
     * @param {Object} store callbacks
     * @return {Object} proxy store instance, it can not set data, only get data
     */
    createMutableStore: function (schema, callbacks) {
        if (!callbacks) {
            throw new Error('schema must in createMutableStore arguments');
        }

        var store = new MutableStore(schema);

        var proxyStore = {
            mutable: {},
            event: {}
        };

        proxyStore.mutable.get = store.mutable.get.bind(store.mutable);
        proxyStore.event.subscribe = store.event.subscribe.bind(store.event);
        proxyStore.event.unsubscribe = store.event.unsubscribe.bind(store.event);

        this.storeQueue.push({
            store: store,
            callbacks: callbacks
        });

        return proxyStore;
    }
};

Ballade.Dispatcher = Dispatcher;

module.exports = Ballade;

},{"./mutable-store":4,"./queue":5,"./schema":6}],2:[function(require,module,exports){
/*
 * Performs a deep clone of `subject`, returning a duplicate which can be
 * modified freely without affecting `subject`.
 *
 * The `originals` and `duplicates` variables allow us to copy references as
 * well, and also means we don't have to serialise any object more than once.
 * https://github.com/evlun/copy
 */
function copy (subject, originals, duplicates) {
    if (!(subject instanceof Object))
        return subject

    var type = Object.prototype.toString.call(subject).slice(8, -1),
        duplicate

    // create the base for our duplicate
    switch (type) {
        case 'Array':
            duplicate = []
            break

        case 'Date':
            duplicate = new Date(subject.getTime())
            break

        case 'RegExp':
            duplicate = new RegExp(subject)
            break

        case 'Function':
            break

        case 'Uint8Array':
        case 'Uint8ClampedArray':
        case 'Uint16Array':
        case 'Uint32Array':
        case 'Int8Array':
        case 'Int16Array':
        case 'Int32Array':
        case 'Float32Array':
        case 'Float64Array':
            duplicate = subject.subarray()
            break

        default:
            duplicate = {}
    }

    originals.push(subject)
    duplicates.push(duplicate)

    // special case for arrays
    if (subject instanceof Array) {
        for (var i = 0; i < subject.length; i++) {
            duplicate[i] = copy(subject[i], originals, duplicates)
        }
    }

    var keys = Object.keys(subject).sort(),
        skip = Object.keys(duplicate).sort()

    for (var j = 0; j < keys.length; j++) {
        var key = keys[j]

        // ignore keys in `skip`
        if (skip.length > 0 && key === skip[0]) {
            skip.shift()
            continue
        }

        if (Object.prototype.hasOwnProperty.call(subject, key)) {
            var value = subject[key],
                index = originals.indexOf(value)

            duplicate[key] = index !== -1 ? duplicates[index] : copy(subject[key], originals, duplicates)
        }
    }

    return duplicate
}

/*
 * Wrapper for `copy()`.
 */
module.exports = function(subject) {
    return copy(subject, [], [])
}

},{}],3:[function(require,module,exports){
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
    publish: function (type) {
        this.handlers.forEach(function (item) {
            if (!item.type) {
                item.handler(type);
            }
            else if (item.type === type) {
                item.handler(type);
            }
        });
    },

    /**
     * Subscribe event
     * @param {String} event type, it can be ignored
     * @param {Function} event handler
     */
    subscribe: function (type, handler) {
        var result = {};

        if (typeof type === 'function') {
            result.handler = type;
        }
        else {
            result.handler = handler;
            result.type = type;
        }

        this.handlers.push(result);
    },

    /**
     * Cancel subscribe event
     * @param {String} event type, it optional
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

            if (!item.type) {
                flag = item.handler === handler;
            }
            else {
                if (type && handler) {
                    flag = item.type === type && item.handler === handler;
                }
                else if (type) {
                    flag = item.type === type;
                }
                else if (handler) {
                    flag = item.handler === handler;
                }
            }

            if (flag) {
                this.handlers.splice(i--, 1);
            }
        }
    }
};

module.exports = Event;

},{}],4:[function(require,module,exports){
'use strict';

// @TODO 保持 console

var copy = require('./copy');
var Event = require('./event');

var baseTypes = {
    'string': true,
    'number': true,
    'null': true,
    'undefind': true,
    'boolean': true
};

/**
 * Mutable Class
 * Use to mutable object data, the instance can set/get for plain object.
 * @param {Object} store schema
 */
var _MutableStore = function (schema) {
    this.store = {};
    this.schema = schema;
    var defaultData = this.schema.defaultData;

    Object.keys(defaultData).forEach(function (item) {
        this.store[item] = defaultData[item];
    }.bind(this));
};

_MutableStore.prototype = {
    /**
     * Set data in store.
     * If the key not in schema, set operation should failed.
     * @param {String} object key
     * @param {Any} data
     * @return {String} object key
     */
    set: function (key, value) {
        var result = this.schema.validator(key, value);

        if (result.messages) {
            result.messages.forEach(function (item) {
                if (item.type === 'warning') {
                    console.warn('Schema Validation Warning: ' + item.message + ', path is `' + item.path + '`, value is ', item.originalValue);
                }
                else if (item.type === 'error') {
                    console.error('Schema Validation Error: ' + item.message + ', path is `' + item.path + '`, value is ', item.originalValue);
                }
            });
        }

        if ('value' in result) {
            this.store[key] = result.value;
            return key;
        }
    },

    /**
     * Get data from store.
     * If data is reference type, should return copies of data
     * @param {String} object key
     * @return {Any} data
     */
    get: function (key) {
        var result = this.store[key];
        var type = typeof result;

        if (baseTypes[type]) {
            return result;
        }

        return copy(result);
    },

    /**
     * Delete data from store.
     * @param {String} object key
     * @return {String} object key
     */
    delete: function (key) {
        delete this.store[key];
        return key;
    }
};

/**
 * MutableStore Class
 * @param {Object} store schema
 * var mutableStore = new MmutableStore({foo: 'bar'});
 * @mutableStore.mutable: mutableStore data
 * @mutableStore.event: Event instance
 */
var MutableStore = function (schema) {
    this.mutable = new _MutableStore(schema);
    this.event = new Event();
};

module.exports = MutableStore;

},{"./copy":2,"./event":3}],5:[function(require,module,exports){
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

},{}],6:[function(require,module,exports){
'use strict';

// @TODO 性能测试

var TYPE = '__schemaType__';
var HOOK = '__schemaTypeHook__'
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

var proxySet = function (obj, key, value, isImmutable) {
    if (isImmutable) {
        obj = obj.set(key, value);
    }
    else {
        obj[key] = value;
    }

    return obj;
};

var proxyGet = function (obj, key, isImmutable) {
    if (isImmutable) {
        return obj.get(key);
    }

    return obj[key];
};

var proxyDelete = function (obj, key, isImmutable) {
    if (isImmutable) {
        obj.delete(key);
    }
    else if (Array.isArray(obj)) {
        obj.splice(key, 1);
    }
    else {
        delete obj[key];
    }
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
        result.message = {
            path: path,
            originalValue: value,
            type: 'error',
            message: 'Value is invalid'
        };

        return result;
    }

    try {
        result.value = dataType[CONSTRUCTOR](value);
        result.message = {
            path: path,
            originalValue: value,
            type: 'warning',
            message: 'Expect type is ' + dataType[TYPE] + ', not ' + _typeof(value)
        };
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
                    if (subItem !== '$type' && data[subItem]) {
                        dataTypes[item][HOOK].push({
                            key: subItem,
                            value: data[subItem]
                        });

                        if (subItem === 'default') {
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
                result.message = 'Value convert faild for `' + itemKey + '` schema options'
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

    Object.keys(dataType).forEach(function (item) {
        // filter private property
        if (item.slice(0, 8) === '__schema') {
            return;
        }

        var itemDataType = dataType[item];
        var itemValue = proxyGet(value, item, isImmutable);
        var itemPath = path + '.' + item;
        var convertResult;
        var castResult;
        var convertResult;
        var bakValue;

        // nested data
        if (itemDataType[CONTAINER]) {
            castResult = self.validator(item, itemValue, isImmutable, itemDataType, itemPath);
            value = proxySet(value, item, castResult.value, isImmutable);

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
                    proxyDelete(value, item, isImmutable);
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

                    proxyDelete(value, item, isImmutable);
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
        var convertResult;
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

},{}]},{},[1])(1)
});