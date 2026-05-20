#!/bin/sh
set -eu

ENDPOINT="${DYNAMODB_ENDPOINT:-http://dynamodb-local:8000}"
TABLE_NAME="${DYNAMODB_TABLE:-TasksTable}"
REGION="${AWS_DEFAULT_REGION:-ap-southeast-1}"

aws_local() {
  aws dynamodb "$@" --endpoint-url "$ENDPOINT" --region "$REGION"
}

echo "Waiting for DynamoDB Local at $ENDPOINT..."
until aws_local list-tables >/dev/null 2>&1; do
  sleep 1
done

if aws_local describe-table --table-name "$TABLE_NAME" >/dev/null 2>&1; then
  echo "Table $TABLE_NAME already exists."
else
  echo "Creating table $TABLE_NAME..."
  aws_local create-table \
    --table-name "$TABLE_NAME" \
    --attribute-definitions \
      AttributeName=taskId,AttributeType=S \
      AttributeName=userId,AttributeType=S \
    --key-schema AttributeName=taskId,KeyType=HASH \
    --global-secondary-indexes "IndexName=userId-index,KeySchema=[{AttributeName=userId,KeyType=HASH}],Projection={ProjectionType=ALL}" \
    --billing-mode PAY_PER_REQUEST

  aws_local wait table-exists --table-name "$TABLE_NAME"
fi

echo "Seeding demo tasks..."
aws_local put-item \
  --table-name "$TABLE_NAME" \
  --item '{
    "taskId": {"S": "task-user-1-backend-api"},
    "userId": {"S": "user-1"},
    "title": {"S": "Hoan thien Backend API"},
    "description": {"S": "Viet 4 Lambda CRUD handler cho Task Manager."},
    "priority": {"S": "high"},
    "dueDate": {"S": "2026-05-20"},
    "status": {"S": "pending"},
    "createdAt": {"S": "2026-05-18T08:00:00Z"}
  }'

aws_local put-item \
  --table-name "$TABLE_NAME" \
  --item '{
    "taskId": {"S": "task-user-1-s3-private"},
    "userId": {"S": "user-1"},
    "title": {"S": "Cau hinh S3 Private"},
    "description": {"S": "Bat Block Public Access va gan OAC cho CloudFront."},
    "priority": {"S": "medium"},
    "dueDate": {"S": "2026-05-22"},
    "status": {"S": "done"},
    "createdAt": {"S": "2026-05-17T14:30:00Z"}
  }'

aws_local put-item \
  --table-name "$TABLE_NAME" \
  --item '{
    "taskId": {"S": "task-user-2-cognito"},
    "userId": {"S": "user-2"},
    "title": {"S": "Tich hop Cognito"},
    "description": {"S": "Chuan bi login, signup va JWT cho API Gateway Authorizer."},
    "priority": {"S": "low"},
    "dueDate": {"S": "2026-05-25"},
    "status": {"S": "pending"},
    "createdAt": {"S": "2026-05-19T09:15:00Z"}
  }'

echo "DynamoDB Local is ready. Table: $TABLE_NAME"
