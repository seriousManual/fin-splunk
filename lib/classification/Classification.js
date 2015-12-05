function Classification(data) {
    this._data = this._init(data);
}

Classification.prototype._init = function(data) {
    var result = {};

    Object.keys(data).forEach(function(key) {
        var phrases = data[key];

        phrases.forEach(function(phrase) {
            result[phrase] = key.toLowerCase();
        });
    });

    return result;
};

Classification.prototype.classify = function (phrase) {
    phrase = phrase.toLowerCase();
    var keys = Object.keys(this._data);

    for(var i = 0; i < keys.length; i++) {
        if (phrase.indexOf(keys[i]) > -1) return this._data[keys[i]];
    }

    return null;
};

module.exports = Classification;