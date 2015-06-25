var r = require('rethinkdb');
var CONST = require('./../constants');
var DB;

var Messages = {};

Messages.send = function(senderId, recipientId, message, location) {
    var payload = {
        senderId: senderId,
        recipientId: recipientId,
        message: message,
        location: location,
        sentOn: Number(new Date())
    };

    return DB.load(function (r) {
        return DB.exec(
            table(r).insert(payload)
        );
    });
};

Messages.getMessages = function() {
    return DB.load(function (r) {
        return DB.exec(
            table(r)
                .filter(r.row('location').eq(location).and(r.row.hasFields('sentOn')))
                .orderBy(r.desc('sentOn'))
                .eqJoin('userId', r.db(CONST.DB).table(CONST.TABLES.USERS))
                .zip()
                .map(function(n) {
                    return {
                        chatId   : n('id'),
                        userId   : n('userId'),
                        chat     : n('chat'),
                        sentOn   : n('sentOn'),
                        location : n('location'),
                        username : n('username')
                    }
                })
        )
            .then(DB.toArray);
    })
};

Messages.watchPosts = function(location) {
    return DB.load(function (r) {
        return DB.exec(
            table(r)
                .filter(r.row('location').eq(location))
                .orderBy(r.desc('sentOn'))
                .eqJoin('userId', r.db(CONST.DB).table(CONST.TABLES.USERS))
                .zip()
                .map(function(n) {
                    return {
                        chatId   : n('id'),
                        userId   : n('userId'),
                        chat     : n('chat'),
                        sentOn   : n('sentOn'),
                        location : n('location'),
                        username : n('username')
                    }
                })
                .changes()
        )
            .then(DB.toArray);
    });
};

function table(r) {
    return r.db(CONST.DB.NAME).table(CONST.DB.TABLES.MESSAGES);
}

module.exports = function(_DB) {
    DB      = _DB;
    return Messages;
};