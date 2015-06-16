var log = require('./log');
var r   = require('rethinkdb');

// Repositories
var Users    = require('./repositories/users');
var Chats    = require('./repositories/chats');
// var Messages = require('./repositories/messages');

// Connection to db, constants
var conn, CONST;

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
            .tap(setupDb)
            .then(saveConnection)
            .then(function() {
                conn.use(CONST.DB.NAME);
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

    log('db loaded');

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

function setupDb(connection) {
    // Check if the db exists
    // Create it if it doesn't
    // Check if the tables exist
    // Create them if they don's

    return getDbs()
        .then(checkAndCreateDbs)
        .then(getTables)
        .then(checkTables);

    function getDbs () {
        return r.dbList().run(connection);
    }

    function checkAndCreateDbs(dbs) {
        if (-1 === dbs.indexOf(CONST.DB.NAME)) {
            log('creating database', CONST.DB.NAME);
            return r.dbCreate(CONST.DB.NAME).run(connection)
        } else {
            log('database already exists', CONST.DB.NAME);
        }
    }

    function getTables() {
        return r.db(CONST.DB.NAME).tableList().run(connection);
    }

    function checkTables(tables) {
        var promise;
        for (var key in CONST.DB.TABLES) {

            var tableName = CONST.DB.TABLES[key];

            if (-1 === tables.indexOf(tableName)) {

                var thisPromise = r.db(CONST.DB.NAME).tableCreate(tableName).run(connection);

                if (promise) {
                    promise = promise.then(thisPromise);
                } else {
                    promise = thisPromise;
                }
            }
        }
        return promise;
    }

}