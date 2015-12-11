var config = require('./lib/config');
var service = require('./lib/service');

var instance = require('./instance');

service.connect(function(error, service) {
    if (error) {
        throw error;
    }

    instance(__dirname + '/data.csv', service, config);
});