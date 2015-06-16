var ENV = process.argv[2] || 'DEV';

var config = require('./config.js')[ENV];
var CONST  = require('./server/constants');

var DB     = require('./server/db')(config, CONST);
var app    = require('./server/app')(config);

var Mapper = require('./server/mapper')(config);

var Events = require('./server/events')(app, DB, Mapper);

app.start(config.port || 5000);