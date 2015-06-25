var r = require('rethinkdb');
var CONST = require('../constants');
var hmac = (function () {
    var crypto = require('crypto-js/hmac-sha256');
    return function(message, key) {
        return crypto(message, key).toString()
    }
})();
var DB;

var Users = {};

Users.register = function(username, position) {

    // Set up row data
    username = username || generateUsername();
    var sessionKey = rand(64);
    var row = {
        username   : username,
        sessionKey : sessionKey
    };
    if (position) row.createdAt  = position;
    if (position) row.loggedInAt = position;

    // Execute query
    return makeUser()
        .then(getCreatedUser);

    // Add the user to the DB
    function makeUser() {
        row.createdOn  = Number(new Date());
        row.lastLogin  = Number(new Date());
        row.loginCount = 1;
        row.online     = true;

        var checkAvail = table(r).filter({ username: username }).count().gt(0);
        var insert     = table(r).insert(row);
        var err        = r.error('Username is already taken!');

        return DB.exec(r.branch(checkAvail, err, insert));
    }

    function getCreatedUser() {
        return DB.exec(table(r).getAll(row.username, {index: 'username'})).then(DB.first)
    }
};

Users.authenticate = function(userId, sessionKey) {

    return DB
        .exec(table(r).get(userId))
        .then(checkSecret)
        .catch(log);

    // Check that the provided secret+salt matches the stored hash
    function checkSecret(user) {
        if (!user || user.sessionKey !== sessionKey) {
            throw new Error('User not found, or sessionKey was invalid.');
        }
        DB.exec(table(r).get(userId).update({ online: true }));
        return user;
    }
};

Users.changeUsername = function(userId, name) {

    var checkAvailability = table(r).filter({username: name}).count().gt(1);
    var reportInUse       = r.error('The username ' + name + ' is currently in use!');
    var changeName        = table(r).get(userId).update({username: name});

    return DB.exec(r.branch(checkAvailability, reportInUse, changeName));

};

Users.getUsers = function(location, callback) {
    var query = table(r)
        .filter(r.row('location').eq(location))
        .withFields(['id', 'online', 'username']);

    return DB.exec(query).then(DB.toArray);
};

Users.watchUsers = function(location, callback) {
    var query = table(r)
        .filter(r.row('location').eq(location))
        .withFields(['id', 'online', 'username'])
        .changes()
        .getField('new_val');

    return DB.exec(query)
        .then(function(cursor) {
            cursor.each(callback);
            return cursor;
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

Users.setLocation = function(userId, location) {
    var row = {
        online: true,
        location: location
    };
    return DB
        .exec(table(r).get(userId).update(row, { returnChanges: true }))
        .then(DB.newVal);
};

Users.disconnect = function(userId) {
    return DB
        .exec(table(r).get(userId).update({
            online: false
        }));
};


function table(r) {
    return r.db(CONST.DB.NAME).table(CONST.DB.TABLES.USERS);
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
    return Users;
};