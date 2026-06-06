# Serverless Task Manager

Ứng dụng quản lý công việc theo kiến trúc serverless:

- Frontend: HTML, CSS và JavaScript thuần.
- Xác thực: Amazon Cognito.
- API: API Gateway gọi các Lambda handler Node.js 20.
- Cơ sở dữ liệu: Amazon DynamoDB.
- Môi trường local: Express adapter và DynamoDB Local qua Docker Compose.

## Cấu trúc thư mục

```text
.
|-- backend/                 # Lambda handlers, Express local server và test
|-- docker/dynamodb/init.sh  # Tạo bảng và seed dữ liệu local
|-- frontend/                # Static frontend
|-- docker-compose.yml       # DynamoDB Local
`-- README.md
```

## Yêu cầu

- Node.js 20 trở lên và npm.
- Docker và Docker Compose.
- Python 3 hoặc một static web server như VS Code Live Server.

## Chạy local

### 1. Khởi động DynamoDB Local

Tại thư mục gốc của project:

```sh
docker compose up -d
```

DynamoDB Local chạy tại `http://localhost:8000`. Container init sẽ tự động tạo và seed:

- Bảng: `TasksTable`
- Partition key: `taskId` (`String`)
- GSI: `userId-index`, partition key `userId` (`String`)
- Dữ liệu mẫu cho `user-1` và `user-2`

Kiểm tra trạng thái container:

```sh
docker compose ps
```

### 2. Cài đặt và chạy backend

```sh
cd backend
npm install
cp .env.example .env
npm run dev
```

API local chạy tại `http://localhost:3000`. Kiểm tra bằng:

```sh
curl http://localhost:3000/health
curl "http://localhost:3000/tasks?userId=user-1"
```

File `backend/.env.example` chứa cấu hình local mặc định:

```dotenv
PORT=3000
DYNAMODB_ENDPOINT=http://localhost:8000
DYNAMODB_TABLE=TasksTable
AWS_REGION=ap-southeast-1
AWS_ACCESS_KEY_ID=local
AWS_SECRET_ACCESS_KEY=local
LOCAL_USER_ID=user-1
```

Backend local hỗ trợ chọn người dùng bằng query parameter `userId` hoặc header `X-User-Id`. Nếu không truyền, backend sử dụng `LOCAL_USER_ID`.

### 3. Chạy frontend

Mở terminal khác tại thư mục gốc:

```sh
python3 -m http.server 8080 --directory frontend
```

Truy cập `http://localhost:8080/login.html`.

Frontend hiện sử dụng trực tiếp Cognito và API Gateway đã triển khai, được cấu hình tại:

- `frontend/js/auth.js`: `COGNITO_REGION`, `COGNITO_CLIENT_ID`
- `frontend/js/app.js`: `API_BASE_URL`

Để frontend gọi backend local, đổi `API_BASE_URL` trong `frontend/js/app.js` thành:

```js
const API_BASE_URL = "http://localhost:3000";
```

Trang quản lý công việc yêu cầu `userToken` trong `localStorage`. Khi chỉ kiểm tra local và không cần đăng nhập Cognito, có thể đặt token tạm trong DevTools Console:

```js
localStorage.setItem("userToken", "local-token");
location.href = "index.html";
```

Express adapter sẽ gán request local vào người dùng mặc định `user-1`.

### 4. Chạy test backend

Đảm bảo DynamoDB Local đang chạy, sau đó:

```sh
cd backend
npm test
```

### 5. Dừng môi trường local

```sh
docker compose down
```

Để xóa cả dữ liệu DynamoDB Local:

```sh
docker compose down -v
```

## Kiểm tra CRUD bằng curl

```sh
# Lấy danh sách công việc
curl "http://localhost:3000/tasks?userId=user-1"

# Tạo công việc
curl -X POST "http://localhost:3000/tasks?userId=user-1" \
  -H "Content-Type: application/json" \
  -d '{"title":"Viết API local","description":"CRUD với DynamoDB Local","priority":"high","status":"pending","dueDate":"2026-06-10"}'

# Cập nhật công việc
curl -X PUT "http://localhost:3000/tasks/<taskId>?userId=user-1" \
  -H "Content-Type: application/json" \
  -d '{"title":"Viết API local xong","description":"Đã cập nhật","priority":"medium","status":"done","dueDate":"2026-06-11"}'

# Xóa công việc
curl -X DELETE "http://localhost:3000/tasks/<taskId>?userId=user-1"
```

## Triển khai lên AWS

Phần này giả định bucket S3, các Lambda function và những dịch vụ liên quan đã được tạo sẵn. Toàn bộ quá trình triển khai được thực hiện thủ công trên AWS Console.

### Triển khai frontend lên S3

Trước khi triển khai, cập nhật cấu hình AWS đang sử dụng:

- Đặt API Gateway URL vào `API_BASE_URL` trong `frontend/js/app.js`.
- Đặt Cognito region và App Client ID trong `frontend/js/auth.js`.

Các bước upload frontend:

1. Đăng nhập AWS Console và mở dịch vụ **S3**.
2. Chọn bucket dùng để chứa frontend.
3. Xóa các file frontend cũ trong bucket nếu cần cập nhật toàn bộ.
4. Chọn **Upload** và tải toàn bộ nội dung bên trong thư mục `frontend/` lên thư mục gốc của bucket.
5. Kiểm tra trong bucket có `index.html`, `login.html`, thư mục `css/` và thư mục `js/`.
6. Chọn **Upload** để hoàn tất.

Sau khi upload, truy cập frontend bằng S3 static website URL hoặc domain CloudFront đang trỏ tới bucket. Nếu sử dụng CloudFront và nội dung cũ vẫn còn được hiển thị, tạo invalidation cho đường dẫn `/*`.

### Triển khai các Lambda function

Sử dụng file `backend/lambda.zip` để upload lên các Lambda function. File ZIP phải chứa thư mục `src/`, thư mục `node_modules/`, `package.json` và `package-lock.json` ngay tại thư mục gốc của file ZIP.

Các Lambda sử dụng chung file ZIP nhưng mỗi function có handler riêng:

| Lambda function | Handler |
| --- | --- |
| Get tasks | `src/handlers/getTasks.handler` |
| Create task | `src/handlers/createTask.handler` |
| Update task | `src/handlers/updateTask.handler` |
| Delete task | `src/handlers/deleteTask.handler` |

Thực hiện các bước sau cho từng Lambda function:

1. Đăng nhập AWS Console và mở dịch vụ **Lambda**.
2. Chọn Lambda function cần cập nhật.
3. Trong tab **Code**, chọn **Upload from** > **.zip file**.
4. Chọn file `backend/lambda.zip`, sau đó chọn **Save**.
5. Mở **Runtime settings**, chọn **Edit** và đặt handler tương ứng theo bảng phía trên.
6. Mở tab **Configuration** > **Environment variables** và kiểm tra:
   - `DYNAMODB_TABLE=TasksTable`
   - `AWS_REGION=<region đang sử dụng>`
7. Không đặt các biến local gồm `DYNAMODB_ENDPOINT`, `AWS_ACCESS_KEY_ID` và `AWS_SECRET_ACCESS_KEY`.
8. Chọn **Test** hoặc gọi API tương ứng để kiểm tra Lambda sau khi cập nhật.

Sau khi cập nhật Lambda và frontend, đăng nhập vào ứng dụng và kiểm tra lại các chức năng tạo, đọc, sửa và xóa công việc.
