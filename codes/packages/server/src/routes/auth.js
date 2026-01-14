import express from 'express'
import jwt from 'jsonwebtoken'
import { body, validationResult } from 'express-validator'
import { UserModel } from '../models/User.js'
import { SmsCodeModel } from '../models/SmsCode.js'
import { auth } from '../middleware/auth.js'
import { AppError } from '../middleware/errorHandler.js'

const router = express.Router()

// 手机号格式验证
const phoneRegex = /^1[3-9]\d{9}$/

// 生成随机6位验证码
const generateCode = () => {
  return Math.random().toString().slice(2, 8)
}

// 发送验证码
router.post('/sms/send',
  body('phone').matches(phoneRegex).withMessage('手机号格式不正确'),
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw new AppError(1003, errors.array()[0].msg)
      }

      const { phone } = req.body

      // 检查发送频率
      if (!SmsCodeModel.canSend(phone)) {
        throw new AppError(1001, '请求过于频繁，请1分钟后重试')
      }

      // 生成验证码
      const code = generateCode()

      // 保存验证码
      SmsCodeModel.create(phone, code)

      // 开发环境直接返回验证码，生产环境调用短信服务
      if (process.env.NODE_ENV === 'development') {
        console.log(`[DEV] SMS Code for ${phone}: ${code}`)
        return res.json({
          code: 0,
          message: '验证码已发送',
          data: { code } // 开发环境返回验证码方便测试
        })
      }

      // TODO: 生产环境调用阿里云短信服务
      // await sendSms(phone, code)

      res.json({
        code: 0,
        message: '验证码已发送'
      })
    } catch (error) {
      next(error)
    }
  }
)

// 登录/注册
router.post('/login',
  body('phone').matches(phoneRegex).withMessage('手机号格式不正确'),
  body('code').isLength({ min: 6, max: 6 }).withMessage('验证码格式不正确'),
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw new AppError(1001, errors.array()[0].msg)
      }

      const { phone, code } = req.body

      // 验证验证码
      const isValid = SmsCodeModel.verify(phone, code)
      if (!isValid) {
        throw new AppError(1002, '验证码错误或已过期')
      }

      // 查找或创建用户
      let user = UserModel.findByPhone(phone)
      if (!user) {
        user = UserModel.create({ phone })
      }

      // 生成JWT
      const token = jwt.sign(
        { userId: user.id, phone: user.phone },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      )

      // 隐藏部分手机号
      const maskedPhone = phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')

      res.json({
        code: 0,
        data: {
          token,
          user: {
            id: user.id,
            phone: maskedPhone,
            nickname: user.nickname,
            slug: user.slug,
            avatar_url: user.avatar_url
          }
        }
      })
    } catch (error) {
      next(error)
    }
  }
)

// 获取当前用户信息
router.get('/me', auth, async (req, res, next) => {
  try {
    const user = UserModel.findById(req.user.userId)
    if (!user) {
      throw new AppError(3001, '用户不存在', 404)
    }

    // 隐藏部分手机号
    const maskedPhone = user.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')

    res.json({
      code: 0,
      data: {
        id: user.id,
        phone: maskedPhone,
        nickname: user.nickname,
        avatar_url: user.avatar_url,
        wechat_id: user.wechat_id,
        announcement: user.announcement,
        slug: user.slug,
        created_at: user.created_at
      }
    })
  } catch (error) {
    next(error)
  }
})

export default router
