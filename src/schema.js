'use strict';

// @TODO String hooks add email、url
// @TODO Array unique
// @TODO Mixed type distinguish Object and Array Container

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
        if (dataType[TYPE] !== 'Date') {
            result.message = {
                path: path,
                originalValue: value,
                type: 'warning',
                message: 'Expect type is ' + dataType[TYPE] + ', not ' + _typeof(value)
            };

            result.value = dataType[CONSTRUCTOR](value);
        }
        // Date must add new
        else {
            result.value = new Date(value);
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
            if (data.name === 'Array' || data.name === 'Object') {
                dataTypes[item][TYPE] = 'Mixed';
                return;
            }

            dataTypes[item][TYPE] = data.name;
            dataTypes[item][CONSTRUCTOR] = data;
        }
        // array schema type
        // data: [String]
        else if (Array.isArray(data)) {
            if (!data.length) {
                dataTypes[item][TYPE] = 'Mixed';
                return;
            }

            dataTypes[item][CONTAINER] = 'Array';
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
                if (data.$type.name === 'Array' || data.$type.name === 'Object') {
                    dataTypes[item][TYPE] = 'Mixed';
                    return;
                }

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
    var valueKeys;

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
            if (itemValue !== undefined && itemDataType[TYPE] !== 'Mixed' && _typeof(itemValue) !== itemDataType[TYPE]) {
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
        value.forEach(function (_, item) {
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
