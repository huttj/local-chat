/**
 * Created by joshua.hutt on 4/13/2015.
 */

// External dependencies
var Promise  = require('bluebird');
var assert   = require('assert');

// Models
var User     = require('./models/user');
var Location = require('./models/location');

// Injected dependencies
var DB, Pusher;

var Broker = {};

// References to connected clients,
// accessible via two paths: userId & locationName
var sessions = {
    users: {},
    locations: {}
};

Broker.addUser = function addUser(userData, callback) {
    return new Promise(function(resolve, reject) {
        try {
            assert(userData, 'no user provided to `Broker.addUser`');
            assert(userData.id, 'userId not provided to `Broker.addUser`');
            assert(userData.locationName, 'locationName not provided to `Broker.addUser`');
            assert(userData.socket, 'socket not provided to `Broker.addUser`');
            assert(userData.username, 'username not provided to `Broker.addUser`');

            var user = new User(userData);

            sessions.users[user.id] = user;
            sessions.locations[user.locationName].addUser(user);

            resolve();
        } catch (e) {
            reject(e);
        }
    }).nodeify(callback);
};

Broker.addLocation = function addLocation(locationData) {
    assert(locationData.updatedOn, 'locationData provided to `Broker.addLocation` must have an `updatedOn` field for conflict resolution');
    if (sessions.locations[location.name]) {
        // merge
    } else {
        sessions.locations[location.name] = new Location(locationData);
    }
};

Broker.notifyUser = function notifyUser(userId, payload, callback) {
    return Promise.try(function() {
        assert(userId, 'userId not provided to `Broker.notifyUser`');
        assert(payload, 'payload not provided to `Broker.notifyUser`');

        var online = sessions.users[userId];

        try {
            // Send via socket; falls back to queue if
            var connected = sessions.users[userId].notify(payload);
            if (!connected) {
                Pusher.notify(userId, payload).then(resolve).catch(reject);
            }
        } catch (e) {
            // try push
            Pusher.notify(userId, payload).then(resolve).catch(reject);
        }
    }).nodeify(callback);
};

Broker.notifyUsersLocation = function notifyUsersLocation(userId, payload, callback) {
    return Promise.try(function () {
        var locationName = sessions.users[userId].locationName;
        return Broker.notifyLocation(locationName, payload);
    }).nodeify(callback);
};

Broker.notifyLocation = function notifyLocation(locationName, payload, callback) {
    return Promise.try(function() {
        assert(userId, 'location name not provided to `Broker.notifyLocation`');
        assert(payload, 'payload not provided to `Broker.notifyLocation`');

        if (!sessions.locations[locationName]) {
            // Location not in memory; this should not happen, as locations are loaded when
            // user first goes there, but let's just load and see
            return initializeLocation(locationName).then(function () {
                return sessions.locations[locationName].notify(payload);
            });
        } else {
            return sessions.locations[locationName].notify(payload);
        }

    }).nodeify(callback);
};

Broker.isOnline = function isOnline(userId) {
    try {
        return sessions.users[userId];
    } catch (e) {
        return false;
    }
};

Broker.getChats = function getMessages(locationName) {
    // Get chats from 'initialized' Location
    if (sessions.locations[locationName]) {
        return Promise.try(function () {
            return sessions.locations[locationName].chats;
        })
    } else {
        // OR
        // Initialized location and get chats
        return initializeLocation(locationName).then(function () {
            return sessions.locations[locationName].chats;
        })
    }
};

Broker.getUsers = function getUsers(locationName) {};

Broker.setLocation = function setLocation(userId, locationName, callback) {
    return Promise.try(function () {
        // Unset old location
        var oldLocationName = sessions.users[userId].locationName;
        sessions.locations[oldLocationName].removeUser(locationName);

        // Set new location
        sessions.locations[locationName].addUser(locationName);
        sessions.users[userId].setLocation(locationName);
    }).nodeify(callback);
};

Broker._getSessions = function _getSessions() {
    return sessions;
};

function initializeLocation() {
    return DB.Locations.getOrAddLocation(locationName).then(function(locationData) {
        Broker.addLocation(locationData);
        return locationData;
    });
}

module.exports = function(_DB, _Pusher) {
    DB = _DB;
    Pusher = _Pusher;
    return Broker;
};