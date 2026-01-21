import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { app } from '../app.js'
import { SmsCodeModel } from '../models/SmsCode.js'
import { ORDER_STATUS } from '../models/Order.js'

describe('Orders API', () => {
  const testPhone = '13800138001'  // 唯一手机号，避免与其他测试冲突
  const testSlug = 'test_orders_user'  // 唯一 slug
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
      .send({ slug: testSlug })

    // 创建询价 (PRD F-01 - 包含毛坯来源)
    const inquiryRes = await request(app)
      .post('/api/v1/inquiries')
      .send({
        user_slug: testSlug,
        customer_name: '测试客户',
        customer_contact: 'wx: test',
        character_name: '胡桃',
        source_work: '原神',
        budget_range: '400-600',
        wig_source: 'client_sends',  // PRD F-03
        head_circumference: '56cm',
        head_notes: '头型偏扁'
      })
    inquiryId = inquiryRes.body.data.id

    // 转为订单
    const convertRes = await request(app)
      .post(`/api/v1/inquiries/${inquiryId}/convert`)
      .set('Authorization', `Bearer ${token}`)
      .send({ price: 500, deadline: '2026-03-15' })
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

    it('应该返回所有9种状态的计数', async () => {
      const res = await request(app)
        .get('/api/v1/orders')
        .set('Authorization', `Bearer ${token}`)

      const statusCount = res.body.data.statusCount
      expect(statusCount).toHaveProperty('pending_quote')
      expect(statusCount).toHaveProperty('pending_deposit')
      expect(statusCount).toHaveProperty('awaiting_wig_base')
      expect(statusCount).toHaveProperty('queued')
      expect(statusCount).toHaveProperty('in_progress')
      expect(statusCount).toHaveProperty('in_review')
      expect(statusCount).toHaveProperty('pending_balance')
      expect(statusCount).toHaveProperty('shipped')
      expect(statusCount).toHaveProperty('completed')
      expect(statusCount).toHaveProperty('total')
    })

    it('应该返回死线预警列表', async () => {
      const res = await request(app)
        .get('/api/v1/orders')
        .set('Authorization', `Bearer ${token}`)

      expect(res.body.data.deadlineAlerts).toBeDefined()
      expect(Array.isArray(res.body.data.deadlineAlerts)).toBe(true)
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

    it('应该返回自动计算的定金和尾款 (PRD F-02)', async () => {
      const res = await request(app)
        .get(`/api/v1/orders/${orderId}`)
        .set('Authorization', `Bearer ${token}`)

      // 500 * 20% = 100, 500 * 80% = 400
      expect(res.body.data.deposit).toBe(100)
      expect(res.body.data.balance).toBe(400)
    })

    it('应该包含毛坯来源字段 (PRD F-03)', async () => {
      const res = await request(app)
        .get(`/api/v1/orders/${orderId}`)
        .set('Authorization', `Bearer ${token}`)

      expect(res.body.data.wig_source).toBe('client_sends')
    })
  })

  describe('PUT /api/v1/orders/:id/status', () => {
    it('应该成功更新订单状态 (PRD 2.0 状态流转)', async () => {
      // pending_deposit -> awaiting_wig_base (需要先确认定金)
      // 这里我们直接测试状态流转
      await request(app)
        .put(`/api/v1/orders/${orderId}/deposit`)
        .set('Authorization', `Bearer ${token}`)
        .send({ screenshot: 'https://example.com/deposit.jpg' })

      const res = await request(app)
        .get(`/api/v1/orders/${orderId}`)
        .set('Authorization', `Bearer ${token}`)

      // 因为wig_source是client_sends，所以应该进入awaiting_wig_base状态
      expect(res.body.data.status).toBe(ORDER_STATUS.AWAITING_WIG_BASE)
    })

    it('应该拒绝无效的状态', async () => {
      const res = await request(app)
        .put(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'invalid_status' })

      expect(res.body.code).toBe(1001)
    })

    it('应该拒绝非法的状态流转', async () => {
      // 尝试从 pending_deposit 直接跳到 completed
      const res = await request(app)
        .put(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'completed' })

      expect(res.body.code).toBe(3002)
    })
  })

  describe('PUT /api/v1/orders/:id/deposit (PRD 确认定金流程)', () => {
    it('客户寄毛坯 - 确认定金后状态应该变为等毛坯', async () => {
      const res = await request(app)
        .put(`/api/v1/orders/${orderId}/deposit`)
        .set('Authorization', `Bearer ${token}`)
        .send({ screenshot: 'https://example.com/deposit.jpg' })

      expect(res.status).toBe(200)
      expect(res.body.code).toBe(0)
      expect(res.body.data.status).toBe(ORDER_STATUS.AWAITING_WIG_BASE)
      expect(res.body.data.deposit_paid_at).toBeDefined()
    })

    it('毛娘代购 - 确认定金后状态应该直接变为排单中', async () => {
      // 创建一个毛娘代购的订单
      const inquiryRes = await request(app)
        .post('/api/v1/inquiries')
        .send({
          user_slug: testSlug,
          customer_name: '客户2',
          customer_contact: 'wx: test2',
          character_name: '甘雨',
          source_work: '原神',
          wig_source: 'stylist_buys'  // 毛娘代购
        })

      const convertRes = await request(app)
        .post(`/api/v1/inquiries/${inquiryRes.body.data.id}/convert`)
        .set('Authorization', `Bearer ${token}`)
        .send({ price: 600 })

      const newOrderId = convertRes.body.data.id

      const res = await request(app)
        .put(`/api/v1/orders/${newOrderId}/deposit`)
        .set('Authorization', `Bearer ${token}`)
        .send({ screenshot: 'https://example.com/deposit2.jpg' })

      expect(res.status).toBe(200)
      expect(res.body.data.status).toBe(ORDER_STATUS.QUEUED)
    })

    it('应该拒绝非待付定金状态的订单', async () => {
      // 先确认一次定金
      await request(app)
        .put(`/api/v1/orders/${orderId}/deposit`)
        .set('Authorization', `Bearer ${token}`)
        .send({ screenshot: 'https://example.com/deposit.jpg' })

      // 再次尝试确认定金
      const res = await request(app)
        .put(`/api/v1/orders/${orderId}/deposit`)
        .set('Authorization', `Bearer ${token}`)
        .send({ screenshot: 'https://example.com/deposit2.jpg' })

      expect(res.body.code).toBe(3002)
    })
  })

  describe('PUT /api/v1/orders/:id/wig-received (PRD F-03 毛坯收货确认)', () => {
    beforeEach(async () => {
      // 先确认定金，进入等毛坯状态
      await request(app)
        .put(`/api/v1/orders/${orderId}/deposit`)
        .set('Authorization', `Bearer ${token}`)
        .send({ screenshot: 'https://example.com/deposit.jpg' })
    })

    it('应该成功确认毛坯收货', async () => {
      const res = await request(app)
        .put(`/api/v1/orders/${orderId}/wig-received`)
        .set('Authorization', `Bearer ${token}`)
        .send({ tracking_no: 'SF1234567890' })

      expect(res.status).toBe(200)
      expect(res.body.code).toBe(0)
      expect(res.body.data.status).toBe(ORDER_STATUS.QUEUED)
      expect(res.body.data.wig_received_at).toBeDefined()
      expect(res.body.data.wig_tracking_no).toBe('SF1234567890')
    })

    it('应该拒绝非等毛坯状态的订单', async () => {
      // 先确认毛坯收货
      await request(app)
        .put(`/api/v1/orders/${orderId}/wig-received`)
        .set('Authorization', `Bearer ${token}`)
        .send({ tracking_no: 'SF1234567890' })

      // 再次尝试
      const res = await request(app)
        .put(`/api/v1/orders/${orderId}/wig-received`)
        .set('Authorization', `Bearer ${token}`)
        .send({ tracking_no: 'SF0987654321' })

      expect(res.body.code).toBe(3002)
    })
  })

  describe('完整订单流程测试 (PRD 2.0 九状态流转)', () => {
    it('应该完成完整流程: pending_deposit -> awaiting_wig_base -> queued -> in_progress', async () => {
      // 1. 确认定金 (pending_deposit -> awaiting_wig_base)
      let res = await request(app)
        .put(`/api/v1/orders/${orderId}/deposit`)
        .set('Authorization', `Bearer ${token}`)
        .send({ screenshot: 'https://example.com/deposit.jpg' })
      expect(res.body.data.status).toBe(ORDER_STATUS.AWAITING_WIG_BASE)

      // 2. 确认毛坯收货 (awaiting_wig_base -> queued)
      res = await request(app)
        .put(`/api/v1/orders/${orderId}/wig-received`)
        .set('Authorization', `Bearer ${token}`)
        .send({ tracking_no: 'SF1234567890' })
      expect(res.body.data.status).toBe(ORDER_STATUS.QUEUED)

      // 3. 开始制作 (queued -> in_progress)
      res = await request(app)
        .put(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: ORDER_STATUS.IN_PROGRESS })
      expect(res.body.data.status).toBe(ORDER_STATUS.IN_PROGRESS)
    })
  })

  describe('PUT /api/v1/orders/:id/balance (PRD 确认尾款)', () => {
    it('应该在待尾款状态下成功确认尾款', async () => {
      // 准备：走完流程到待尾款状态
      // 1. 确认定金
      await request(app)
        .put(`/api/v1/orders/${orderId}/deposit`)
        .set('Authorization', `Bearer ${token}`)
        .send({ screenshot: 'https://example.com/deposit.jpg' })

      // 2. 确认毛坯收货
      await request(app)
        .put(`/api/v1/orders/${orderId}/wig-received`)
        .set('Authorization', `Bearer ${token}`)
        .send({ tracking_no: 'SF123' })

      // 3. 开始制作
      await request(app)
        .put(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: ORDER_STATUS.IN_PROGRESS })

      // 4. 手动设置为待尾款状态 (正常流程需要通过验收)
      await request(app)
        .put(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: ORDER_STATUS.IN_REVIEW })

      // 验收通过后进入待尾款
      await request(app)
        .put(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: ORDER_STATUS.PENDING_BALANCE })

      // 5. 确认尾款
      const res = await request(app)
        .put(`/api/v1/orders/${orderId}/balance`)
        .set('Authorization', `Bearer ${token}`)
        .send({ screenshot: 'https://example.com/balance.jpg' })

      expect(res.status).toBe(200)
      expect(res.body.code).toBe(0)
      expect(res.body.data.balance_paid_at).toBeDefined()
    })
  })

  describe('PUT /api/v1/orders/:id/ship (PRD S-01 发货)', () => {
    it('应该在尾款确认后成功发货', async () => {
      // 准备：走完流程到待尾款状态并确认尾款
      await request(app)
        .put(`/api/v1/orders/${orderId}/deposit`)
        .set('Authorization', `Bearer ${token}`)
        .send({ screenshot: 'https://example.com/deposit.jpg' })

      await request(app)
        .put(`/api/v1/orders/${orderId}/wig-received`)
        .set('Authorization', `Bearer ${token}`)
        .send({ tracking_no: 'SF123' })

      await request(app)
        .put(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: ORDER_STATUS.IN_PROGRESS })

      await request(app)
        .put(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: ORDER_STATUS.IN_REVIEW })

      await request(app)
        .put(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: ORDER_STATUS.PENDING_BALANCE })

      // 确认尾款
      await request(app)
        .put(`/api/v1/orders/${orderId}/balance`)
        .set('Authorization', `Bearer ${token}`)
        .send({ screenshot: 'https://example.com/balance.jpg' })

      // 发货
      const res = await request(app)
        .put(`/api/v1/orders/${orderId}/ship`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          shipping_company: '顺丰',
          shipping_no: 'SF9876543210',
          checklist: {
            balance_confirmed: true,
            cushioned: true,
            insured: false
          }
        })

      expect(res.status).toBe(200)
      expect(res.body.code).toBe(0)
      expect(res.body.data.status).toBe(ORDER_STATUS.SHIPPED)
      expect(res.body.data.shipping_no).toBe('SF9876543210')
      expect(res.body.data.shipping_company).toBe('顺丰')
    })

    it('应该拒绝未确认尾款的发货请求 (PRD R-03 尾款锁)', async () => {
      // 准备：走到待尾款状态但不确认尾款
      await request(app)
        .put(`/api/v1/orders/${orderId}/deposit`)
        .set('Authorization', `Bearer ${token}`)
        .send({ screenshot: 'https://example.com/deposit.jpg' })

      await request(app)
        .put(`/api/v1/orders/${orderId}/wig-received`)
        .set('Authorization', `Bearer ${token}`)
        .send({ tracking_no: 'SF123' })

      await request(app)
        .put(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: ORDER_STATUS.IN_PROGRESS })

      await request(app)
        .put(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: ORDER_STATUS.IN_REVIEW })

      await request(app)
        .put(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: ORDER_STATUS.PENDING_BALANCE })

      // 尝试发货（未确认尾款）
      const res = await request(app)
        .put(`/api/v1/orders/${orderId}/ship`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          shipping_company: '顺丰',
          shipping_no: 'SF9876543210'
        })

      expect(res.body.code).toBe(3002)
      expect(res.body.message).toContain('尾款')
    })
  })

  describe('PUT /api/v1/orders/:id/complete (订单完成)', () => {
    it('应该在发货后成功标记完成', async () => {
      // 完整流程
      await request(app)
        .put(`/api/v1/orders/${orderId}/deposit`)
        .set('Authorization', `Bearer ${token}`)
        .send({ screenshot: 'https://example.com/deposit.jpg' })

      await request(app)
        .put(`/api/v1/orders/${orderId}/wig-received`)
        .set('Authorization', `Bearer ${token}`)
        .send({ tracking_no: 'SF123' })

      await request(app)
        .put(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: ORDER_STATUS.IN_PROGRESS })

      await request(app)
        .put(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: ORDER_STATUS.IN_REVIEW })

      await request(app)
        .put(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: ORDER_STATUS.PENDING_BALANCE })

      await request(app)
        .put(`/api/v1/orders/${orderId}/balance`)
        .set('Authorization', `Bearer ${token}`)
        .send({ screenshot: 'https://example.com/balance.jpg' })

      await request(app)
        .put(`/api/v1/orders/${orderId}/ship`)
        .set('Authorization', `Bearer ${token}`)
        .send({ shipping_company: '顺丰', shipping_no: 'SF123' })

      // 完成订单
      const res = await request(app)
        .put(`/api/v1/orders/${orderId}/complete`)
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(res.body.code).toBe(0)
      expect(res.body.data.status).toBe(ORDER_STATUS.COMPLETED)
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

  describe('PUT /api/v1/orders/:id (更新订单信息)', () => {
    it('应该成功更新制作笔记 (PRD B-03)', async () => {
      const res = await request(app)
        .put(`/api/v1/orders/${orderId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ production_notes: '发量偏少，需要垫发包' })

      expect(res.status).toBe(200)
      expect(res.body.code).toBe(0)
      expect(res.body.data.production_notes).toBe('发量偏少，需要垫发包')
    })

    it('更新价格时应该自动重新计算定金和尾款', async () => {
      const res = await request(app)
        .put(`/api/v1/orders/${orderId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ price: 1000 })

      expect(res.body.data.price).toBe(1000)
      expect(res.body.data.deposit).toBe(200)  // 1000 * 20%
      expect(res.body.data.balance).toBe(800)  // 1000 * 80%
    })
  })
})
