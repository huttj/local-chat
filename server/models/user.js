var assert = require('assert');
var Promise = require('bluebird');

var userProps = [
    'id',
    'username',
    'locationName',
    'socket'
];

var User = function User(data) {
    assert(data, 'initialization data not provided to user constructor');

    if (this.prototype.constructor !== User) {
        return new User(data);
    }

    userProps.forEach(function (prop) {
        assert(data[prop], 'required property ' + prop + ' not provided to user constructor');
        this[prop] = data[prop];
    });
};

User.prototype.setLocation = function setLocation(locationName) {
    this.locationName = locationName;
};

User.prototype.notify = function notify(payload, callback) {
    var self = this;
    return new Promise(function () {
        try {
            self.socket.send(payload);
            resolve();
        } catch (e) {
            reject(e);
        }
    }).nodeify(callback);
};

module.exports = User;