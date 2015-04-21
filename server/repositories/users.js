var DB, r;
var CONST = require('./../constants');
var hmac = (function () {
    var crypto = require('crypto-js/hmac-sha256');
    return function(message, key) {
        return crypto(message, key).toString()
    }
})();

var Users = {};

Users.register = function(username, position) {
    username = username || generateUsername();
    var secret = rand(6);
    var salt = rand(64);

    var row = {
        username: username,
        hash: hmac(secret, salt),
        salt: salt
    };

    if (position) row.createdAt = position;

    return DB.load(function(r) {
        return exists()
            .then(makeUser)
            .then(doubleCheckAvailability);

        // Shorthand for checking if the username or secret is in use
        function exists(n) {
            return DB.exec(table(r).getAll(row.username, {index: 'username'}).count().gt(n || 0))
                .then(function (taken) {
                    if (taken) throw 'Username is in use!';
                })
        }

        function makeUser() {
            row.createdOn = Number(new Date());
            row.lastLogin = Number(new Date());
            return DB.exec(
                table(r)
                .insert(row)
            );
        }

        // Check to see if the secret and username were taken in between the first check and creating
        // Rare race condition
        function doubleCheckAvailability() {
            return exists(1)
                .then(function () {
                    return DB.exec(table(r).getAll(row.username, {index: 'username'}))
                })
                .then(DB.first)
                .then(function(user) {
                    user.secret = secret;
                    return user;
                });
        }
    });
};

Users.authenticate = function(username, secret) {

    var AuthError = 'User not found, or secret did not match.';

    return DB.load(function(r) {

        return DB.exec(table(r).getAll(username, {index: 'username'}))
            .then(DB.first)
            .then(checkSecret)
            .then(addSession)
            .then(cleanUp);

        function checkSecret(user) {
            if (!user || user.hash !== hmac(secret, user.salt)) {
                throw new Error(AuthError);
            }
            return user;
        }

        function addSession(user) {
            user.lastLogin = Number(new Date());
            return DB
                .exec(table(r).get(user.id).update(user))
                .then(function() {
                    return user;
                });
        }

        function cleanUp(user) {
            return {
                userId     : user.id,
                username   : user.username,
                createdOn  : user.createdOn,
                sessionKey : user.sessionKey,
                lastLogin  : user.lastLogin
            }
        }

    });
};

Users.changeName = function(userId, name) {

    var SameNameError = 'Your username is already set to ' + name + '.';
    var AlreadyTakenError = 'The username ' + name + ' is currently in use!';

    return DB.load(function (r) {
        return (
            checkUsername()
            .then(changeUsername)
            .then(doubleCheckUsername)
        );

        function checkUsername() {
            return DB
                .exec(table(r).filter({username: name}).limit(1))
                .then(DB.first)
                .then(function(user) {
                    if (user && user.id === userId) throw new Error(SameNameError);
                    if (user) throw new Error(AlreadyTakenError);
                })
                .then(function() {
                    return DB
                        .exec(table(r).get(userId)('username'))
                        .then(DB.first);
                });
        }

        function changeUsername(oldName) {
            return DB
                .exec(table(r).get(userId).update({username: name}))
                .then(function() {
                    return oldName
                });
        }

        function doubleCheckUsername(oldName) {
            return DB
                .exec(table(r).filter({username: name}))
                .then(DB.toArray)
                .then(function(array) {
                    if (array.length > 1) return revert(oldName);
                    return array[0];
                });
        }

        function revert(oldName) {
            return DB
                .exec(table(r).get(userId).update({username: oldName}))
                .then(function() { throw new Error(AlreadyTakenError); });
        }
    });
};

Users.addPhone = function(userId, number) {
    var row = {
        phone: number,
        key: secret(6)
    };
    return DB.load(function (r) {
        return DB
            .exec(table(r).get(userId).update(row, { returnChanges: true }))
            .then(DB.newVal);
    });
};

function table(r) {
    return r.db(CONST.DB).table(CONST.TABLES.USERS);
}

function rand(len, complex) {
    var base = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890';
    if (complex) base += '-=!@#$%^&*()_+~`|<>?,./';
    return Array.apply(null, Array(len || 6)).map(function() {
        return base[Math.floor(Math.random()*base.length-1)];
    }).join('');
}

function generateUsername(len) {
    var num = '1234567890';
    return 'Anon' + Array.apply(null, Array(len || 6)).map(function() {
        return num[Math.floor(Math.random()*num.length-1)];
    }).join('');
}

function makeSessionKey() {
    return rand(36, true);
}

function log(n) {
    console.log(n);
    return n;
}

module.exports = function(_DB) {
    DB    = _DB;
    DB.load(function (_r) {
        r = _r
    });
    return Users;
};