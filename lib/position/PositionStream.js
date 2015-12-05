var util = require('util');
var Transform = require('stream').Transform;

var Position = require('./Position');

function PositionStream() {
    Transform.call(this, {objectMode: true});
}

util.inherits(PositionStream, Transform);

PositionStream.prototype._transform = function (position, enc, callback) {
    this.push(new Position({
        date: position.Buchungstag,
        account: position.Auftragskonto,
        purpose: position.Verwendungszweck,
        partner: position['Beguenstigter/Zahlungspflichtiger'],
        partnerAccountNumber: position.Kontonummer,
        partnerBank: position.BLZ,
        amount: position.Betrag
    }));

    callback();
};

module.exports = PositionStream;