import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { app } from '../app.js'
import { SmsCodeModel } from '../models/SmsCode.js'

describe('Upload API', () => {
  const testPhone = '13800138000'
  let token

  beforeEach(async () => {
    // 创建用户并登录
    SmsCodeModel.create(testPhone, '123456')
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ phone: testPhone, code: '123456' })
    token = res.body.data.token
  })

  describe('POST /api/v1/upload/presign', () => {
    it('应该成功获取预签名URL', async () => {
      const res = await request(app)
        .post('/api/v1/upload/presign')
        .set('Authorization', `Bearer ${token}`)
        .send({
          type: 'work',
          filename: 'test.jpg',
          content_type: 'image/jpeg'
        })

      expect(res.status).toBe(200)
      expect(res.body.code).toBe(0)
      expect(res.body.data.upload_url).toBeDefined()
      expect(res.body.data.file_url).toBeDefined()
      expect(res.body.data.expires_in).toBe(3600)
    })

    it('应该支持avatar类型', async () => {
      const res = await request(app)
        .post('/api/v1/upload/presign')
        .set('Authorization', `Bearer ${token}`)
        .send({
          type: 'avatar',
          filename: 'avatar.png',
          content_type: 'image/png'
        })

      expect(res.status).toBe(200)
      expect(res.body.code).toBe(0)
      expect(res.body.data.expires_in).toBe(3600)
    })

    it('应该支持reference类型', async () => {
      const res = await request(app)
        .post('/api/v1/upload/presign')
        .set('Authorization', `Bearer ${token}`)
        .send({
          type: 'reference',
          filename: 'ref.jpg',
          content_type: 'image/jpeg'
        })

      expect(res.status).toBe(200)
      expect(res.body.code).toBe(0)
      expect(res.body.data.expires_in).toBe(3600)
    })

    it('应该拒绝无效的上传类型', async () => {
      const res = await request(app)
        .post('/api/v1/upload/presign')
        .set('Authorization', `Bearer ${token}`)
        .send({
          type: 'invalid_type',
          filename: 'test.jpg',
          content_type: 'image/jpeg'
        })

      expect(res.body.code).toBe(1001)
    })

    it('应该拒绝缺少filename', async () => {
      const res = await request(app)
        .post('/api/v1/upload/presign')
        .set('Authorization', `Bearer ${token}`)
        .send({
          type: 'work',
          content_type: 'image/jpeg'
        })

      expect(res.body.code).toBe(1001)
    })

    it('应该拒绝缺少content_type', async () => {
      const res = await request(app)
        .post('/api/v1/upload/presign')
        .set('Authorization', `Bearer ${token}`)
        .send({
          type: 'work',
          filename: 'test.jpg'
        })

      expect(res.body.code).toBe(1001)
    })

    it('应该拒绝未认证的请求', async () => {
      const res = await request(app)
        .post('/api/v1/upload/presign')
        .send({
          type: 'work',
          filename: 'test.jpg',
          content_type: 'image/jpeg'
        })

      expect(res.body.code).toBe(2001)
    })
  })
})
