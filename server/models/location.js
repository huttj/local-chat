var assert = require('assert');
var Promise = require('bluebird');

var Location = function Location(data) {
    if (this.prototype.constructor !== Location) {
        return new Location(data);
    }

    assert(data, 'initialization data not provided to Location constructor');
//    assert(data.id, 'location id not provided to Location constructor');
    assert(data.name, 'location name not provided to Location constructor');

    // Todo: locationName should be the id key
//    this.id           = data.id;
    this.name         = data.name;
    this.chats        = data.chats || [];

    this.numUsers     = 0;
    this.numConnected = 0;
    this.users        = {};
};

Location.prototype.addUser = function addUser(user) {
    this.numUsers++;
    this.users[user.id] = user;
};

Location.prototype.removeUser = function removeUser(user) {
    var userId = user.id ? user.id : user;
    this.numUsers++;
    delete this.users[userId];
};

// For chats and user activity (e.g., 'user connected')
Location.prototype.notify = function notify(payload, callback) {
    var self = this;
    return Promise.try(function () {

        // Each sending attempt
        var sent = [];

        // Try to send to each user
        for (var id in self.users) {
            try {
                sent.push(self.users[id].notify(payload));
            } catch (e) {
                // User must be offline or undefined
                delete self.users[id];
                self.userCount--;
            }
        }

        // When sending succeeds or fails for all, we are done
        return Promise.all(sent).catch(nil).then(function() {
            // sent to this many users
            return sent.length;
        });

    }).nodeify(callback);
};

// For initial "get location"
Location.serialize = function serialize() {
    var self = this;
    var users = Object.keys(self.users).reduce(function(userId) {
        var user = self.users[userId];
        return {
            id: user.id,
            username: user.username,
            createdOn: user.createdOn,
            connected: user.socket.connected
        };
    }, []);

    return {
        //id: this.id,
        name: this.name,
        messages: this.messages,
        users: users
    }
};

function nil() {}

module.exports = Location;