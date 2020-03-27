// Example express application adding the parse-server module to expose Parse
// compatible API routes.

var express = require('express');
var ParseServer = require('parse-server').ParseServer;
var ParseDashboard = require('parse-dashboard');
const dotenv = require('dotenv');

dotenv.config();

var databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI;

var api = new ParseServer({
  databaseURI: databaseUri,
  cloud: process.env.CLOUD_CODE_MAIN,
  appId: process.env.APP_ID,
  masterKey: process.env.MASTER_KEY, //Add your master key here. Keep it secret!
  serverURL: process.env.SERVER_URL + process.env.PARSE_MOUNT,  // Don't forget to change to https if needed
  liveQuery: {
    // classNames: ["Posts", "Comments"] // List of classes to support for query subscriptions
  }
});

// var api = new ParseServer({
//   databaseURI: 'mongodb://localhost:27017/parse',
//   cloud: __dirname + '/cloud/main.js',
//   appId: '9UBUIZ0VeTdGe6YfwEg7KBbL8LSoM8ONAMQyLKzw',
//   masterKey: 'UIBXVLMy8cFCE1bqxUW0Bh5pPWC5FejtH4BDga1j', //Add your master key here. Keep it secret!
//   serverURL: 'http://localhost:1337/parse',  // Don't forget to change to https if needed
//   liveQuery: {
//     classNames: ["Posts", "Comments"] // List of classes to support for query subscriptions
//   }
// });
// Client-keys like the javascript key or the .NET key are not necessary with parse-server
// If you wish you require them, you can set them as options in the initialization above:
// javascriptKey, restAPIKey, dotNetKey, clientKey

var app = express();

var dashboard = new ParseDashboard({
  "apps": [
    {
      "serverURL":  process.env.SERVER_URL + process.env.PARSE_MOUNT,
      "appId": process.env.APP_ID,
      "masterKey": process.env.MASTER_KEY,
      "appName": "Refresco"
    }
  ]
});

// Serve Parse Dashboard /dashboard
app.use('/dashboard', dashboard);

// Serve the Parse API at /parse
var mountPath = process.env.PARSE_MOUNT ;
app.use(mountPath, api);

// Endpoint for health check
app.get('/health', function (req, res) {
  res.status(200).send('OK');
});


var port = process.env.PORT || 1337;
var httpServer = require('http').createServer(app);
httpServer.listen(port, function () {
  console.log('Parse Server (and dashboard) started: ' + process.env.SERVER_URL + process.env.DASHBOARD_MOUNT);
});

// This will enable the Live Query real-time server
ParseServer.createLiveQueryServer(httpServer);
