const express = require('express');
const { default: ParseServer, ParseGraphQLServer } = require('parse-server');
const ParseDashboard = require('parse-dashboard');
const dotenv = require('dotenv');
const gql = require('graphql-tag');
const fs = require('fs');

dotenv.config();

const DB_URI = process.env.DATABASE_URI || "mongodb://localhost:27017/refresco";
const CLOUD_CODE = process.env.CLOUD_CODE_MAIN || "cloud/main.js";
const APP_ID = process.env.APP_ID || "9UBUIZ0VeTdGe6YfwEg7KBbL8LSoM8ONAMQyLKzw";
const MASTER_KEY = process.env.MASTER_KEY || "UIBXVLMy8cFCE1bqxUW0Bh5pPWC5FejtH4BDga1j";
const SERVER_URL = process.env.SERVER_URL || "http://localhost:1337";

const customSchema = fs.readFileSync('cloud/schema.graphql');

const app = express();

const parseServer = new ParseServer({
  databaseURI: DB_URI,
  cloud: CLOUD_CODE,
  appId: APP_ID,
  masterKey: MASTER_KEY,
  serverURL: SERVER_URL + '/parse',
});

const parseGraphQLServer = new ParseGraphQLServer(
  parseServer,
  {
    graphQLPath: '/graphql',
    playgroundPath: '/playground',
    graphQLCustomTypeDefs: gql`${customSchema}`,
  }
);

const parseDashboard = new ParseDashboard({
  apps: [
    {
      serverURL: SERVER_URL + '/parse',
      appId: APP_ID,
      masterKey: MASTER_KEY,
      appName: 'Refresco',
      graphQLServerURL: SERVER_URL + '/graphql'
    }
  ]
});


parseGraphQLServer.applyGraphQL(app); // Mounts the GraphQL API
parseGraphQLServer.applyPlayground(app); // (Optional) Mounts the GraphQL Playground - do NOT use in Production
app.use('/parse', parseServer.app); // (Optional) Mounts the REST API
app.use('/dashboard', parseDashboard);
// Endpoint for health check
app.get('/health', function (req, res) {
  res.status(200).send('OK');
});

app.listen(process.env.PORT || 1337, function () {
  console.log('REST API running on ' + SERVER_URL + '/parse');
  console.log('Parse Dashboard running on ' + SERVER_URL + '/dashboard');
  console.log('GraphQL API running on ' + SERVER_URL + '/graphql');
  console.log('GraphQL Playground running on ' + SERVER_URL + '/playground');
});