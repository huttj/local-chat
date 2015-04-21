var DB = require('./db')(null, {
    DB: 'LocalChat',
    TABLES: {
        USERS: 'Users',
        CHATS: 'Chats',
        MESSAGES: 'Messages'
    }
});

var log = console.log.bind(console);
var success = console.log.bind(console, 'success');
var fail = function (e) {
    console.log((e && e.stack) || e);
};

function end() {
    process.exit(1);
}

//db.register('Anon', secret()).then(log);

//DB.Users.register().then(log).catch(fail);

//DB.Users.authenticate('Anon463211', 'rUD9v4').then(success).catch(fail).finally(end);

//DB.Users.authenticate('EU9WKd', '2064864807').then(success).catch(fail).finally(end);
//DB.Users.addPhone('f30d58a4-e9f2-4376-8fee-dad94d33d0a1', '2064864812').then(success).catch(fail).finally(end);

DB.Users.changeName('ffbdac60-03be-4f4c-9597-c18cce6b18b9', 'Anon1221').then(success).catch(fail);
// DB.Users.resetKey('ffbdac60-03be-4f4c-9597-c18cce6b18b9').then(success).catch(fail);
//DB.Users.resetKey('f30d58a4-e9f2-4376-8fee-dad94d33d0a1').then(success).catch(fail).finally(end);
//DB.Chats.post('f30d58a4-e9f2-4376-8fee-dad94d33d0a1', 'Hey guise', 'Seattle, WA').then(success).catch(fail).finally(end);
//DB.Chats.getPosts('Seattle, WA').then(success).catch(fail).finally(end);