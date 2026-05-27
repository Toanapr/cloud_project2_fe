const { jsonResponse, parseJsonBody } = require("../lib/http");

async function handler(event = {}) {
  try {
    const body = parseJsonBody(event);
    
    if (!body.email || !body.password) {
      return jsonResponse(400, { error: "Email và Password là bắt buộc!" });
    }

    // Ở môi trường Local, ta giả lập tạo tài khoản thành công
    return jsonResponse(201, { 
        message: "Đăng ký thành công!",
        userId: "user-1", // Giả lập trả về user-1 để bạn test DB local
        email: body.email 
    });
  } catch (error) {
    return jsonResponse(500, { error: "Lỗi server giả lập" });
  }
}

module.exports = { handler };