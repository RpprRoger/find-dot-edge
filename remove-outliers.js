var fs = require('fs');

function sortEntries(entryA, entryB) {
    if (entryA.percentage > entryB.percentage) {
        return -1;
    }
    return entryA.percentage < entryB.percentage ? 1 : 0;
}

module.exports = function removeOutliers(obj, acceptablePercentage) {
    var cum = {};
    var total = 0;
    var list = [];

    // this will make an entry that will store the x, y data and track how many of each value there is
    function makeEntry(key, value) {
        cum[value] = cum[value] || {
            keys: [],
            count: 0,
            value: value
        };
        ++cum[value].count;
        total++;
        cum[value].keys.push(key);
    }

    // collect values, and store away with the keys they were at
    Object.keys(obj).forEach(function(key) {
        makeEntry(key, obj[key]);
    });

    Object.keys(cum).forEach(function(value) {
        var obj = cum[value];
        obj.percentage = (obj.count / total) * 100;

        list.push(obj);
    });

    list.sort(sortEntries);

    var runningPercentageTotal = 0;
    var output = {};
    var listLength = list.length;
    var cur;
    var keysLength;
    var i;
    var j;

    for (i = 0; i < listLength; i ++) {
        cur = list[i];
        keysLength = cur.keys.length;
        for (j = 0; j < keysLength; j++) {
            output[cur.keys[j]] = cur.value;
        }
        runningPercentageTotal += cur.percentage;

        if (runningPercentageTotal >= acceptablePercentage) {
            return output;
        }
    }
}