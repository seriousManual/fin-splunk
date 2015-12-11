var config = require('./lib/config');
var service = require('./lib/service');

var instance = require('./instance');

service.connect(function(error, service) {
    if (error) {
        throw error;
    }

    var count = 0;
    instance(__dirname + '/data.csv', service, config)
        .on('data', (data) => count++)
        .on('end', () => console.log('%d entries updated', count))
});