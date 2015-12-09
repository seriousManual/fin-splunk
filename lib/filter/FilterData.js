function FilterData(service) {
    this._service = service;
    this._initialized = false;
    this._checksums = [];
}

FilterData.prototype._isInitialized = function() {
    return this._initialized;
};

FilterData.prototype._initialize = function (account, callback) {
    this._service.oneshotSearch('search index=finance account=' + account + ' | table checksum', { earliest_time: '-3mon', latest_time: 'now' }, (error, result) => {
        if (error) return callback(error);

        this._checksums = result.rows.map((row) => row[0]);
        this._initialized = true;
        callback(null);
    });
};

FilterData.prototype.contains = function (position, callback) {
    if (!this._isInitialized()) {
        this._initialize(position.account(), (error) => {
            if (error) return callback(error);

            this._handle(position, callback)
        });
    } else {
        this._handle(position, callback);
    }
};

FilterData.prototype._handle = function (position, callback) {
    callback(null, this._checksums.indexOf(position.checksum()) > -1);
};

module.exports = FilterData;