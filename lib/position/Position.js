var checksum = require('../checkSum');

function Position(data) {
    this._date = data.date;
    this._account = data.account;
    this._purpose = data.purpose;
    this._classification = null;
    this._partner = data.partner;
    this._partnerAccountNumber = data.partnerAccountNumber;
    this._partnerBank = data.partnerBank;
    this._amount = data.amount;
}

Position.prototype.date = function (date) {
    if (date !== undefined) {
        this._date = date;
    }

    return this._date;
};

Position.prototype.account = function (account) {
    if (account !== undefined) {
        this._account = account;
    }

    return this._account;
};

Position.prototype.purpose = function (purpose) {
    if (purpose !== undefined) {
        this._purpose = purpose;
    }

    return this._purpose;
};

Position.prototype.classification = function (classification) {
    if (classification !== undefined) {
        this._classification = classification;
    }

    return this._classification;
};

Position.prototype.amount = function (amount) {
    if (amount !== undefined) {
        this._amount = amount;
    }

    return this._amount;
};

Position.prototype.partner = function (partner) {
    if (partner !== undefined) {
        this._partner = partner;
    }

    return this._partner;
};

Position.prototype.partnerAccountNumber = function (partnerAccountNumber) {
    if (partnerAccountNumber !== undefined) {
        this._partnerAccountNumber = partnerAccountNumber;
    }

    return this._partnerAccountNumber;
};

Position.prototype.partnerBank = function (partnerBank) {
    if (partnerBank !== undefined) {
        this._partnerBank = partnerBank;
    }

    return this._partnerBank;
};

Position.prototype.checksum = function () {
    return checksum(this.account(), this.date(), this.partner(), this.partnerAccountNumber(), this.purpose(), this.classification(), this.amount());
};

Position.prototype.data = function() {
    return {
        account: this.account(),
        purpose: this.purpose(),
        classification: this.classification(),
        partner: this.partner(),
        partnerAccountNumber: this.partnerAccountNumber(),
        partnerBank: this.partnerBank(),
        amount: this.amount(),
        checksum: this.checksum()
    }
};

module.exports = Position;
