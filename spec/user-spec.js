var r      = require('rethinkdb');
var config = require('./../config')['DEV'];
var CONST  = require('./../server/constants');

var DB = require('./../server/db')(config, CONST);
var Users = DB.Users;

describe('user repository', function() {

    describe('> register', function () {

        beforeAll(function (done) {
            DB.DB.exec(r.table('Users').delete())
                .then(done);
        });

        describe('> no name provided', function () {

            var user;

            beforeAll(function (done) {
                user = Users.register().tap(done);
            });

            it('> creates a user', function(done) {
                user
                    .then(function (usr) {
                        expect(usr).toBeDefined();
                    })
                    .finally(done);
            });

            it('user has a random name', function(done) {
                user
                    .then(function (usr) {
                        expect(usr.username).toBeDefined();
                        expect(usr.id).toBeDefined();
                        expect(usr.sessionKey).toBeDefined();
                    })
                    .finally(done);
            });

        });

        describe('name provided', function() {
            var user;

            beforeAll(function (done) {
                user = Users.register('Joshua').tap(done);
            });

            it('> creates a user', function(done) {
                user
                    .then(function (usr) {
                        expect(usr).toBeDefined();
                    })
                    .finally(done);
            });

            it('user has a random name', function(done) {
                user
                    .then(function (usr) {
                        expect(usr.username).toEqual('Joshua');
                        expect(usr.id).toBeDefined();
                        expect(usr.sessionKey).toBeDefined();
                    })
                    .finally(done);
            });
        });

        describe('name collision', function() {
            var user;

            beforeAll(function (done) {
                user = Users.register('Joshua');
                user.then(done);
            });

            it('> fails to create a user', function(done) {
                user
                    .then(function(usr) {
                        expect(usr).toBeUndefined()
                    })
                    .catch(function (e) {
                        expect(e).toBeDefined();
                        expect(e.message).toEqual('Username is in use!');

                    })
                    .finally(done);
            });

        });

    });

    describe('authenticate', function() {

        beforeAll(function (done) {
            DB.DB.exec(r.table('Users').delete())
                .then(done);
        });

        var user;

        beforeAll(function (done) {
            user = Users.register().tap(done);
        });

        it('authenticates with userId and sessionKey provided on signup', function() {

            user.then(function(usr) {
                Users.authenticate(usr.id, usr.sessionKey)
                    .then(function(data) {
                        console.log(data);
                        done();
                    });
            });

        });

    });

    xdescribe('changeName');

    xdescribe('setPhoneNumber');

    xdescribe('verifyPhoneNumber');

});