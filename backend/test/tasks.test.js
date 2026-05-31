const test = require("node:test");
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const { handler: getTasks } = require("../src/handlers/getTasks");
const { handler: createTask } = require("../src/handlers/createTask");
const { handler: updateTask } = require("../src/handlers/updateTask");
const { handler: deleteTask } = require("../src/handlers/deleteTask");

function event({ userId = "user-1", id, body } = {}) {
  return {
    headers: { "x-user-id": userId },
    queryStringParameters: { userId },
    pathParameters: id ? { id } : {},
    body: body ? JSON.stringify(body) : undefined
  };
}

function bodyOf(response) {
  return JSON.parse(response.body);
}

test("GET /tasks returns all tasks", async () => {
  const response = await getTasks(event({ userId: "user-1" }));
  const body = bodyOf(response);

  assert.equal(response.statusCode, 200);
  assert.ok(Array.isArray(body.tasks));
  assert.ok(body.tasks.length >= 3);
  assert.ok(body.tasks.some((task) => task.userId === "user-1"));
  assert.ok(body.tasks.some((task) => task.userId === "user-2"));
});

test("POST, PUT and DELETE task lifecycle", async () => {
  const marker = randomUUID();
  const createResponse = await createTask(
    event({
      body: {
        title: `Integration task ${marker}`,
        description: "Created by backend test.",
        priority: "low",
        status: "pending",
        dueDate: "2026-06-01"
      }
    })
  );
  const created = bodyOf(createResponse).task;

  assert.equal(createResponse.statusCode, 201);
  assert.ok(created.taskId);
  assert.equal(created.userId, "user-1");
  assert.ok(created.createdAt);

  const updateResponse = await updateTask(
    event({
      id: created.taskId,
      body: {
        title: `Updated task ${marker}`,
        priority: "high",
        status: "done",
        dueDate: "2026-06-02"
      }
    })
  );
  const updated = bodyOf(updateResponse).task;

  assert.equal(updateResponse.statusCode, 200);
  assert.equal(updated.title, `Updated task ${marker}`);
  assert.equal(updated.priority, "high");
  assert.equal(updated.status, "done");

  const deleteResponse = await deleteTask(event({ id: created.taskId }));
  assert.equal(deleteResponse.statusCode, 200);
  assert.deepEqual(bodyOf(deleteResponse), { deleted: true, taskId: created.taskId });
});

test("validation returns 400 for invalid priority", async () => {
  const response = await createTask(
    event({
      body: {
        title: "Invalid task",
        priority: "urgent",
        status: "pending",
        dueDate: "2026-06-01"
      }
    })
  );

  assert.equal(response.statusCode, 400);
});

test("update and delete return 404 for missing task", async () => {
  const missingId = `missing-${randomUUID()}`;
  const updateResponse = await updateTask(
    event({
      id: missingId,
      body: {
        title: "Missing",
        priority: "low",
        status: "pending",
        dueDate: "2026-06-01"
      }
    })
  );
  const deleteResponse = await deleteTask(event({ id: missingId }));

  assert.equal(updateResponse.statusCode, 404);
  assert.equal(deleteResponse.statusCode, 404);
});
