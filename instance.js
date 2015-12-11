var fs = require('fs');
var parse = require('csv-parse');

var PositionStream = require('./lib/position/PositionStream');
var FilterStream = require('./lib/filter/FilterStream');
var FilterData = require('./lib/filter/FilterData');
var Classification = require('./lib/classification/Classification');
var ClassificationStream = require('./lib/classification/ClassificationStream');
var SaveStream = require('./lib/save/SaveStream');

function instance(file, service, config) {
    var filterStream = new FilterStream(new FilterData(service))

    var saveStream = fs.createReadStream(file)
        .pipe(parse({delimiter: ';', columns: true}))
        .pipe(new PositionStream())
        .pipe(new ClassificationStream(new Classification(config.classification)))
        .pipe(filterStream)
        .pipe(new SaveStream(service))

    saveStream.__filterStream = filterStream

    return saveStream;
}

module.exports = instance;