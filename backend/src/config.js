require("dotenv").config({ quiet: true });

const config = {
  port: Number(process.env.PORT || 3000),
  tableName: process.env.DYNAMODB_TABLE || "TasksTable",
  region: process.env.AWS_REGION || "ap-southeast-1",
  endpoint: process.env.DYNAMODB_ENDPOINT,
  localUserId: process.env.LOCAL_USER_ID || "user-1"
};

module.exports = { config };
