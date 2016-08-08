'use strict';
var getPixels = require('get-pixels');
var savePixels = require('save-pixels');
var fs = require('fs');
var imageRotate = require('image-rotate');
var regression = require('regression');
var zeros = require('zeros');

var tmp = fs.createWriteStream('tmp.jpg');
var removeOutliers = require('./remove-outliers');

var srcFile = 'srcr.jpg';
var acceptablePercentage = 90;

function intBlack(i) {
    return i < 100;
}

function swap(points) {
    return points.map(function(xy) {return [xy[1], xy[0]];});
}

function setColour(pixels, x, y, colour) {
    x = x | 0;
    y = y | 0;
    pixels.set(x, y, 0, colour.red || 0);
    pixels.set(x, y, 1, colour.green || 0);
    pixels.set(x, y, 2, colour.blue || 0);
    pixels.set(x, y, 3, colour.alpha || 255);
}

function joinPoints(old, next) {
    for (var i = 0; i < next.length; i++) {
        old.push(next[i]);
    }
    return old;
}

function findTopEdge(points) {
    var heighestX = [];

    points.forEach(function(xy) {
        var x = xy[0];
        var y = xy[1];

        var oldVal = heighestX.find(function(xy) {return xy[0] === x;});

        if (oldVal) {
            oldVal[1] = y < oldVal[1] ? y : oldVal[1];
        } else {
            heighestX.push([x, y]);
        }
    });

    return regression('linear', heighestX);
}

function processImage(imgPath) {
    getPixels(imgPath, function(err, pixels) {
        if (err) {
            throw err;
        }
        function getRGB(x, y) {
            return (pixels.get(x, y, 0) + pixels.get(x, y, 1) + pixels.get(x, y, 2)) / 3 | 0;
        }
        function dropY(x, maxY) {
            var y = 0;
            var points = [];
            for (; y < maxY; y++) {
                if (intBlack(getRGB(x, y))) {
                    points.push([x, y]);
                    return points;
                }
            }
            return points;
        }
        function dropX(y, maxX) {
            var x = 0;
            var points = [];
            for (; x < maxX; x++) {
                if (intBlack(getRGB(x, y))) {
                    points.push([x, y]);
                }
            }
            return points;
        }

        var width = pixels.shape[0];
        var height = pixels.shape[1];

        var black = [];

        for (var x = 0; x < width; x++) {
            joinPoints(black, dropY(x, height));
        }

        var topEdge = findTopEdge(removeOutliers(black, 80));

        black.forEach(function(xy) {
            var x = xy[0];
            var y = xy[1];
            setColour(pixels, x, y, {green: 255});
        });
        topEdge.points.forEach(function(xy) {
            var x = xy[0];
            var y = xy[1];
            setColour(pixels, x, y, {red: 255});
        });

        // var outImage = zeros([width, height, 4]);
        // imageRotate(outImage, pixels, -Math.atan(topEdge.equation[0]), 0, 0);

        savePixels(pixels, 'jpeg').pipe(tmp);
    });
}

processImage(srcFile);
