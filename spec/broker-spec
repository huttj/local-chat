var assert = require('assert');

describe('Broker', function() {

    describe('addUser', function () {

        describe('proper user object', function () {

            var Broker, sessions;

            before(function (done) {
                Broker = require('../server/broker')({}, {});
                Broker.addUser({
                    id: 12345,
                    location: 'Seattle, WA',
                    socket: {},
                    username: 'jonah'
                }).then(function() {
                    sessions = Broker._getSessions();
                }).finally(done);
            });

            it('should add the user to sessions.user', function () {
                assert(sessions.users[12345], 'User not added to sessions.user');
            });

            it('should add the user to sessions.location', function () {
                assert(sessions.locations['Seattle, WA'], 'User not added to sessions.location');
            });

        });

        describe('user object missing id', function () {

            var Broker, error;

            before(function (done) {
                Broker = require('../server/broker')({}, {});
                Broker.addUser({
                    location: 'Seattle, WA',
                    socket: {}
                }).catch(function(err) {
                    error = err;
                }).finally(done);
            });

            it('should throw/pass an error', function () {
                assert(error != null);
            });

        });

        describe('user object missing location', function () {

            var Broker, error;

            before(function (done) {
                Broker = require('../server/broker')({}, {});
                Broker.addUser({
                    id: 1234,
                    //location: 'Seattle, WA',
                    socket: {}
                }).catch(function(err) {
                    error = err;
                }).finally(done);
            });

            it('should throw/pass an error', function () {
                assert(error != null);
            });

        });

        describe('user object missing socket', function () {

            var Broker, error;

            before(function (done) {
                Broker = require('../server/broker')({}, {});
                Broker.addUser({
                    id: 1234,
                    location: 'Seattle, WA'
                    //socket: {}
                }).catch(function(err) {
                    error = err;
                }).finally(done);
            });

            it('should throw/pass an error', function () {
                assert(error != null);
            });

        });

        describe('user object missing username', function () {

            var Broker, error;

            before(function (done) {
                Broker = require('../server/broker')({}, {});
                Broker.addUser({
                    id: 1234,
                    location: 'Seattle, WA',
                    socket: {}
                }).catch(function(err) {
                    error = err;
                }).finally(done);
            });

            it('should throw/pass an error', function () {
                assert(error != null);
            });

        });

    });

});

function nil() {}