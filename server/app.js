var https = require('https');
var app = require('http').createServer(handler);
var io = require('socket.io')(app);
var fs = require('fs');

var config;

var API_KEY = require('./config.js').API_KEY;

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

module.exports = function createServer(_config) {
    config = _config;
    return {
        start: function(port) {
            app.listen(3030, console.log.bind(console, 'listening on ' + port));
        },
        io: io
    };
};