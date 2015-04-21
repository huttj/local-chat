var io; // To attach event listeners to the incoming socket
var DB; // To interact with the data store
var Broker; // To manage clients and message passing between them
var Pusher; // To register push keys
var Mapper; // To reverse geocode to identify locations

var events = {};

/**
 * Register the client for the first time
 * @param socket
 * @param payload
 */
events.authenticate = function authenticate(socket, payload) {

    // not registered; generate new secret and session key and send to client
    DB.register(payload.username)
        .then(addUser)
        .then(socket.send(response));

    function success(payload) {

    }
    function failure(payload) {
        socket.send()
    }

};

events.setPushKey   = function setPushKey(socket, payload) {
    pusher.registerKey(payload);
};

events.setLocation  = function setLocation(socket, payload) {

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

events.postToChat   = function postToChat(socket, payload) {};
events.sendMessage  = function sendMessage(socket, payload) {};
events.setNick      = function setNick(socket, payload) {};
events.refresh      = function refresh(socket, payload) {};

io.on('connection', function (socket) {

    // Double-check
    if (socket.send) throw 'socket.send() already exists';

    // Clean method to send message to user
    socket.send = function send(packet, callback) {
        socket.emit('event', packet, callback);
    };

    socket.on('event', function (packet) {
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
        if (events[packet.type]) {
            // Execute event
            events[packet.type](socket, packet.payload);
        }
    });

});



module.exports = function attachEvents(_app, _DB, _Broker, _Pusher, _Mapper) {
    io      = _app.io;
    DB      = _DB;
    Broker  = _Broker;
    Pusher  = _Pusher;
    Mapper = _Mapper;
};