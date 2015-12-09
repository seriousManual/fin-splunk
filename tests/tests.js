var sinon = require('sinon')
var expect = require('chai').expect

var Position = require('../lib/position/Position')
var FilterData = require('../lib/filter/FilterData')

var createServiceMock = (error, result) => {
    return {
        oneshotSearch: sinon.spy((search, parameters, callback) => callback(error || null, result || null))
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
    })
})