var config = require('./lib/config');
var service = require('./lib/service');

var reader = require('./lib/reader');
var PositionStream = require('./lib/position/PositionStream');
var FilterStream = require('./lib/filter/FilterStream');
var FilterData = require('./lib/filter/FilterData');
var Classification = require('./lib/classification/Classification');
var ClassificationStream = require('./lib/classification/ClassificationStream');
var SaveStream = require('./lib/save/SaveStream');

service.connect(function(error, service) {
    if (error) throw error;

    reader
        .read(__dirname + '/data.csv')
        .pipe(new PositionStream())
        .pipe(new FilterStream(new FilterData(service)))
        .pipe(new ClassificationStream(new Classification(config.classification)))
        .pipe(new SaveStream(service));
});