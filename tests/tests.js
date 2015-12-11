var path = require('path')
var moment = require('moment')
var sinon = require('sinon')
var expect = require('chai').expect

var instance = require('../instance')
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
                it('should ask the service', () => expect(dummyService.oneshotSearch.args[0][1]).to.deep.equal({count: 0, earliest_time: '-3y', latest_time: 'now'}))
            })

            describe('init success, found', () => {
                var error, result
                var dummyService = createServiceMock(null, {rows: [['4d723314fded5decdbfde462cc1217ef2c69d384']]})
                var filterData = new FilterData(dummyService)
                var testPosition = new Position({account: 'fooAccount'})

                before((done) => filterData.contains(testPosition, (_error, _result) => {
                    error = _error
                    result = _result
                    done()
                }))

                it('should return an error', () => expect(error).to.be.null)
                it('should ask the service', () => expect(dummyService.oneshotSearch.args[0][0]).to.equal('search index=finance account=fooAccount | table checksum'))
                it('should ask the service', () => expect(dummyService.oneshotSearch.args[0][1]).to.deep.equal({count: 0, earliest_time: '-3y', latest_time: 'now'}))
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
                it('should ask the service', () => expect(dummyService.oneshotSearch.args[0][1]).to.deep.equal({count: 0, earliest_time: '-3y', latest_time: 'now'}))
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
                it('should return the number of blocked entries', () => expect(filterStream.countBlocked()).to.equal(1))
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
            checksum: '4dd0629c2965873956aa2d28876fb4abf254f603'
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

    describe('integration', () => {
        var serviceMock;
        before((done) => {
            serviceMock = createServiceMock(null, {rows: [['49c7b2de009e2c26fb9e33d92569f98b8c1ee2c9'], ['0042f696e8fd0c4d17bf101362c48df67aca4d6f']]})

            instance(path.join(__dirname, 'testdata.csv'), serviceMock, {
                classification: {
                    'c1': ['foo', 'bar'],
                    'c2': ['bax', 'baz']
                }
            })
                .on('data', (data) => 1)
                .on('end', done)
        })

        it('should log the correct amount', () => expect(serviceMock.log.args.length).to.equal(2))
        it('should log', () => expect(serviceMock.log.args[0][0]).to.equal('2015-12-14T00:00:00+01:00 account="123456" purpose="fooPurpose" classification="c1" partner="fooPartner" partnerAccountNumber="fooPartnerAccount" partnerBank="fooPartnerBank" amount="-42" checksum="034042d7b2d968661ad20da207a7ab81fda9c906"'))
        it('should log', () => expect(serviceMock.log.args[1][0]).to.equal('2015-12-14T00:00:00+01:00 account="123456" purpose="bazPurpose" classification="c2" partner="bazPartner" partnerAccountNumber="bazPartnerAccount" partnerBank="bazPartnerBank" amount="1337" checksum="140bc7f1fe29b8f177d2a360144c0ff04f45ea17"'))
    })
})