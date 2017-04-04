'use strict';

/* global self */

var _Immutable;

if (typeof self !== 'undefined' && self.Immutable) {
    _Immutable = self.Immutable;
}
else if (typeof global !== 'undefined' && global.Immutable) {
    _Immutable = global.Immutable;
}
else {
    _Immutable = require('immutable');
}

var keys = Object.keys;
var is = _Immutable.is;

var immutableDeepEqual = function (Component) {
    Component.prototype.shouldComponentUpdate = function (nextProps, nextState) {
        var context = this;
        var currentState = context.state;
        var currentProps = context.props;
        var nextStateKeys = keys(nextState || {});
        var nextPropsKeys = keys(nextProps || {});
        var isUpdate;

        if (nextStateKeys.length !== keys(currentState || {}).length ||
            nextPropsKeys.length !== keys(currentProps || {}).length
        ) {
            return true;
        }

        isUpdate = nextStateKeys.some(function (item) {
            return currentState[item] !== nextState[item] &&
            !is(currentState[item], nextState[item]);
        });

        return isUpdate || nextPropsKeys.some(function (item) {
            return currentProps[item] !== nextProps[item] &&
            !is(currentProps[item], nextProps[item]);
        });
    };

    return Component;
};

module.exports = immutableDeepEqual;
