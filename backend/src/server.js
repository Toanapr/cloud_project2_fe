const express = require("express");
const cors = require("cors");
const { config } = require("./config");
const { handler: getTasks } = require("./handlers/getTasks");
const { handler: createTask } = require("./handlers/createTask");
const { handler: updateTask } = require("./handlers/updateTask");
const { handler: deleteTask } = require("./handlers/deleteTask");
const { handler: signup } = require("./handlers/signup");

const app = express();

app.use(cors({ origin: true }));
app.use(express.json());

function toLambdaEvent(req) {
  return {
    headers: req.headers,
    queryStringParameters: req.query,
    pathParameters: req.params,
    body: req.body && Object.keys(req.body).length > 0 ? JSON.stringify(req.body) : undefined
  };
}

function sendLambdaResponse(res, lambdaResponse) {
  Object.entries(lambdaResponse.headers || {}).forEach(([key, value]) => res.setHeader(key, value));
  res.status(lambdaResponse.statusCode).send(lambdaResponse.body);
}

function route(handler) {
  return async (req, res) => {
    const lambdaResponse = await handler(toLambdaEvent(req));
    sendLambdaResponse(res, lambdaResponse);
  };
}

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/tasks", route(getTasks));
app.post("/tasks", route(createTask));
app.put("/tasks/:id", route(updateTask));
app.delete("/tasks/:id", route(deleteTask));
app.post("/signup", route(signup));

if (require.main === module) {
  app.listen(config.port, () => {
    console.log(`Task API listening on http://localhost:${config.port}`);
  });
}

module.exports = { app };
