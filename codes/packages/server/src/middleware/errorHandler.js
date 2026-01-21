// 统一错误处理中间件
export const errorHandler = (err, req, res, _next) => {
  // 默认错误
  let statusCode = 500
  let response = {
    code: 5001,
    message: '服务器内部错误'
  }

  // 已知错误类型
  if (err.statusCode) {
    statusCode = err.statusCode
    response.code = err.code || statusCode
    response.message = err.message
    if (err.errors && err.errors.length > 0) {
      response.errors = err.errors
    }
  }

  // 验证错误
  if (err.name === 'ValidationError') {
    statusCode = 400
    response.code = 1001
    response.message = err.message
  }

  // JWT错误
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401
    response.code = 2001
    response.message = '登录已过期，请重新登录'
  }

  res.status(statusCode).json(response)
}

// 业务错误类
export class AppError extends Error {
  constructor(code, message, statusCode = 400, errors = []) {
    super(message)
    this.code = code
    this.statusCode = statusCode
    this.errors = errors
    this.name = 'AppError'
  }
}
