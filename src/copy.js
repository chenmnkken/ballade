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
