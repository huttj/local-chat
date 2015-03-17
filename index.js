
var https = require('https');
var app = require('http').createServer(handler);
var io = require('socket.io')(app);
var fs = require('fs');

var API_KEY = require('./config.js').API_KEY;

app.listen(3030);

function handler (req, res) {
    fs.readFile(__dirname + '/index.html',
        function (err, data) {
            if (err) {
                res.writeHead(500);
                return res.end('Error loading index.html');
            }

            res.writeHead(200);
            res.end(data);
        });
}

var sockets = [];

io.on('connection', function (socket) {
    sockets.push(socket);

    socket.on('get location', function (position) {
        console.log(position);
        getLocation(position, function(location) {
            socket.emit('get location', location);
        });
    });

    socket.on('set location', function(location) {
        var count = countUsersAtLocation(location.code);
        socket.location = location.code;
        var message = 'You are in ' + location.name + '.';
        if (count) {
            message += ' Chatting with ' + count + ' other user' + (count === 1 ? '' : 's') + '.';
        } else {
            message += ' You\'re the only one here.';
        }
        socket.emit('set location', message);
    });

    socket.on('message', function(msg) {
        console.log(msg);
        sendMessage(socket, {
            message: msg,
            sent: Number(new Date())
        }, socket);
    });

});

// Counts the users at the selected location and removes disconnected users in the process
function countUsersAtLocation(name) {
    var count = 0;
    var connected = [];
    for (var i = 0; i < sockets.length; i++) {
        // Remove references to disconnected sockets at the same time
        if (sockets[i].connected) {
            connected.push(sockets[i]);
            if (sockets[i].location === name) count++;
        }
    }
    sockets = connected;
    return count;
}

function sendMessage(sender, msg) {
    sockets.forEach(function(socket) {
        // Maybe try simple equality before regex
        // Todo: More rigorous regex
        if (sender.location && sender.location.match(socket.location)) {
            msg.you       = socket === sender;
            msg.sameLevel = sender.location === socket.location;
            socket.emit('message', msg);
        }
    });
}

function lookupLocation(position, cb) {

    var latlng = position.coords.latitude + ',' + position.coords.longitude;

    https.get('https://maps.googleapis.com/maps/api/geocode/json?latlng=' + latlng + '&key=' + API_KEY, function(res) {
        var str = '';
        res.on('data', function(chunk) {
            str += chunk;
        });
        res.on('end', function() {
            try {
                var result = JSON.parse(str);
                cb && cb(null, result);
            } catch (err) {
                cb && cb(err, null);
            }
        });
    });
}

function getLocation(position, cb) {
    lookupLocation(position, function(err, res) {
        cb && cb(res.results[0].address_components);
    });
}

function getName(res) {

    try {
        var place = res.results[0].address_components;

        console.log(place);

        var hood = place[2];
        var state = place[5];

        return hood.short_name + ', ' + state.short_name;

    } catch (e) {

        return 'unknown';
    }
}

function lookupName(position, cb) {
    lookupLocation(position, function(err, res) {
        cb && cb(getName(res));
    });
}