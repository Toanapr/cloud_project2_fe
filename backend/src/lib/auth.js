const { config } = require("../config");

function getHeader(headers, name) {
  if (!headers) {
    return undefined;
  }

  const foundKey = Object.keys(headers).find((key) => key.toLowerCase() === name.toLowerCase());
  return foundKey ? headers[foundKey] : undefined;
}

function getCurrentUserId(event) {
  // Ưu tiên 1: Lấy từ Cognito authorizer (API Gateway + Cognito authorizer)
  if (event?.requestContext?.authorizer?.claims?.sub) {
    return event.requestContext.authorizer.claims.sub;
  }

  // API Gateway HTTP API + JWT authorizer
  if (event?.requestContext?.authorizer?.jwt?.claims?.sub) {
    return event.requestContext.authorizer.jwt.claims.sub;
  }
  
  // Fallback: Lấy từ email claim nếu sub không có
  if (event?.requestContext?.authorizer?.claims?.email) {
    return event.requestContext.authorizer.claims.email;
  }

  if (event?.requestContext?.authorizer?.jwt?.claims?.email) {
    return event.requestContext.authorizer.jwt.claims.email;
  }

  // Ưu tiên 2: Lấy từ query parameter (test local)
  if (event?.queryStringParameters?.userId) {
    return event.queryStringParameters.userId;
  }

  // Ưu tiên 3: Lấy từ header X-User-Id (test local)
  const userId = getHeader(event?.headers, "x-user-id");
  if (userId) {
    return userId;
  }

  // Fallback: Dùng config default
  return config.localUserId;
}

module.exports = { getCurrentUserId };
