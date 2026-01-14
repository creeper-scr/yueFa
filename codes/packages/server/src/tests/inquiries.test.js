import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { app } from '../app.js'
import { SmsCodeModel } from '../models/SmsCode.js'

describe('Inquiries API', () => {
  const testPhone = '13800138000'
  let token
  let userId
  let inquiryId

  beforeEach(async () => {
    // 创建用户并登录
    SmsCodeModel.create(testPhone, '123456')
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ phone: testPhone, code: '123456' })
    token = res.body.data.token
    userId = res.body.data.user.id

    // 设置slug
    await request(app)
      .put('/api/v1/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ slug: 'test_maoyang' })
  })

  describe('POST /api/v1/inquiries', () => {
    it('应该成功提交询价', async () => {
      const res = await request(app)
        .post('/api/v1/inquiries')
        .send({
          user_slug: 'test_maoyang',
          customer_name: '测试客户',
          customer_contact: 'wx: test123',
          character_name: '胡桃',
          source_work: '原神',
          expected_deadline: '2026-03-01',
          head_circumference: '56cm',
          budget_range: '400-600',
          reference_images: ['https://example.com/ref1.jpg'],
          requirements: '希望刘海可以做成M字型'
        })

      expect(res.status).toBe(200)
      expect(res.body.code).toBe(0)
      expect(res.body.message).toBe('询价提交成功')
      expect(res.body.data.id).toBeDefined()
    })

    it('应该拒绝缺少必填字段', async () => {
      const res = await request(app)
        .post('/api/v1/inquiries')
        .send({
          user_slug: 'test_maoyang'
          // 缺少 character_name
        })

      expect(res.body.code).toBe(1001)
    })

    it('应该拒绝不存在的毛娘', async () => {
      const res = await request(app)
        .post('/api/v1/inquiries')
        .send({
          user_slug: 'nonexistent_user',
          character_name: '胡桃'
        })

      expect(res.body.code).toBe(3001)
    })
  })

  describe('GET /api/v1/inquiries', () => {
    beforeEach(async () => {
      // 创建几个询价
      await request(app)
        .post('/api/v1/inquiries')
        .send({
          user_slug: 'test_maoyang',
          customer_name: '客户1',
          character_name: '胡桃'
        })

      await request(app)
        .post('/api/v1/inquiries')
        .send({
          user_slug: 'test_maoyang',
          customer_name: '客户2',
          character_name: '甘雨'
        })
    })

    it('应该返回询价列表', async () => {
      const res = await request(app)
        .get('/api/v1/inquiries')
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(res.body.code).toBe(0)
      expect(res.body.data.list).toHaveLength(2)
      expect(res.body.data.pagination).toBeDefined()
    })

    it('应该支持状态筛选', async () => {
      const res = await request(app)
        .get('/api/v1/inquiries?status=new')
        .set('Authorization', `Bearer ${token}`)

      expect(res.body.code).toBe(0)
      expect(res.body.data.list.every(i => i.status === 'new')).toBe(true)
    })

    it('应该支持分页', async () => {
      const res = await request(app)
        .get('/api/v1/inquiries?page=1&limit=1')
        .set('Authorization', `Bearer ${token}`)

      expect(res.body.code).toBe(0)
      expect(res.body.data.list).toHaveLength(1)
      expect(res.body.data.pagination.total).toBe(2)
    })
  })

  describe('GET /api/v1/inquiries/:id', () => {
    beforeEach(async () => {
      const createRes = await request(app)
        .post('/api/v1/inquiries')
        .send({
          user_slug: 'test_maoyang',
          customer_name: '测试客户',
          character_name: '胡桃'
        })
      inquiryId = createRes.body.data.id
    })

    it('应该返回询价详情', async () => {
      const res = await request(app)
        .get(`/api/v1/inquiries/${inquiryId}`)
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(res.body.code).toBe(0)
      expect(res.body.data.character_name).toBe('胡桃')
    })

    it('应该返回404对于不存在的询价', async () => {
      const res = await request(app)
        .get('/api/v1/inquiries/nonexistent-id')
        .set('Authorization', `Bearer ${token}`)

      expect(res.body.code).toBe(3001)
    })

    it('应该拒绝无权限查看他人询价', async () => {
      // 创建另一个用户
      SmsCodeModel.create('13900139000', '654321')
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ phone: '13900139000', code: '654321' })
      const otherToken = loginRes.body.data.token

      const res = await request(app)
        .get(`/api/v1/inquiries/${inquiryId}`)
        .set('Authorization', `Bearer ${otherToken}`)

      expect(res.body.code).toBe(2002)
    })
  })

  describe('POST /api/v1/inquiries/:id/convert', () => {
    beforeEach(async () => {
      const createRes = await request(app)
        .post('/api/v1/inquiries')
        .send({
          user_slug: 'test_maoyang',
          customer_name: '测试客户',
          customer_contact: 'wx: test',
          character_name: '胡桃',
          source_work: '原神'
        })
      inquiryId = createRes.body.data.id
    })

    it('应该成功将询价转为订单', async () => {
      const res = await request(app)
        .post(`/api/v1/inquiries/${inquiryId}/convert`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          price: 500,
          deposit: 200,
          deadline: '2026-03-15'
        })

      expect(res.status).toBe(200)
      expect(res.body.code).toBe(0)
      expect(res.body.message).toBe('订单创建成功')
      expect(res.body.data.id).toBeDefined()
      expect(res.body.data.character_name).toBe('胡桃')
      expect(res.body.data.price).toBe(500)
    })

    it('应该拒绝已处理的询价', async () => {
      // 先转换一次
      await request(app)
        .post(`/api/v1/inquiries/${inquiryId}/convert`)
        .set('Authorization', `Bearer ${token}`)
        .send({ price: 500 })

      // 再次尝试转换
      const res = await request(app)
        .post(`/api/v1/inquiries/${inquiryId}/convert`)
        .set('Authorization', `Bearer ${token}`)
        .send({ price: 600 })

      expect(res.body.code).toBe(1001)
      expect(res.body.message).toBe('该询价已处理')
    })

    it('应该拒绝无权限操作他人询价', async () => {
      SmsCodeModel.create('13900139000', '654321')
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ phone: '13900139000', code: '654321' })
      const otherToken = loginRes.body.data.token

      const res = await request(app)
        .post(`/api/v1/inquiries/${inquiryId}/convert`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ price: 500 })

      expect(res.body.code).toBe(2002)
    })
  })

  describe('PUT /api/v1/inquiries/:id/reject', () => {
    beforeEach(async () => {
      const createRes = await request(app)
        .post('/api/v1/inquiries')
        .send({
          user_slug: 'test_maoyang',
          customer_name: '测试客户',
          character_name: '胡桃'
        })
      inquiryId = createRes.body.data.id
    })

    it('应该成功拒绝询价', async () => {
      const res = await request(app)
        .put(`/api/v1/inquiries/${inquiryId}/reject`)
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(res.body.code).toBe(0)
      expect(res.body.message).toBe('询价已拒绝')
    })

    it('应该拒绝已处理的询价', async () => {
      // 先拒绝
      await request(app)
        .put(`/api/v1/inquiries/${inquiryId}/reject`)
        .set('Authorization', `Bearer ${token}`)

      // 再次尝试拒绝
      const res = await request(app)
        .put(`/api/v1/inquiries/${inquiryId}/reject`)
        .set('Authorization', `Bearer ${token}`)

      expect(res.body.code).toBe(1001)
    })

    it('应该拒绝无权限操作', async () => {
      SmsCodeModel.create('13900139000', '654321')
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ phone: '13900139000', code: '654321' })
      const otherToken = loginRes.body.data.token

      const res = await request(app)
        .put(`/api/v1/inquiries/${inquiryId}/reject`)
        .set('Authorization', `Bearer ${otherToken}`)

      expect(res.body.code).toBe(2002)
    })
  })
})
