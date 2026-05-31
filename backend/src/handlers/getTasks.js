const { ScanCommand } = require("@aws-sdk/lib-dynamodb");
const { config } = require("../config");
const { documentClient } = require("../lib/dynamodb");
const { handleError, jsonResponse } = require("../lib/http");

async function handler(event = {}) {
  try {
    const command = new ScanCommand({
      TableName: config.tableName
    });

    console.log("Calling DynamoDB...");

    const result = await documentClient.send(command);

    console.log("DynamoDB call success", {
      statusCode: result.$metadata?.httpStatusCode,
      requestId: result.$metadata?.requestId
    });

    const tasks = (result.Items || []).sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    return jsonResponse(200, { tasks });
  } catch (error) {
    return handleError(error);
  }
}

module.exports = { handler };
