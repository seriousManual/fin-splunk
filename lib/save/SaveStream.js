var util = require('util');
var Transform = require('stream').Transform;

var moment = require('moment');

function SaveStream(service) {
    Transform.call(this, {objectMode: true});

    this._service = service;
}

util.inherits(SaveStream, Transform);

SaveStream.prototype._transform = function (position, enc, callback) {
    var that = this;
    var data = position.data();

    var pairs = Object
        .keys(data)
        .map(function(key) {
            var value = that._sanitize(data[key]);

            return util.format('%s="%s"', key, value);
        });

    var message = moment(position.date(), 'DD-MM-YYYY').format() + ' ' + pairs.join(' ');

    this._service.log(message, {index: 'finance'}, (error) => callback(error));
};

SaveStream.prototype._sanitize = function(value) {
    return value.replace(/"/g, '');
};

module.exports = SaveStream;