import jwt from 'jsonwebtoken'
import { AppError } from './errorHandler.js'

// JWT认证中间件
export const auth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(2001, '未提供认证令牌', 401)
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    req.user = decoded
    next()
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      next(new AppError(2001, '登录已过期，请重新登录', 401))
    } else if (error.name === 'JsonWebTokenError') {
      next(new AppError(2001, '无效的认证令牌', 401))
    } else {
      next(error)
    }
  }
}

// 可选认证中间件（不强制要求登录）
export const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1]
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      req.user = decoded
    }
    next()
  } catch (error) {
    // 忽略验证错误，继续执行
    next()
  }
}
