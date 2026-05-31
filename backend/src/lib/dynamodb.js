const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");
const { config } = require("../config");

const clientOptions = {
  region: config.region
};

if (config.endpoint) {
  clientOptions.endpoint = config.endpoint;
  clientOptions.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "local",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "local"
  };
}

const client = new DynamoDBClient(clientOptions);

const documentClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true
  }
});

module.exports = { documentClient };
