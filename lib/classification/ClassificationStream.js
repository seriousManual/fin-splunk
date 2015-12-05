var util = require('util');
var Transform = require('stream').Transform;

function Classification(classification) {
    this._classification = classification;

    Transform.call(this, {objectMode: true});
}

util.inherits(Classification, Transform);

Classification.prototype._transform = function (position, enc, callback) {
    position.classification(this._classification.classify(position.purpose())
        || this._classification.classify(position.partner())
        || 'unclassified');

    this.push(position);

    callback();
};

module.exports = Classification;