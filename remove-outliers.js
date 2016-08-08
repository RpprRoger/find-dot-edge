var fs = require('fs');

function sortEntries(entryA, entryB) {
    if (entryA.percentage > entryB.percentage) {
        return -1;
    }
    return entryA.percentage < entryB.percentage ? 1 : 0;
}

module.exports = function removeOutliers(arrayOfPoints, acceptablePercentage, targetAxis) {
    var cum = {};
    var total = arrayOfPoints.length;

    targetAxis = targetAxis || 'y';

    // this will make an entry that will store the x, y data and track how many of each value there is
    function makeEntry(x, y, i) {
        var value, key;

        if (targetAxis === 'y') {
            key = x;
            value = y;
        } else {
            value = x;
            key = y;
        }

        cum[value] = cum[value] || {
            // keep the keys and value data so we can re-inflate the array of points later
            keys: [],
            count: 0,
            value: value
        };

        cum[value].percentage = (++cum[value].count / total) * 100;
        cum[value].keys.push({k: key, i: i});
    }

    // collect values, and store away with the keys they were at
    arrayOfPoints.forEach(function(xy, i) {
        makeEntry(xy[0], xy[1], i);
    });

    //
    var list = Object.keys(cum).map(function(key) {
        return cum[key];
    });

    list.sort(sortEntries);

    var runningPercentageTotal = 0;
    var output = [];
    var listLength = list.length;
    var cur;
    var otherAxis;
    var keysLength;
    var i;
    var j;

    for (i = 0; i < listLength; i ++) {
        cur = list[i];
        keysLength = cur.keys.length;
        for (j = 0; j < keysLength; j++) {
            otherAxis = cur.keys[j];
            // re-insert them into the output at the original indexes
            if (targetAxis === 'y') {
                output[otherAxis.i] = [otherAxis.k, cur.value];
            } else {
                output[otherAxis.i] = [cur.value, otherAxis.k];
            }
        }
        runningPercentageTotal += cur.percentage;
        if (runningPercentageTotal >= acceptablePercentage) {
            // filter out the undefined values in the array
            return output.filter(Boolean);
        }
    }
}