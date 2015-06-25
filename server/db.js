var log     = require('./log');
var r       = require('rethinkdb');
var Promise = require('bluebird');

// Repositories
var Users    = require('./repositories/users');
var Chats    = require('./repositories/chats');
// var Messages = require('./repositories/messages');

// Connection to db, constants
var conn, CONST;

module.exports = function connectToDb(config, _CONST) {
    var options = config.db;
    CONST = _CONST;

    // connect and return db instance
    var dbPromise = r.connect(options)
            .tap(saveConnection)
            .tap(function() {
                conn.use(CONST.DB.NAME);
            });

    var DB = {
        load: function (fn) {
            return dbPromise.then(fn);
        },
        exec: function (query, callback) {
            return dbPromise.then(function () {
                return query.run(conn, callback);
            });
        },
        conn: conn,
        first: first,
        toArray: toArray,
        isEmpty: isEmpty,
        newVal: newVal,
        newVals: newVals,
        nil: nil
    };

    log('db loaded');

    return {
        Users: Users(DB),
        Chats: Chats(DB),
        DB: DB
        //Messages: Messages(
    };
};

function saveConnection(connection) {
    conn = connection;
}

function first(cursor) {
    if (cursor && cursor.toArray) {
        return cursor
            .toArray()
            .then(function(array) {
                return array[0]
            });
    } else {
        return cursor;
    }

}
function toArray(cursor) {
    return cursor.toArray();
}
function isEmpty(array) {
    return array.length === 0;
}
function newVal(update) {
    try {
        return update.changes[0].new_val;
    } catch (e) {
        return update;
    }
}
function newVals(update) {
    try {
        return update.changes.map(function(n) { return n && n.new_val });
    } catch (e) {
        return update;
    }
}
function nil() {}