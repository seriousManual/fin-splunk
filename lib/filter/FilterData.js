function FilterData(service) {
    this._service = service;
    this._initialized = false;
    this._checksums = [];
}

FilterData.prototype.initialized = function() {
    return this._initialized;
};

FilterData.prototype.initialize = function (account, callback) {
    this._service.oneshotSearch('search index=finance account=' + account + ' | table checksum', { earliest_time: '-3mon', latest_time: 'now' }, (error, result) => {
        if (error) return callback(error);

        this._checksums = result.rows.map((row) => row[0]);
        this._initialized = true;
        callback(null);
    });
};

FilterData.prototype.contains = function (checksum) {
    return this._checksums.indexOf(checksum) > -1;
};

module.exports = FilterData;