var util = require('util')
var Transform = require('stream').Transform

function FilterStream(filterData) {
    this._filterData = filterData
    this._countBlocked = 0

    Transform.call(this, {objectMode: true})
}

util.inherits(FilterStream, Transform)

FilterStream.prototype._transform = function (position, enc, callback) {
    this._filterData.contains(position, (error, contains) => {
        if (error) {
            return callback(error)
        }

        if (!contains) {
            this.push(position)
        } else {
            this._countBlocked++
        }

        callback()
    })
}

FilterStream.prototype.countBlocked = function () {
    return this._countBlocked
}

module.exports = FilterStream