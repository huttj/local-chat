var io; // To attach event listeners to the incoming socket
var DB; // To interact with the data store
var Broker; // To manage clients and message passing between them
var Pusher; // To register push keys
var Mapper; // To reverse geocode to identify locations

var Events = {};

/**
 * Register the client for the first time
 * @param socket
 * @param payload
 */
Events.register = function authenticate(socket, payload, callback) {

    var response = {
        event: 'register',
        status: 'success'
    };

    // not registered; generate new secret and session key and send to client
    DB.Users.register(payload.username)
        .then(function addUser(user) {
            // Add user to Broker
            user.socket = socket;
            Broker.addUser(user);

            // Notify user
            response.payload = user;

            // If there's a recipt callback, use it
            if (callback) {
                callback(response.payload);

                // Otherwise, use the socket
            } else {
                socket.send(response);
            }
        })
        .catch(function registerFailed(e) {
            response.status = 'failed';
            response.message = e;
            delete response.payload;

            if (callback) {
                callback();
            } else {
                socket.send(response);
            }
        });
};

Events.login = function login() {

};

Events.authenticate = function authenticate(socket, payload, callback) {
    var response = {
        event: 'authenticate',
        status: 'success'
    };

    // Todo: User long-form `userId` and `locationId` everywhere; it's way easier to remember
    Broker.authenticate(payload.userId).then(function () {
        if (callback) {
            callback(true);
        } else {
            socket.send(response);
        }
        Broker.notifyUsersLocation(payload.userId, {
            event: 'userOnline',
            payload: {
                userId: payload.userId
            }
        });
    }).catch(function (e) {
        response.status = 'failed';
        response.message = (e && e.message) || e;
        if (callback) {
            callback(false);
        } else {
            socket.send(response);
        }
    });
};

Events.setPushKey = function setPushKey(socket, payload) {
    pusher.registerKey(payload);
};

Events.setLocation = function setLocation(socket, payload) {

    Mapper.lookupName(payload.coords)
        .then(setLocation)
        .then(getLocationData)
        .then(notify);

    function setLocation(locationName) {
        Broker.setLocation(payload.userId, locationName);
        return locationName;
    }
    function getLocationData(location) {
        return {
            messages:   Broker.getMessages(location),
            users:      Broker.getUsers(location)
        };
    }
    function notify(locationData) {
        socket.emit('event', {
            type: 'setLocation',
            payload: {
                location: {
                    name: locationName
                }
            }
        });
    }
};

Events.postToChat   = function postToChat(socket, payload) {};
Events.sendMessage  = function sendMessage(socket, payload) {};
Events.setNick      = function setNick(socket, payload) {};
Events.refresh      = function refresh(socket, payload) {};

Events.disconnect   = function disconnect(socket, payload) {
    // Notify location to make sure user not visible in "who's here"
    Broker.notifyUsersLocation(payload.userId, {
        event: 'userOffline',
        payload: {
            userId: payload.userId
        }
    });
};

io.on('connection', function addListener(socket) {

    // Double-check
    if (socket.send) throw 'socket.send() already exists';

    // Clean method to send message to user
    socket.send = function send(packet, callback) {
        socket.emit('event', packet, callback);
    };

    socket.on('event', function (packet, callback) {
        // check that packet is valid (has event, packet, etc)
        if (!packet.type || !packet.payload) {
            // Silently ignore
            return;
            //socket.emit('event', {
            //    type: packet.type || 'none',
            //    payload: packet,
            //    message: 'Invalid request received',
            //    success: false
            //});
        }

        // Check that the session is valie
        if (!authenticate(packet)) return;

        // check that event type is supported
        if (Events[packet.type]) {
            // Execute event
            Events[packet.type](socket, packet.payload, callback);
        }
    });

});

module.exports = function attachEvents(_app, _DB, _Broker, _Pusher, _Mapper) {
    io      = _app.io;
    DB      = _DB;
    Broker  = _Broker;
    Pusher  = _Pusher;
    Mapper = _Mapper;
    return
};