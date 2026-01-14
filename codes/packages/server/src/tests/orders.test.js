import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { app } from '../app.js'
import { SmsCodeModel } from '../models/SmsCode.js'

describe('Orders API', () => {
  const testPhone = '13800138000'
  let token
  let inquiryId
  let orderId

  beforeEach(async () => {
    // 创建用户并登录
    SmsCodeModel.create(testPhone, '123456')
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ phone: testPhone, code: '123456' })
    token = loginRes.body.data.token

    // 设置slug
    await request(app)
      .put('/api/v1/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ slug: 'test_maoyang' })

    // 创建询价
    const inquiryRes = await request(app)
      .post('/api/v1/inquiries')
      .send({
        user_slug: 'test_maoyang',
        customer_name: '测试客户',
        customer_contact: 'wx: test',
        character_name: '胡桃',
        source_work: '原神',
        budget_range: '400-600'
      })
    inquiryId = inquiryRes.body.data.id

    // 转为订单
    const convertRes = await request(app)
      .post(`/api/v1/inquiries/${inquiryId}/convert`)
      .set('Authorization', `Bearer ${token}`)
      .send({ price: 500, deposit: 200 })
    orderId = convertRes.body.data.id
  })

  describe('GET /api/v1/orders', () => {
    it('应该返回订单列表', async () => {
      const res = await request(app)
        .get('/api/v1/orders')
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(res.body.code).toBe(0)
      expect(res.body.data.list).toHaveLength(1)
      expect(res.body.data.statusCount).toBeDefined()
    })

    it('应该支持状态筛选', async () => {
      const res = await request(app)
        .get('/api/v1/orders?status=pending_deposit')
        .set('Authorization', `Bearer ${token}`)

      expect(res.body.data.list).toHaveLength(1)
    })
  })

  describe('GET /api/v1/orders/:id', () => {
    it('应该返回订单详情', async () => {
      const res = await request(app)
        .get(`/api/v1/orders/${orderId}`)
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(res.body.code).toBe(0)
      expect(res.body.data.character_name).toBe('胡桃')
      expect(res.body.data.price).toBe(500)
    })
  })

  describe('PUT /api/v1/orders/:id/status', () => {
    it('应该成功更新订单状态', async () => {
      const res = await request(app)
        .put(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'in_production' })

      expect(res.status).toBe(200)
      expect(res.body.code).toBe(0)
      expect(res.body.data.status).toBe('in_production')
    })

    it('应该拒绝无效的状态', async () => {
      const res = await request(app)
        .put(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'invalid_status' })

      expect(res.body.code).toBe(1001)
    })
  })

  describe('POST /api/v1/orders/:id/notes', () => {
    it('应该成功添加备注', async () => {
      const res = await request(app)
        .post(`/api/v1/orders/${orderId}/notes`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: '客户确认修改发色' })

      expect(res.status).toBe(200)
      expect(res.body.code).toBe(0)
      expect(res.body.data.notes).toHaveLength(1)
      expect(res.body.data.notes[0].content).toBe('客户确认修改发色')
    })
  })
})
