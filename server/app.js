var https = require('https');
var app   = require('http').createServer(handler);
var io    = require('socket.io')(app);
var fs    = require('fs');
var log   = require('./log');

var config;

function handler (req, res) {
    log('GET', req.url);
    fs.readFile(__dirname + '/../index.html',
        function sendFile(err, data) {
            if (err) {
                log(err.message);
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
        start: function start(port) {
            app.listen(port, function() {
                log('listening on ' + port);
            });
        },
        io: io
    };
};