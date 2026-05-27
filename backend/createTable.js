const { DynamoDBClient, CreateTableCommand } = require("@aws-sdk/client-dynamodb");

// Kết nối vào Database Local của bạn
const client = new DynamoDBClient({
    region: "ap-southeast-1",
    endpoint: "http://localhost:8000",
    credentials: {
        accessKeyId: "local",
        secretAccessKey: "local"
    }
});

// Định nghĩa cấu trúc bảng y hệt yêu cầu đồ án
const params = {
    TableName: "TasksTable",
    AttributeDefinitions: [
        { AttributeName: "taskId", AttributeType: "S" },
        { AttributeName: "userId", AttributeType: "S" }
    ],
    KeySchema: [
        { AttributeName: "taskId", KeyType: "HASH" }
    ],
    GlobalSecondaryIndexes: [
        {
            IndexName: "userId-index",
            KeySchema: [
                { AttributeName: "userId", KeyType: "HASH" }
            ],
            Projection: { ProjectionType: "ALL" },
            ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
        }
    ],
    ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
};

// Thực thi lệnh tạo bảng
client.send(new CreateTableCommand(params))
    .then(() => console.log("Tuyeet! Bảng TasksTable đã được tạo thành công!"))
    .catch(err => console.error("Lỗi rồi:", err.message));