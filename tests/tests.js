var moment = require('moment')
var sinon = require('sinon')
var expect = require('chai').expect

var Position = require('../lib/position/Position')
var PositionStream = require('../lib/Position/PositionStream')
var FilterData = require('../lib/filter/FilterData')
var FilterStream = require('../lib/filter/FilterStream')
var SaveStream = require('../lib/save/SaveStream')
var Classification = require('../lib/classification/Classification')
var ClassificationStream = require('../lib/classification/ClassificationStream')

var createServiceMock = (error, result) => {
    return {
        oneshotSearch: sinon.spy((search, parameters, callback) => callback(error || null, result || null)),
        log: sinon.spy((message, parms, callback) => callback(error || null))
    }
}
var createFilterDataMock = (error, contains) => {
    var i = 0
    contains = contains || []

    return {
        contains: sinon.spy((position, callback) => callback(error, contains[i++]))
    }
}
var createClassifyMock = (classifications) => {
    var i = 0
    return {
        classify: sinon.spy(() => classifications[i++])
    }
}

describe('fin-splunk', () => {
    describe('filter', () => {
        describe('data', () => {
            describe('init fail', () => {
                var error, result
                var dummyService = createServiceMock(new Error('fooError'))
                var filterData = new FilterData(dummyService)
                var testPosition = new Position({account: 'fooAccount'})

                before((done) => filterData.contains(testPosition, (_error, _result) => {
                    error = _error
                    result = _result
                    done()
                }))

                it('should return an error', () => expect(error.message).to.equal('fooError'))
                it('should ask the service', () => expect(dummyService.oneshotSearch.args[0][0]).to.equal('search index=finance account=fooAccount | table checksum'))
                it('should ask the service', () => expect(dummyService.oneshotSearch.args[0][1]).to.deep.equal({earliest_time: '-3mon', latest_time: 'now'}))
            })

            describe('init success, found', () => {
                var error, result
                var dummyService = createServiceMock(null, {rows: [['5c1ff7c37588eb7051737a9d4a2adf0cd10c2a62']]})
                var filterData = new FilterData(dummyService)
                var testPosition = new Position({account: 'fooAccount'})

                before((done) => filterData.contains(testPosition, (_error, _result) => {
                    error = _error
                    result = _result
                    done()
                }))

                it('should return an error', () => expect(error).to.be.null)
                it('should ask the service', () => expect(dummyService.oneshotSearch.args[0][0]).to.equal('search index=finance account=fooAccount | table checksum'))
                it('should ask the service', () => expect(dummyService.oneshotSearch.args[0][1]).to.deep.equal({earliest_time: '-3mon', latest_time: 'now'}))
                it('should be initialized', () => expect(filterData._isInitialized()).to.be.true)
                it('should contain values', () => expect(result).to.be.true)
            })

            describe('init success, not found', () => {
                var error, result
                var dummyService = createServiceMock(null, {rows: [['foo1']]})
                var filterData = new FilterData(dummyService)
                var testPosition = new Position({account: 'fooAccount'})

                before((done) => filterData.contains(testPosition, (_error, _result) => {
                    error = _error
                    result = _result
                    done()
                }));

                it('should return an error', () => expect(error).to.be.null)
                it('should ask the service', () => expect(dummyService.oneshotSearch.args[0][0]).to.equal('search index=finance account=fooAccount | table checksum'))
                it('should ask the service', () => expect(dummyService.oneshotSearch.args[0][1]).to.deep.equal({earliest_time: '-3mon', latest_time: 'now'}))
                it('should be initialized', () => expect(filterData._isInitialized()).to.be.true)
                it('should contain values', () => expect(result).to.be.false)
            })
        })

        describe('stream', () => {
            describe('error', () => {
                var error;
                var filterDataMock = createFilterDataMock(new Error('fooError'))
                var filterStream = new FilterStream(filterDataMock)
                
                before((done) => {
                    filterStream
                        .on('error', (_error) => {
                            error = _error
                            done()
                        })
                        .write('foo')
                })
                
                it('should return an error', () => expect(error.message).to.equal('fooError'))
                it('ask the filterdata with correct value', () => expect(filterDataMock.contains.args[0][0]).to.equal('foo'))
            })

            describe('success', () => {
                var filterDataMock = createFilterDataMock(null, [false, true, false])
                var filterStream = new FilterStream(filterDataMock)
                var collected = [];

                before(() => {
                    filterStream.write('foo')
                    filterStream.write('bar')
                    filterStream.write('bax')

                    filterStream.on('data', (data) => collected.push(data))
                })

                it('should only let the correct values pass', () => expect(collected).to.deep.equal(['foo', 'bax']))
            })
        })
    })

    describe('savestream', () => {
        describe('error', () => {
            var error;
            var collection = [];
            var serviceMock = createServiceMock(new Error('fooError'))
            var saveStream = new SaveStream(serviceMock)

            var date = moment(moment().format('DD-MM-YYYY'), 'DD-MM-YYYY')
            var dummyPosition = {
                data: () => ({a: 'b', c: 'd'}),
                date: () => date.format('DD-MM-YYYY')
            };

            before((done) => {
                saveStream
                    .on('error', (_error) => {
                        error = _error
                        done()
                    })
                    .on('data', (data) => collection.push(data))
                    .write(dummyPosition)


            })

            it('should return an error', () => expect(error.message).to.equal('fooError'))
            it('log something', () => expect(serviceMock.log.args[0][0]).to.equal(date.format() + ' a="b" c="d"'))
        })

        describe('success', () => {
            var error = null;
            var collection = [];
            var serviceMock = createServiceMock(null)
            var saveStream = new SaveStream(serviceMock)

            var date = moment(moment().format('DD-MM-YYYY'), 'DD-MM-YYYY')
            var dummyPosition = {
                data: () => ({a: 'b', c: 'd"asdf'}),
                date: () => date.format('DD-MM-YYYY')
            };

            before((done) => {
                saveStream
                    .on('end', done)
                    .on('error', (_error) => error = _error)
                    .on('data', (data) => collection.push(data))
                    .write(dummyPosition)

                saveStream.end()
            })

            it('should return an error', () => expect(error).to.be.null)
            it('log something', () => expect(serviceMock.log.args[0][0]).to.equal(date.format() + ' a="b" c="dasdf"'))
            it('should also output', () => expect(collection[0]).to.equal(dummyPosition))
            it('should return only one element', () => expect(collection.length).to.equal(1))
        })
    })

    describe('positionstream', () => {
        var error = null;
        var collection = [];
        var positionStream;

        before((done) => {
            positionStream = new PositionStream();

            positionStream
                .on('end', done)
                .on('error', (_error) => error = _error)
                .on('data', (data) => collection.push(data))
                .write({
                    "Buchungstag": "10.01.2015",
                    "Auftragskonto": "fooAccount",
                    "Verwendungszweck": "fooPurpose",
                    "Beguenstigter/Zahlungspflichtiger": "fooPartner",
                    "Kontonummer": "fooPartnerAccountNumber",
                    "BLZ": "fooBLZ",
                    "Betrag": "1000,20"
                })

            positionStream.end()
        })

        it('should not return an error', () => expect(error).to.be.null)
        it('should convert the csv entry', () => expect(collection[0].data()).to.deep.equal({
            account: 'fooAccount',
            purpose: 'fooPurpose',
            partner: 'fooPartner',
            partnerAccountNumber: 'fooPartnerAccountNumber',
            partnerBank: 'fooBLZ',
            amount: 1000.20,
            classification: null,
            checksum: 'a239d858cf3a57cb8478a740beb2d86234e8bb1c'
        }));
    })

    describe('classification', () => {
        describe('data', () => {
            var classi;
            before(() => {
                classi = new Classification({
                    foo: ['bar', 'bax']
                })
            })

            it('should return the correct classification', () => expect(classi.classify('asdf bar asdf')).to.equal('foo'))
            it('should return the correct classification', () => expect(classi.classify('aaafff111asdaf bax asdfsdf')).to.equal('foo'))
            it('should return null', () => expect(classi.classify('spam eggs')).to.be.null)
        })

        describe('stream', () => {
            describe('no match', () => {
                var error = null;
                var collection = [];
                var classiStream, classiMock

                before((done) => {
                    classiMock = createClassifyMock([null, null])
                    classiStream = new ClassificationStream(classiMock)

                    classiStream
                        .on('end', done)
                        .on('error', (_error) => error = _error)
                        .on('data', (data) => collection.push(data))
                        .write(new Position({purpose: 'fooPurpose', partner: 'fooPartner'}))

                    classiStream.end()
                })

                it('should not emit an error', () => expect(error).to.be.null)
                it('should ask the classifier', () => expect(classiMock.classify.args).to.deep.equal([['fooPurpose'], ['fooPartner']]))
                it('should set default classification', () => expect(collection[0].classification()).to.equal('unclassified'))
            })

            describe('purpose match', () => {
                var error = null;
                var collection = [];
                var classiStream, classiMock

                before((done) => {
                    classiMock = createClassifyMock(['fooClassification'])
                    classiStream = new ClassificationStream(classiMock)

                    classiStream
                        .on('end', done)
                        .on('error', (_error) => error = _error)
                        .on('data', (data) => collection.push(data))
                        .write(new Position({purpose: 'fooPurpose', partner: 'fooPartner'}))

                    classiStream.end()
                })

                it('should not emit an error', () => expect(error).to.be.null)
                it('should ask the classifier', () => expect(classiMock.classify.args).to.deep.equal([['fooPurpose']]))
                it('should set correct classification', () => expect(collection[0].classification()).to.equal('fooClassification'))
            })

            describe('partner match', () => {
                var error = null;
                var collection = [];
                var classiStream, classiMock

                before((done) => {
                    classiMock = createClassifyMock([null, 'fooClassification'])
                    classiStream = new ClassificationStream(classiMock)

                    classiStream
                        .on('end', done)
                        .on('error', (_error) => error = _error)
                        .on('data', (data) => collection.push(data))
                        .write(new Position({purpose: 'fooPurpose', partner: 'fooPartner'}))

                    classiStream.end()
                })

                it('should not emit an error', () => expect(error).to.be.null)
                it('should ask the classifier', () => expect(classiMock.classify.args).to.deep.equal([['fooPurpose'], ['fooPartner']]))
                it('should set default classification', () => expect(collection[0].classification()).to.equal('fooClassification'))
            })
        })
    })
})