'use strict';
require('dotenv-safe').load();

const r     = require('rethinkdb'),
      CONST = require('../server/node_modules/constants'),
      log   = console.log.bind(console);

if (require.main === module) {
  setupDb();
} else {
  module.exports = setupDb;
}

function setupDb(isTest) {
  const DB_NAME = isTest ? 'Test' : CONST.DB.NAME;
  const options = process.env.RETHINK_URI;

  let conn;

  log('connecting to rethinkdb server at', options);
  r.connect(options)
    .then(saveConnection)
    .then(listTables)
    .then(destroyDatabase)
    .then(createDatabase)
    .then(createTables)
    .then(addIndexes)
    .catch(e => log('Error:', e))
    .then(process.exit);


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
        .then(() => conn.use(DB_NAME));
    }
  }

  function createDatabase() {
    log('creating database', DB_NAME);
    return r.dbCreate(DB_NAME).run(conn)
      .then(() => conn.use(DB_NAME));
  }

  function createTables() {
    log('getting table list for', DB_NAME);
    return r.db(DB_NAME).tableList().run(conn)
      .then(function (tableList) {

        console.log(tableList);

        const tableCreation = Object.keys(CONST.DB.TABLES)
          .reduce((l, TABLE) => {
            const table = CONST.DB.TABLES[TABLE];

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

    for (let TABLE in CONST.DB.TABLES) {

      const table   = CONST.DB.TABLES[TABLE];
      const indexes = CONST.DB.INDEXES[TABLE];

      if (indexes.length > 0) {

        log('adding indexes for table', table);

        indexes.forEach(function (index) {

          log('adding index on `' + index + '` for table `' + table + '`');

          const createIndex = r.db(DB_NAME).table(table).indexCreate(index).run(conn)
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
    log(`index \`${index}\` already exists on table \`${table}\``, e);
  }
}

function nil() {}