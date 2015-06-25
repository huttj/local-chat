var io; // To attach event listeners to the incoming socket
var DB; // To interact with the data store
var log     = require('./log');
var Promise = require('bluebird');
var Mapper; // To reverse geocode to identify locations

var Events = {};

/**
 * Register the client for the first time. Create a new user with random
 * or passed-in username. Creates a session key and sends user details
 * to the client.
 */
Events.register = function register(socket, packet, callback) {

    var payload = packet.payload;
    var response = {
        event   : 'register'
    };

    // not registered; generate new secret and session key and send to client
    DB.Users
        .register(payload.username)
        .then(function addUser(user) {
            log('created user', user);
            socket.user = {
                userId     : user.userId,
                username   : user.username,
                sessionKey : user.sessionKey
            };

            // Notify user
            response.payload = user;
            response.success = true;

            // If there's a receipt callback, use it
            if (packet.callback) {
                callback(null, response.payload);

                // Otherwise, use the socket
            } else {
                socket.emit('register', response);
            }
        })
        .catch(function registerFailed(e) {
            log('register failed', e);

            response.success = false;
            response.message = e;

            if (packet.callback) {
                callback(e);
            } else {
                socket.emit('register', response);
            }
        });
};

/**
 * Log in with a OTP
 * Todo(Joshua): Implement this (add phone, email, etc.)
 */
Events.login = function login(socket, packet, callback) {
    var payload = packet.payload;
    var response = {
        event: 'login'
    };
    // DB.Users.login(payload.username, payload.twoFactorKey)
};

/**
 * Authenticate w/ saved credentials. If this event is triggered, we
 * know the client is authenticated, since it's _behind_ the
 * `authenticate` helper.
 */
Events.authenticate = function authenticate(socket, packet, callback) {
    var payload = packet.payload;
    var response = {
        event: 'authenticate',
        success: true
    };
    if (packet.callback) {
        callback(null, true);
    } else {
        socket.send(response);
    }
};

/**
 * For push notifications on native devices; save push key to database.
 * Todo(Joshua)
 */
Events.setPushKey = function setPushKey() {
    DB.registerKey(payload);
};

/**
 * Called when the client's coordinates change. This event does a lot:
 *      1. Geocodes the user's coordinates
 *      2. Updates the user's location in the database and on the socket
 *      3. Gets the latest chats and current users at the location
 *      4. Subscribes to changes of chats and users
 */
Events.setLocation = function setLocation(socket, packet, callback) {
    var response = { event: 'setLocation' };
    var payload = packet.payload;

    var location = Mapper.lookupName(payload.coords)
        .then(function(location) {
            if (location === socket.user.location) {
                log('Location not changed');
                throw new Error('Location not changed');
            }
            return socket.user.location = location;
        });

    Promise.all([
        location.then(setLocation),
        location.then(getChatsAndUsers),
        location.then(subscribeToLocation),
        location.then(notify)
    ]).catch(handleError);

    function setLocation(location) {
        log(location);
        DB.Users.setLocation(packet.userId, location);
        response.success = true;
    }

    function getChatsAndUsers(location) {
        DB.Chats.getChats(location)
            .tap(function(chats) {
                log(chats.length, 'chats');
                socket.emit('chats', chats);
            });
        DB.Users.getUsers(location)
            .then(function(users) {
                log(users.length, 'users at', location);
                socket.emit('users', users);
            });
        return location;
    }

    function subscribeToLocation(location) {
        disconnectLocationSubs(socket);
        var subs = socket.subscriptions;

        subs.chats = DB.Chats.watchChats(location, function(err, chats) {
            if (err) {
                log('new chat error');
            } else {
                log('new chat(s)');
                socket.emit('chat', chats);
            }
        });

        subs.users = DB.Users.watchUsers(location, function(err, users) {
            if (err) {
                log('on/offline user error');
            } else {
                log('on/offline user(s)');
                socket.emit('user', users);
            }
        });

    }

    function notify(locationData) {
        if (packet.callback) {
            callback(locationData);
        } else {
            socket.send(response);
        }
    }

    function handleError(err) {
        if (err.message === 'Location not changed') return;

        log.error(err);
        response.success = false;
        if (packet.callback) {
            callback(err);
        } else {
            socket.send(response);
        }
    }
};

/**
 * Sends a chat to the socket's current location
 */
Events.sendChat = function sendChat(socket, packet, callback) {
    var payload = packet.payload;
    var response = {
        event: 'sendChat'
    };

    var userId   = packet.userId;
    var body     = payload.body;
    var location = socket.user.location;

    if (!location) {
        return failure(new Error('You cannot send a chat until your location is available.'));
    } else if (!body) {
        return failure(new Error('You cannot send an empty chat.'));
    } else {
        DB.Chats.sendChat(userId, body, location)
            .then(success)
            .catch(failure);
    }

    function success() {
        log('chat sent', socket.username, body);
        if (packet.callback) {
            callback(null);
        } else {
            response.success = true;
            socket.send(response);
        }
    }

    function failure(err) {
        log('chat send failed', err.stack);
        if (packet.callback) {
            callback(err);
        } else {
            response.success = false;
            response.message = (err.message || err);
            socket.send(response);
        }
    }
};

Events.changeUsername = function changeUsername(socket, packet, callback) {
    var payload = packet.payload;
    var response = {
        event: 'changeUsername'
    };

    var userId   = packet.userId;
    var username = packet.username;
    var newName  = payload;

    DB.Users.changeUsername(userId, newName)
        .then(setUsername)
        .then(success)
        .catch(failure);

    function setUsername() {
        socket.user.username = newName;
    }

    function success() {
        log('username changed', socket.user.username);
        // Todo(Joshua): Figure out why Socket.io thinks there's a callback here
        if (packet.callback) {
            callback(null, newName);
        } else {
            response.success = true;
            response.payload = newName;
            socket.send(response);
        }
    }

    function failure(err) {
        log('username change failed', err.stack);
        if (packet.callback) {
            callback(err);
        } else {
            response.success = false;
            response.message = (err.message || err);
            socket.send(response);
        }
    }
};

Events.refresh = function refresh() {};

Events.disconnect = function disconnect(socket) {
    // Notify location to make sure user not visible in "who's here"
    try {
        log(socket.user.username + ' disconnected');
        DB.Users.disconnect(socket.user.userId);
        disconnectLocationSubs(socket);
    } catch (e) {
        log('Unauthenticated user disconnected')
    }
};

module.exports = function attachEvents(_app, _DB, _Mapper) {
    io      = _app.io;
    DB      = _DB;
    Mapper  = _Mapper;

    // Events whose packets will not be passed through the `authenticate` handler
    var nonAuthEvents = ['register', 'disconnect'];

    io.on('connection', function bindEvents(socket) {

        // Intercept `on` callbacks and `emit`, log events
        socket = logWrap(socket);

        log('new client', socket.id, socket.request.connection.remoteAddress);

        if (!socket.send) {
            socket.send = function send(packet, callback) {
                log('sending', packet.event);
                socket.emit(packet.event, packet, callback);
            }
        }

        Object.keys(Events).forEach(function bindEvent(event) {
            socket.on(event, function eventReceived(socket, packet, callback) {

                // Check that event type is supported
                if (!Events[event]) {
                    log('event not supported', event);

                    // Check that the session is valid
                } else if (-1 === nonAuthEvents.indexOf(event)) {
                    authenticate(socket, packet).then(handleEvent, notAuthenticated);

                    // Pass the event to the event handler
                } else {
                    handleEvent();
                }

                function handleEvent() {
                    Events[event](socket, packet, callback);
                }

                function notAuthenticated(e) {
                    log('not authenticated', packet, e);
                    if (packet.callback) callback('You are not authenticated.');
                    socket.emit('authenticate', {
                        event   : 'authenticate',
                        success : false,
                        message : 'You are not authenticated.'
                    });
                }

            }.bind(null, socket));
        });

    });

    log('Events loaded');

};

function logWrap(socket) {
    if (socket._wrapped) {
        log('already wrapped');
        return socket;
    }
    socket._wrapped = true;
    var _on = socket.on;
    var _emit = socket.emit;
    socket.on = function on(event, onHandler) {
        _on.call(socket, event, function(packet, cb) {
            if (!packet) return;
            //log('on', event, packet, cb ? 'hasCallback' : 'noCallback');
            log('on', event, packet.callback ? 'hasCallback' : 'noCallback');
            onHandler(packet, cb);
        });
    };
    socket.emit = function emit(event, packet, emitCallback) {
        if (!packet) return;
        //log('emit', event, packet, callback ? 'hasCallback' : 'noCallback');
        if (emitCallback) packet.callback = true;
        log('emit', event, packet.callback ? 'hasCallback' : 'noCallback');
        _emit.call(socket, event, packet, emitCallback);
    };
    socket.send = function send(packet, sendCallback) {
        if (!packet) return;
        if (sendCallback) packet.callback = true;
        log('send', packet.event);
        _emit.call(socket, packet.event, packet, sendCallback);
    };
    return socket;
}

function authenticate(socket, packet) {
    return Promise.try(function () {

        var userId     = packet.userId;
        var sessionKey = packet.sessionKey;

        if (!userId || !sessionKey) throw new Error('userId or sessionKey not provided');

        if (socket.user && socket.user.userId === userId && socket.user.sessionKey === sessionKey) {
            log('session in memory');
            return true;

        } else if (socket.user && socket.user.userId === userId) {
            return false;

        } else {
            log('looking up session in db');
            // Todo: Use long-form `userId` and `locationId` everywhere; it's way easier to remember
            return DB.Users.authenticate(userId, sessionKey)
                .then(function(user) {
                    // Todo(Joshua): Switch to a central sessions list?
                    socket.user = {
                        userId     : user.id,
                        username   : user.username,
                        sessionKey : user.sessionKey
                    };
                    return true;
                })
                .catch();
        }
    });
}

function disconnectLocationSubs(socket) {
    var subs = socket.subscriptions;
    if (subs) {
        subs.chats && subs.chats.then(closeCursor);
        subs.users && subs.users.then(closeCursor);
        function closeCursor(cursor) {
            cursor && cursor.close && cursor.close();
        }
    } else {
        socket.subscriptions = {};
    }
}