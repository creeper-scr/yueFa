import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { app } from '../app.js'
import { SmsCodeModel } from '../models/SmsCode.js'
import { UserModel } from '../models/User.js'

describe('Users API', () => {
  const testPhone = '13800138000'
  let token
  let userId

  beforeEach(async () => {
    // 创建用户并登录
    SmsCodeModel.create(testPhone, '123456')
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ phone: testPhone, code: '123456' })
    token = res.body.data.token
    userId = res.body.data.user.id
  })

  describe('GET /api/v1/users/profile', () => {
    it('应该返回用户完整信息', async () => {
      const res = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(res.body.code).toBe(0)
      expect(res.body.data.id).toBe(userId)
    })
  })

  describe('PUT /api/v1/users/profile', () => {
    it('应该成功更新用户信息', async () => {
      const res = await request(app)
        .put('/api/v1/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          nickname: '测试毛娘',
          wechat_id: 'test_wechat',
          announcement: '档期已排满',
          slug: 'test_shop'
        })

      expect(res.status).toBe(200)
      expect(res.body.code).toBe(0)
      expect(res.body.data.nickname).toBe('测试毛娘')
      expect(res.body.data.slug).toBe('test_shop')
    })

    it('应该拒绝无效的slug格式', async () => {
      const res = await request(app)
        .put('/api/v1/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ slug: 'ab' }) // 太短

      expect(res.body.code).toBe(1001)
    })

    it('应该拒绝已被占用的slug', async () => {
      // 先设置一个slug
      await request(app)
        .put('/api/v1/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ slug: 'taken_slug' })

      // 创建另一个用户
      SmsCodeModel.create('13900139000', '654321')
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ phone: '13900139000', code: '654321' })

      // 尝试使用已被占用的slug
      const res = await request(app)
        .put('/api/v1/users/profile')
        .set('Authorization', `Bearer ${loginRes.body.data.token}`)
        .send({ slug: 'taken_slug' })

      expect(res.body.code).toBe(3002)
    })
  })

  describe('GET /api/v1/users/:slug', () => {
    beforeEach(async () => {
      await request(app).put('/api/v1/users/profile').set('Authorization', `Bearer ${token}`).send({
        nickname: '公开毛娘',
        slug: 'public_shop'
      })
    })

    it('应该返回公开主页信息', async () => {
      const res = await request(app).get('/api/v1/users/public_shop')

      expect(res.status).toBe(200)
      expect(res.body.code).toBe(0)
      expect(res.body.data.nickname).toBe('公开毛娘')
      expect(res.body.data.phone).toBeUndefined() // 不应返回手机号
    })

    it('应该返回404对于不存在的slug', async () => {
      const res = await request(app).get('/api/v1/users/nonexistent')

      expect(res.body.code).toBe(3001)
    })
  })
})
