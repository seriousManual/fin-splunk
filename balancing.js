var moment = require('moment');

var config = require('./lib/config');
var service = require('./lib/service');

service.connect(function(error, service) {
    if (error) {
        throw error;
    }

    var message = moment('09.05.2014', 'DD-MM-YYYY').format() + ' amount=3780.03 classification=balancing account=11135445 purpose=balancing partner=me partnerAccountNumber=11135445 partnerBank=76350000 ';

    service.log(message, {index: 'finance'}, (error) => console.log('done'));
});

