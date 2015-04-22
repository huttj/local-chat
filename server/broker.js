/**
 * Created by joshua.hutt on 4/13/2015.
 */
var Promise = require('bluebird');
var assert  = require('assert');
var DB, Pusher;

var Broker = {};

var sessions = {
    users: {},
    locations: {}
};

Broker.addUser = function addUser(user, callback) {
    return new Promise(function(resolve, reject) {
        try {
            assert(user, 'no user provided to `Broker.addUser`');
            assert(user.id, 'userId not provided to `Broker.addUser`');
            assert(user.location, 'location not provided to `Broker.addUser`');
            assert(user.socket, 'socket not provided to `Broker.addUser`');
            assert(user.username, 'username not provided to `Broker.addUser`');

            sessions.users[user.id] = user;
            sessions.locations[user.location] = user;

            resolve();
        } catch (e) {
            reject(e);
        }
    }).nodeify(callback);
};

Broker.getMessages = function getMessages(location) {};

Broker.getUsers = function getUsers(location) {};

Broker.setLocation = function setLocation(location, callback) {

};

Broker._getSessions = function _getSessions() {
    return sessions;
};

module.exports = function(_DB, _Pusher) {
    DB = _DB;
    Pusher = _Pusher;
    return Broker;
};