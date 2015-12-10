var util = require('util');
var Transform = require('stream').Transform;

function FilterStream(filterData) {
    this._filterData = filterData;

    Transform.call(this, {objectMode: true});
}

util.inherits(FilterStream, Transform);

FilterStream.prototype._transform = function (position, enc, callback) {
    this._filterData.contains(position, (error, contains) => {
        if (error) {
            return callback(error);
        }

        if (!contains) {
            this.push(position);
        }

        callback();
    });
};

module.exports = FilterStream;