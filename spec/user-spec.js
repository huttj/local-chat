var config = require('./../config');
var CONST  = require('./../server/constants');

var DB = require('./../server/db')(config, CONST);
var Users = DB.Users;

describe('user repository', function() {

    describe('> register', function () {

        describe('> no name provided', function () {

            var user;

            beforeAll(function (done) {
                user = Users.register();
            });

            it('> creates a user', function() {
                user
                    .then(function (usr) {
                        expect(usr).toBeDefined();
                    })
                    .then(done);
            });

            it('user has a random name')

        });

        xdescribe('name provided');

        xdescribe('name collision');

    });

    xdescribe('authenticate');

    xdescribe('changeName');

    xdescribe('setPhoneNumber');

    xdescribe('verifyPhoneNumber');

});