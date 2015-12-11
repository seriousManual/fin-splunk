var config = require('./lib/config')
var service = require('./lib/service')

var instance = require('./instance')

service.connect(function(error, service) {
    if (error) {
        throw error
    }

    var count = 0
    var stream = instance(__dirname + '/data/data20151212.csv', service, config)

    stream
        .on('data', (data) => count++)
        .on('end', () => {
            console.log('%d entries inserted', count)
            console.log('%d entries blocked', stream.__filterStream.countBlocked())
        })
})