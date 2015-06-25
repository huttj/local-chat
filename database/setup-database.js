var r = require('rethinkdb');
var Promise = require('bluebird');
var CONST = require('../server/constants');

var ENV = process.argv[2] || 'DEV';
var config = require('./../config')[ENV];

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

    var options = config.db;

    log('connecting to rethinkdb server at', options);
    r.connect(options)
        .then(saveConnection)
        .then(listTables)
        .then(destroyDatabase)
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

    function destroyDatabase(list) {
        if (list.indexOf(DB_NAME) !== -1) {
            log('destroying database', DB_NAME);
            return r.dbDrop(DB_NAME).run(conn)
                .then(function () {
                    conn.use(DB_NAME);
                });
        }
    }

    function createDatabase() {
        log('creating database', DB_NAME);
        return r.dbCreate(DB_NAME).run(conn)
            .then(function () {
                conn.use(DB_NAME);
            });
    }

    function createTables() {
        log('getting table list for', DB_NAME);
        return r.db(DB_NAME).tableList().run(conn)
            .then(function (tableList) {

                console.log(tableList);

                var tableCreation = Object.keys(CONST.DB.TABLES).reduce(function(l, TABLE) {
                    var table = CONST.DB.TABLES[TABLE];
                    if (tableList.indexOf(table) === -1) {
                        log('creating table', table);
                        l.push(r.tableCreate(table).run(conn));
                    } else {
                        log('table', table, 'already exists');
                    }
                    return l;
                }, []);

                return Promise.all(tableCreation);
            });
    }

    function addIndexes() {
        var createIndexPromises = [];

        for (var TABLE in CONST.DB.TABLES) {

            var table   = CONST.DB.TABLES[TABLE];
            var indexes = CONST.DB.INDEXES[TABLE];

            if (indexes.length > 0) {

                log('adding indexes for table', table);

                indexes.forEach(function(index) {

                    log('adding index on `' + index + '` for table `' + table + '`');

                    var createIndex = r.db(DB_NAME).table(table).indexCreate(index).run(conn)
                        .catch(indexError.bind(null, index, table));

                    createIndexPromises.push(createIndex);
                });

            } else {
                log('no indexes specified for table', table);
            }
        }

        return Promise.all(createIndexPromises);
    }

    function indexError(index, table, e) {
        log('index `' + index + '` already exists on table `' + table + '`', e);
    }
}

function nil(){}