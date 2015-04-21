var DB;
var CONST = require('./../constants');
var Chats= {};

Chats.post = function(userId, chat, location) {
    var payload = {
        userId: userId,
        chat: chat,
        location: location,
        sentOn: Number(new Date())
    };

    return DB.load(function (r) {
        return DB.exec(
            table(r).insert(payload)
        );
    });
};

Chats.getPosts = function(location) {
    return DB.load(function (r) {
        return DB.exec(
            table(r)
            .filter(r.row('location').eq(location).and(r.row.hasFields('sentOn')))
            .orderBy(r.desc('sentOn'))
            .limit(2)
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


function table(r) {
    return r.db(CONST.DB).table(CONST.TABLES.CHATS);
}

module.exports = function(_DB, _helpers) {
    DB      = _DB;
    helpers = _helpers;
    return Chats;
};