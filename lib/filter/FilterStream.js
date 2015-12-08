var util = require('util');
var Transform = require('stream').Transform;

function FilterStream(filterData) {
    this._filterData = filterData;

    Transform.call(this, {objectMode: true});
}

util.inherits(FilterStream, Transform);

FilterStream.prototype._transform = function (position, enc, callback) {
    if (!this._filterData.initialized()) {
        this._filterData.initialize(position.account(), (error) => {
            if (error) return callback(error);

            this._handle(position, callback)
        });
    } else {
        this._handle(position, callback);
    }
};

FilterStream.prototype._handle = function(position, callback) {
    if (!this._filterData.containes(position.checksum())) {
        this.push(position);
    }

    callback();
};

module.exports = FilterStream;