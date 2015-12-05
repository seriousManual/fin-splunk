var fs = require('fs');
var parse = require('csv-parse');

module.exports.read = function(file) {
    return fs
        .createReadStream(file)
        .pipe(parse({delimiter: ';', columns: true}));
};