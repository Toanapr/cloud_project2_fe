const { GetCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const { config } = require("../config");
const { documentClient } = require("../lib/dynamodb");
const { getCurrentUserId } = require("../lib/auth");
const { handleError, jsonResponse, parseJsonBody } = require("../lib/http");
const { fail, validateTaskInput } = require("../lib/validation");

async function handler(event = {}) {
  try {
    const taskId = event.pathParameters?.id;
    if (!taskId) {
      fail(400, "task id is required.");
    }

    const getCommand = new GetCommand({
      TableName: config.tableName,
      Key: { taskId }
    });

    console.log("Calling DynamoDB...");

    const existing = await documentClient.send(getCommand);

    console.log("DynamoDB call success", {
      statusCode: existing.$metadata?.httpStatusCode,
      requestId: existing.$metadata?.requestId
    });

    const userId = getCurrentUserId(event);
    if (!existing.Item || existing.Item.userId !== userId) {
      fail(404, "task not found.");
    }

    const updates = validateTaskInput(parseJsonBody(event), { partial: true });
    const fields = Object.keys(updates);
    if (fields.length === 0) {
      fail(400, "at least one task field is required.");
    }

    const expressionNames = {};
    const expressionValues = {};
    const setExpressions = fields.map((field) => {
      expressionNames[`#${field}`] = field;
      expressionValues[`:${field}`] = updates[field];
      return `#${field} = :${field}`;
    });

    const updateCommand = new UpdateCommand({
      TableName: config.tableName,
      Key: { taskId },
      UpdateExpression: `SET ${setExpressions.join(", ")}`,
      ExpressionAttributeNames: expressionNames,
      ExpressionAttributeValues: expressionValues,
      ReturnValues: "ALL_NEW"
    });

    console.log("Calling DynamoDB...");

    const result = await documentClient.send(updateCommand);

    console.log("DynamoDB call success", {
      statusCode: result.$metadata?.httpStatusCode,
      requestId: result.$metadata?.requestId
    });

    return jsonResponse(200, { task: result.Attributes });
  } catch (error) {
    return handleError(error);
  }
}

module.exports = { handler };
