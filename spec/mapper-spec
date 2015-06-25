var assert = require('assert');

var config = require('./../config');
var Mapper = require('./../server/mapper')(config);

console.log(config);

describe('Mapper', function() {

    describe('lookupName', function () {

        describe('when provided valid coordinates', function() {

            var coords = {
                latitude: '47.654710',
                longitude: '-122.308563'
            };
            var result, error;

            before(function(done) {
                result = Mapper.lookupName(coords, function(err, name) {
                    result = name;
                    error  = err;
                    done();
                });
            });

            it('does not encounter an error', function() {
                assert(error === null);
            });

            it('returns a name', function() {
                assert(result);
            });

            it('returns a name that is not `unknown`', function() {
                assert(result !== 'unknown');
            });

            it('returns a name that matches the coordinates provided', function() {
                assert.equal(result, 'Northeast Seattle, WA');
            });


        });

        describe('when provided invalid coordinates', function () {

            describe('in the form of a null parameter', function () {

                var coords = null;
                var error, result;

                before(function(done) {
                    result = Mapper.lookupName(coords, function(err, res) {
                        error = err;
                        result = res;
                        done();
                    });
                });

                it('gently rejects the query', function () {
                    assert.equal(error, '`coords` object must have latitude and longitude properties');
                });

                it('passes a null or undefined result', function () {
                    assert(result === null || result === undefined);
                });
            });

            describe('in the form of misspelled properties', function() {

                var coords = null;
                var error, result;

                before(function(done) {
                    result = Mapper.lookupName(coords, function(err, res) {
                        error = err;
                        result = res;
                        done();
                    });
                });

                it('gently rejects the query', function () {
                    assert.equal(error, '`coords` object must have latitude and longitude properties');
                });

                it('passes a null or undefined result', function () {
                    assert(result === null || result === undefined);
                });

            });

        });

    });

    describe('lookupLocation', nil);

});

function nil() {}