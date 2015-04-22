var r = require('rethinkdb');

// Repositories
var Users = require('./repositories/users');
var Chats = require('./repositories/chats');

// Connection to db, constants
var conn, CONST;

// Shorthand for console.log
var log = console.log.bind(console);

module.exports = function connectToDb(config, _CONST) {
    var options;
    if (config) {
        options = config.db;
    } else {
        options = {
            host: '45.55.136.206'
        };
    }
    CONST = _CONST;

    // connect and return db instance
    var dbPromise = r.connect(options)
            .then(saveConnection)
            .then(function() {
                conn.use(CONST.DB);
                return r;
            });

    var DB = {
        load: function (fn) {
            return dbPromise.then(fn);
        },
        exec: function (obj) {
            return dbPromise.then(function () {
                return obj.run(conn);
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

    return {
        Users: Users(DB),
        Chats: Chats(DB)
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