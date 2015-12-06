var crypto = require('crypto');

function checkSum() {
    var args = Array.prototype.slice.call(arguments, 0);

    var shasum = crypto.createHash('sha1');
    shasum.update(args.join('_'));

    return shasum.digest('hex');
}

module.exports = checkSum;