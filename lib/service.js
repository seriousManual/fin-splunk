var splunkjs = require('splunk-sdk');

var config = require('./config');

module.exports.connect = function(callback) {
    var service = new splunkjs.Service({
        username: config.splunk.username,
        password: config.splunk.password,
        scheme: 'http',
        host: config.splunk.host,
        port: config.splunk.port,
        version: 'default'
    });

    service.login(function(error, success) {
        if (error || !success) {
            return callback(error.error || new Error('could not connect'));
        }

        callback(null, service);
    });
};