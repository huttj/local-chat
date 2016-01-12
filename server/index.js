const app          = require('http').createServer(handler),
      io           = require('socket.io')(app),
      fs           = require('fs'),
      log          = require('log'),
      socketLogger = require('socket-logger'),
      events       = require('event-handlers');

const PORT = process.env.PORT;

function handler (req, res) {
  log('GET', req.url);
  fs.readFile(__dirname + '/../index.html', sendFile);
  function sendFile(err, data) {
    if (err) {
      log(err.message);
      res.writeHead(500);
      return res.end('Error loading index.html');
    }

    res.writeHead(200);
    res.end(data);
  }
}

io.on('connection', socket => {
  "use strict";
  log('new connection');
  socketLogger(socket);
  events(socket);
});

app.listen(PORT, () => log('listening on ' + PORT));