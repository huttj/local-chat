var r = require('rethinkdb');
var Promise = require('bluebird');
var CONST = require('../server/constants');
var config = require('../config');
var log = console.log.bind(console);
var conn;

if(require.main === module) {
    setupDb();
} else {
    module.exports = setupDb;
}

function setupDb(isTest) {
    var DB_NAME = CONST.DB.NAME;
    if (isTest) {
        DB_NAME = 'Test';
    }

    var options;
    if (config && config.db) {
        options = config.db;
    } else {
        options = {
            host: '45.55.136.206'
        };
    }

    log('connecting to rethinkdb server at', options.host);
    r.connect(options)
        .then(saveConnection)
        .then(listTables)
        .then(createDatabase)
        .then(createTables)
        .then(addIndexes)
        .finally(process.exit);


    function saveConnection(_conn) {
        conn = _conn;
    }

    function listTables() {
        log('getting database list');
        return r.dbList().run(conn);
    }

    function createDatabase(list) {
        if (list.indexOf(DB_NAME) === -1) {
            log('creating database', DB_NAME);
            return r.dbCreate(DB_NAME).run(conn)
                .then(function () {
                    conn.use(DB_NAME);
                });
        } else {
            log('database', DB_NAME, 'already exists');
        }
    }

    function createTables() {
        log('getting table list for', DB_NAME);
        return r.db(DB_NAME).tableList().run(conn)
            .then(function (tableList) {
                console.log(tableList);
                Object.keys(CONST.DB.TABLES).forEach(function(TABLE) {
                    var table = CONST.DB.TABLES[TABLE];
                    if (tableList.indexOf(table) === -1) {
                        log('creating table', table);
                        r.tableCreate(table).run(conn);
                    } else {
                        log('table', table, 'already exists');
                    }
                });
            });
    }

    function addIndexes(tablesPromise) {
        if (!tablesPromise) tablesPromise = new Promise(function(r){r()});
        var promises = [];
        for (var TABLE in CONST.DB.TABLES) {
            var table = CONST.DB.TABLES[TABLE];
            if (CONST.DB.INDEXES[TABLE].length > 0) {
                log('adding indexes for table', table);
            } else {
                log('no indexes specified for table', table);
            }
            for (var i = 0; i < CONST.DB.INDEXES[TABLE].length; i++) {
                var index = CONST.DB.INDEXES[TABLE][i];
                log('adding index on `' + index + '` for table `' + table + '`');
                promises.push(tablesPromise.then(function() {
                    return r.db(DB_NAME).table(table).indexCreate(index).run(conn).catch(function () {
                        log('index `' + index + '` already exists on table `' + table + '`');
                    });
                }));
            }
        }
        return Promise.all(promises);
    }
}

function nil(){}