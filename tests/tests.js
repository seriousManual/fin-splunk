var sinon = require('sinon');
var expect = require('chai').expect;

var FilterData = require('../lib/filter/FilterData');

var createServiceMock = (error, result) => {
    return {
        oneshotSearch: sinon.spy((search, parameters, callback) => callback(error || null, result || null))
    }
};

describe('fin-splunk', () => {
    describe('filter', () => {
        describe('data', () => {
            describe('init fail', () => {
                var dummyService = createServiceMock(new Error('fooError'));
                var filterData = new FilterData(dummyService);
                var error;

                before((done) => filterData.initialize('fooAccount', (_error) => {
                    error = _error;
                    done();
                }));

                it('should return an error', () => expect(error.message).to.equal('fooError'))
                it('should ask the service', () => expect(dummyService.oneshotSearch.args[0][0]).to.equal('search index=finance account=fooAccount | table checksum'))
                it('should ask the service', () => expect(dummyService.oneshotSearch.args[0][1]).to.deep.equal({earliest_time: '-3mon', latest_time: 'now'}))
            });

            describe('init fail', () => {
                var dummyService = createServiceMock(null, {rows: [['foo1'], ['foo2'], ['foo3']]});
                var filterData = new FilterData(dummyService);
                var error;

                before((done) => filterData.initialize('fooAccount', (_error) => {
                    error = _error;
                    done();
                }));

                it('should return an error', () => expect(error).to.be.null)
                it('should ask the service', () => expect(dummyService.oneshotSearch.args[0][0]).to.equal('search index=finance account=fooAccount | table checksum'))
                it('should ask the service', () => expect(dummyService.oneshotSearch.args[0][1]).to.deep.equal({earliest_time: '-3mon', latest_time: 'now'}))
                it('should be initialized', () => expect(filterData.initialized()).to.be.true);
                it('should contain values', () => expect(filterData.contains('foo2')).to.be.true);
                it('should not contain values', () => expect(filterData.contains('bar3')).to.be.false);
            });
        });
    });
});