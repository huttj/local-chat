var ENV = process.argv[2] || 'DEV';

var config = require('./config')[ENV];
var CONST  = require('./server/constants');

var DB     = require('./server/db')(config, CONST);
var app    = require('./server/app')(config);

var Pusher = require('./server/pusher')(config, DB);
var Broker = require('./server/broker')(DB, Pusher);
var Mapper = require('./server/mapper')(config);

var Events = require('./server/events')(app, DB, Broker, Pusher, Mapper);

app.start(config.port || 5000);