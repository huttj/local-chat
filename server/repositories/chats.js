var r = require('rethinkdb');
var CONST = require('./../constants');
var DB;

var Chats= {};

Chats.sendChat = function(userId, body, location) {
    var payload = {
        userId   : userId,
        body     : body,
        location : location,
        sentOn   : Number(new Date())
    };

    return DB.exec(table(r).insert(payload));
};

Chats.getChats = function(location) {
    return DB.exec(
        table(r)
            .filter(r.row('location').eq(location).and(r.row.hasFields('sentOn'))) // Todo(Joshua): Filter on time / count
            .orderBy(r.asc('sentOn'))
            .map(function(n) {
                return n.merge(r.db(CONST.DB.NAME).table(CONST.DB.TABLES.USERS).get(n('userId')).pluck('username'))
            })
    ).then(DB.toArray);
};

Chats.watchChats = function(location, callback) {
    var query = table(r)
        .filter(r.row('location').eq(location))
        .changes().getField('new_val')
        .map(function(n) {
            return n.merge(r.db(CONST.DB.NAME).table(CONST.DB.TABLES.USERS).get(n('userId')).pluck('username'))
        });

    return DB.exec(query)
        .then(function(cursor) {
            cursor.each(callback);
            return cursor;
        });
};


Chats.changeUsername = function(userId, username) {
    return DB.exec(
        table(r)
            .filter({ userId: userId })
            .update({ username: username })
    );
};

function table(r) {
    return r.db(CONST.DB.NAME).table(CONST.DB.TABLES.CHATS);
}

module.exports = function(_DB) {
    DB      = _DB;
    return Chats;
};