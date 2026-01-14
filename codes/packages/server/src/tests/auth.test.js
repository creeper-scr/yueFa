import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { app } from '../app.js'
import { UserModel } from '../models/User.js'
import { SmsCodeModel } from '../models/SmsCode.js'

describe('Auth API', () => {
  const testPhone = '13800138000'

  describe('POST /api/v1/auth/sms/send', () => {
    it('应该成功发送验证码', async () => {
      const res = await request(app)
        .post('/api/v1/auth/sms/send')
        .send({ phone: testPhone })

      expect(res.status).toBe(200)
      expect(res.body.code).toBe(0)
      // 开发环境下返回验证码用于测试
      if (res.body.data) {
        expect(res.body.data.code).toBeDefined()
      }
    })

    it('应该拒绝无效的手机号', async () => {
      const res = await request(app)
        .post('/api/v1/auth/sms/send')
        .send({ phone: '123456' })

      expect(res.status).toBe(400)
      expect(res.body.code).toBe(1003)
    })

    it('应该限制发送频率', async () => {
      // 第一次发送
      await request(app)
        .post('/api/v1/auth/sms/send')
        .send({ phone: testPhone })

      // 立即再次发送
      const res = await request(app)
        .post('/api/v1/auth/sms/send')
        .send({ phone: testPhone })

      expect(res.body.code).toBe(1001)
      expect(res.body.message).toContain('频繁')
    })
  })

  describe('POST /api/v1/auth/login', () => {
    beforeEach(() => {
      // 创建验证码
      SmsCodeModel.create(testPhone, '123456')
    })

    it('应该成功登录并返回token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ phone: testPhone, code: '123456' })

      expect(res.status).toBe(200)
      expect(res.body.code).toBe(0)
      expect(res.body.data.token).toBeDefined()
      expect(res.body.data.user).toBeDefined()
      expect(res.body.data.user.phone).toContain('****')
    })

    it('应该为新用户自动创建账号', async () => {
      await request(app)
        .post('/api/v1/auth/login')
        .send({ phone: testPhone, code: '123456' })

      const user = UserModel.findByPhone(testPhone)
      expect(user).toBeDefined()
    })

    it('应该拒绝错误的验证码', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ phone: testPhone, code: '999999' })

      expect(res.body.code).toBe(1002)
    })
  })

  describe('GET /api/v1/auth/me', () => {
    let token

    beforeEach(async () => {
      // 创建用户和登录
      SmsCodeModel.create(testPhone, '123456')
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ phone: testPhone, code: '123456' })
      token = res.body.data.token
    })

    it('应该返回当前用户信息', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(res.body.code).toBe(0)
      expect(res.body.data.phone).toContain('****')
    })

    it('应该拒绝无效的token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid_token')

      expect(res.body.code).toBe(2001)
    })

    it('应该拒绝没有token的请求', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')

      expect(res.body.code).toBe(2001)
    })
  })
})
