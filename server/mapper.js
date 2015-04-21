var https = require('https');
var assert = require('assert');
var Promise = require('bluebird');

var API_KEY;

var Mapper = {};

Mapper.lookupLocation = function lookupLocation(coords, callback) {
    return new Promise(function(resolve, reject) {
        try {
            // Check for invalid values
            if (!coords || !coords.latitude || !coords.longitude) throw ('`coords` object must have latitude and longitude properties');
            if (Math.abs(coords.latitude) > 90 || Math.abs(coords.longitude) > 180) throw ('latitude must be between -90 to 90, longitude between -180 and 180');

            var latlng = coords.latitude + ',' + coords.longitude;
            https.get('https://maps.googleapis.com/maps/api/geocode/json?latlng=' + latlng + '&key=' + API_KEY, function (res) {
                var str = '';
                res.on('data', function (chunk) {
                    str += chunk;
                });
                res.on('end', function () {
                    try {
                        var result = JSON.parse(str);
                        resolve(result)
                    } catch (err) {
                        reject(err);
                    }
                });
            });
        } catch (e) {
            reject(e);
        }
    }).nodeify(callback);
};

Mapper.lookupName = function lookupName(position, callback) {
    return Mapper.lookupLocation(position).then(getName).nodeify(callback);
};

function getName(res) {
    try {
        var place = 'unknown';
        var i = 0;
        while (i < res.results.length && place === 'unknown') {
            place = getPlace(res.results[i].address_components);
            i++;
        }
        return place;
    } catch (e) {
        return 'unknown';
    }
}

function getPlace(components) {
    var hood, state;
    for (var i = 0; i < components.length; i++) {
        if (hood && state) return hood.short_name + ', ' + state.short_name;
        for (var j = 0; j < components[i].types.length; j++) {
            if (components[i].types[j] === 'neighborhood') {
                hood = components[i];
            } else if (components[i].types[j] === 'administrative_area_level_1') {
                state = components[i];
            }
        }
    }
    return 'unknown';
}


module.exports = function initLocator(_config) {
    API_KEY = _config.API_KEY;
    return Mapper;
};