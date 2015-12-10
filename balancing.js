var moment = require('moment');

var config = require('./lib/config');
var service = require('./lib/service');

service.connect(function(error, service) {
    if (error) {
        throw error;
    }

    var message = moment('09.05.2014', 'DD-MM-YYYY').format() + ' amount=42 classification=balancing account=zzz purpose=balancing partner=me partnerAccountNumber=yyy partnerBank=xxx ';

    service.log(message, {index: 'finance'}, (error) => console.log('done'));
});

