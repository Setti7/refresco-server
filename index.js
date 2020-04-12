const express = require('express');
const { default: ParseServer, ParseGraphQLServer } = require('parse-server');
const ParseDashboard = require('parse-dashboard');
const dotenv = require('dotenv');
const gql = require('graphql-tag');

dotenv.config();

const app = express();

var databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI;

const parseServer = new ParseServer({
  databaseURI: databaseUri,
  cloud: process.env.CLOUD_CODE_MAIN,
  appId: process.env.APP_ID,
  masterKey: process.env.MASTER_KEY,
  serverURL: process.env.SERVER_URL + '/parse',
});

const parseGraphQLServer = new ParseGraphQLServer(
  parseServer,
  {
    graphQLPath: '/graphql',
    playgroundPath: '/playground',
    graphQLCustomTypeDefs: gql`
      extend type Query {
          getBestStores(minimumRating: Int!): [Store!]! @resolve(to: "getBestStores")
      }

      extend type Mutation {
          initOrder(objectId: ID!, message: String): Order @resolve(to: "initOrder")
      }
    `
  }
);

const parseDashboard = new ParseDashboard({
  apps: [
    {
      serverURL: process.env.SERVER_URL + '/parse',
      appId: process.env.APP_ID,
      masterKey: process.env.MASTER_KEY,
      appName: 'Refresco',
      graphQLServerURL: process.env.SERVER_URL + '/graphql'
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
  console.log('REST API running on ' + process.env.SERVER_URL + '/parse');
  console.log('Parse Dashboard running on ' + process.env.SERVER_URL + '/dashboard');
  console.log('GraphQL API running on ' + process.env.SERVER_URL + '/graphql');
  console.log('GraphQL Playground running on ' + process.env.SERVER_URL + '/playground');
});