import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { app } from '../app.js'
import { SmsCodeModel } from '../models/SmsCode.js'
import { ORDER_STATUS } from '../models/Order.js'

describe('Reviews API (PRD R系列)', () => {
  const testPhone = '13800138000'
  let token
  let orderId
  let reviewId
  let reviewToken

  // 辅助函数：准备订单到制作中状态
  const prepareOrderToInProgress = async () => {
    // 创建询价
    const inquiryRes = await request(app)
      .post('/api/v1/inquiries')
      .send({
        user_slug: 'test_maoyang',
        customer_name: '测试客户',
        customer_contact: 'wx: test',
        character_name: '胡桃',
        source_work: '原神',
        wig_source: 'client_sends'
      })

    // 转为订单
    const convertRes = await request(app)
      .post(`/api/v1/inquiries/${inquiryRes.body.data.id}/convert`)
      .set('Authorization', `Bearer ${token}`)
      .send({ price: 500 })

    const newOrderId = convertRes.body.data.id

    // 确认定金
    await request(app)
      .put(`/api/v1/orders/${newOrderId}/deposit`)
      .set('Authorization', `Bearer ${token}`)
      .send({ screenshot: 'https://example.com/deposit.jpg' })

    // 确认毛坯收货
    await request(app)
      .put(`/api/v1/orders/${newOrderId}/wig-received`)
      .set('Authorization', `Bearer ${token}`)
      .send({ tracking_no: 'SF123' })

    // 开始制作
    await request(app)
      .put(`/api/v1/orders/${newOrderId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: ORDER_STATUS.IN_PROGRESS })

    return newOrderId
  }

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

    // 准备订单到制作中状态
    orderId = await prepareOrderToInProgress()
  })

  describe('POST /api/v1/reviews (PRD R-01 创建验收)', () => {
    it('应该成功创建验收记录', async () => {
      const res = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({
          order_id: orderId,
          images: ['https://example.com/finished1.jpg', 'https://example.com/finished2.jpg'],
          description: '成品已完成，请查看360度展示图'
        })

      expect(res.status).toBe(200)
      expect(res.body.code).toBe(0)
      expect(res.body.data.id).toBeDefined()
      expect(res.body.data.review_url).toBeDefined()
      expect(res.body.data.review_token).toBeDefined()
      expect(res.body.data.max_revisions).toBe(2)
    })

    it('创建验收后订单状态应该变为验收中', async () => {
      await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({
          order_id: orderId,
          images: ['https://example.com/finished.jpg'],
          description: '成品展示'
        })

      const orderRes = await request(app)
        .get(`/api/v1/orders/${orderId}`)
        .set('Authorization', `Bearer ${token}`)

      expect(orderRes.body.data.status).toBe(ORDER_STATUS.IN_REVIEW)
    })

    it('应该拒绝没有图片的验收', async () => {
      const res = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({
          order_id: orderId,
          images: [],
          description: '没有图片'
        })

      expect(res.body.code).toBe(1001)
    })

    it('应该拒绝非制作中状态的订单', async () => {
      // 先创建一个验收，订单状态变为验收中
      await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({
          order_id: orderId,
          images: ['https://example.com/finished.jpg']
        })

      // 尝试再次创建
      const res = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({
          order_id: orderId,
          images: ['https://example.com/finished2.jpg']
        })

      expect(res.body.code).toBe(3002)
    })

    it('应该拒绝重复创建验收', async () => {
      // 创建一个新的制作中订单
      const newOrderId = await prepareOrderToInProgress()

      // 第一次创建验收
      await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({
          order_id: newOrderId,
          images: ['https://example.com/finished.jpg']
        })

      // 尝试重复创建
      const res = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({
          order_id: newOrderId,
          images: ['https://example.com/finished2.jpg']
        })

      expect(res.body.code).toBe(3002)
    })
  })

  describe('GET /api/v1/reviews/token/:token (PRD R-01 客户访问验收页)', () => {
    beforeEach(async () => {
      const createRes = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({
          order_id: orderId,
          images: ['https://example.com/finished.jpg'],
          description: '成品展示'
        })
      reviewId = createRes.body.data.id
      reviewToken = createRes.body.data.review_token
    })

    it('应该通过token访问验收页 (无需登录)', async () => {
      const res = await request(app)
        .get(`/api/v1/reviews/token/${reviewToken}`)

      expect(res.status).toBe(200)
      expect(res.body.code).toBe(0)
      expect(res.body.data.images).toHaveLength(1)
      expect(res.body.data.order.character_name).toBe('胡桃')
      expect(res.body.data.revision_count).toBe(0)
      expect(res.body.data.max_revisions).toBe(2)
    })

    it('应该返回订单的脱敏信息', async () => {
      const res = await request(app)
        .get(`/api/v1/reviews/token/${reviewToken}`)

      // 只返回角色和作品名，不返回客户联系方式等敏感信息
      expect(res.body.data.order.character_name).toBeDefined()
      expect(res.body.data.order.source_work).toBeDefined()
      expect(res.body.data.order.customer_contact).toBeUndefined()
    })

    it('应该拒绝无效的token', async () => {
      const res = await request(app)
        .get('/api/v1/reviews/token/invalid_token_12345')

      expect(res.body.code).toBe(3001)
    })
  })

  describe('POST /api/v1/reviews/:id/approve (PRD R-01 客户确认满意)', () => {
    beforeEach(async () => {
      const createRes = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({
          order_id: orderId,
          images: ['https://example.com/finished.jpg'],
          description: '成品展示'
        })
      reviewId = createRes.body.data.id
      reviewToken = createRes.body.data.review_token
    })

    it('应该成功确认满意', async () => {
      const res = await request(app)
        .post(`/api/v1/reviews/${reviewId}/approve`)
        .send({ token: reviewToken })

      expect(res.status).toBe(200)
      expect(res.body.code).toBe(0)
      expect(res.body.data.is_approved).toBe(true)
      expect(res.body.data.approved_at).toBeDefined()
    })

    it('确认满意后订单状态应该变为待尾款', async () => {
      await request(app)
        .post(`/api/v1/reviews/${reviewId}/approve`)
        .send({ token: reviewToken })

      const orderRes = await request(app)
        .get(`/api/v1/orders/${orderId}`)
        .set('Authorization', `Bearer ${token}`)

      expect(orderRes.body.data.status).toBe(ORDER_STATUS.PENDING_BALANCE)
    })

    it('应该拒绝错误的token', async () => {
      const res = await request(app)
        .post(`/api/v1/reviews/${reviewId}/approve`)
        .send({ token: 'wrong_token' })

      expect(res.body.code).toBe(2001)
    })

    it('应该拒绝重复确认', async () => {
      // 第一次确认
      await request(app)
        .post(`/api/v1/reviews/${reviewId}/approve`)
        .send({ token: reviewToken })

      // 第二次确认
      const res = await request(app)
        .post(`/api/v1/reviews/${reviewId}/approve`)
        .send({ token: reviewToken })

      expect(res.body.code).toBe(3002)
    })
  })

  describe('POST /api/v1/reviews/:id/revision (PRD R-02 客户申请修改)', () => {
    beforeEach(async () => {
      const createRes = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({
          order_id: orderId,
          images: ['https://example.com/finished.jpg'],
          description: '成品展示'
        })
      reviewId = createRes.body.data.id
      reviewToken = createRes.body.data.review_token
    })

    it('应该成功申请修改', async () => {
      const res = await request(app)
        .post(`/api/v1/reviews/${reviewId}/revision`)
        .send({
          token: reviewToken,
          request_content: '刘海希望再剪短一点',
          request_images: ['https://example.com/reference.jpg']
        })

      expect(res.status).toBe(200)
      expect(res.body.code).toBe(0)
      expect(res.body.data.revision_number).toBe(1)
      expect(res.body.data.remaining_revisions).toBe(1)
    })

    it('应该限制修改次数 (PRD R-01 最多2次)', async () => {
      // 第一次修改
      await request(app)
        .post(`/api/v1/reviews/${reviewId}/revision`)
        .send({
          token: reviewToken,
          request_content: '第一次修改'
        })

      // 毛娘回复第一次修改
      const reviewRes = await request(app)
        .get(`/api/v1/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${token}`)

      const revisionId = reviewRes.body.data.revisions[0].id
      await request(app)
        .put(`/api/v1/reviews/${reviewId}/revision/${revisionId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          response_images: ['https://example.com/fixed1.jpg'],
          response_notes: '已修改'
        })

      // 第二次修改
      await request(app)
        .post(`/api/v1/reviews/${reviewId}/revision`)
        .send({
          token: reviewToken,
          request_content: '第二次修改'
        })

      // 毛娘回复第二次修改
      const reviewRes2 = await request(app)
        .get(`/api/v1/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${token}`)

      const revisionId2 = reviewRes2.body.data.revisions[1].id
      await request(app)
        .put(`/api/v1/reviews/${reviewId}/revision/${revisionId2}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          response_images: ['https://example.com/fixed2.jpg'],
          response_notes: '已修改'
        })

      // 第三次修改应该被拒绝
      const res = await request(app)
        .post(`/api/v1/reviews/${reviewId}/revision`)
        .send({
          token: reviewToken,
          request_content: '第三次修改'
        })

      expect(res.body.code).toBe(3003)
      expect(res.body.message).toContain('用完')
    })

    it('应该拒绝已确认满意后的修改申请', async () => {
      // 先确认满意
      await request(app)
        .post(`/api/v1/reviews/${reviewId}/approve`)
        .send({ token: reviewToken })

      // 尝试申请修改
      const res = await request(app)
        .post(`/api/v1/reviews/${reviewId}/revision`)
        .send({
          token: reviewToken,
          request_content: '想修改'
        })

      expect(res.body.code).toBe(3002)
    })

    it('应该拒绝空的修改意见', async () => {
      const res = await request(app)
        .post(`/api/v1/reviews/${reviewId}/revision`)
        .send({
          token: reviewToken,
          request_content: ''
        })

      expect(res.body.code).toBe(1001)
    })
  })

  describe('PUT /api/v1/reviews/:id/revision/:revisionId (毛娘提交修改结果)', () => {
    let revisionId

    beforeEach(async () => {
      // 创建验收
      const createRes = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({
          order_id: orderId,
          images: ['https://example.com/finished.jpg'],
          description: '成品展示'
        })
      reviewId = createRes.body.data.id
      reviewToken = createRes.body.data.review_token

      // 客户申请修改
      await request(app)
        .post(`/api/v1/reviews/${reviewId}/revision`)
        .send({
          token: reviewToken,
          request_content: '刘海再短一点'
        })

      // 获取修改记录ID
      const reviewRes = await request(app)
        .get(`/api/v1/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${token}`)
      revisionId = reviewRes.body.data.revisions[0].id
    })

    it('应该成功提交修改结果', async () => {
      const res = await request(app)
        .put(`/api/v1/reviews/${reviewId}/revision/${revisionId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          response_images: ['https://example.com/fixed.jpg'],
          response_notes: '已按要求修改刘海'
        })

      expect(res.status).toBe(200)
      expect(res.body.code).toBe(0)
      expect(res.body.data.response_images).toHaveLength(1)
      expect(res.body.data.completed_at).toBeDefined()
    })

    it('提交修改后验收记录图片应该更新', async () => {
      await request(app)
        .put(`/api/v1/reviews/${reviewId}/revision/${revisionId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          response_images: ['https://example.com/new_finished.jpg'],
          response_notes: '修改完成'
        })

      // 客户查看验收页
      const res = await request(app)
        .get(`/api/v1/reviews/token/${reviewToken}`)

      expect(res.body.data.images).toContain('https://example.com/new_finished.jpg')
    })

    it('应该拒绝没有图片的修改提交', async () => {
      const res = await request(app)
        .put(`/api/v1/reviews/${reviewId}/revision/${revisionId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          response_images: [],
          response_notes: '没有图片'
        })

      expect(res.body.code).toBe(1001)
    })
  })

  describe('GET /api/v1/reviews/order/:orderId (毛娘查看订单的验收记录)', () => {
    it('应该返回订单的验收记录', async () => {
      // 创建验收
      await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({
          order_id: orderId,
          images: ['https://example.com/finished.jpg'],
          description: '成品展示'
        })

      const res = await request(app)
        .get(`/api/v1/reviews/order/${orderId}`)
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(res.body.code).toBe(0)
      expect(res.body.data.images).toHaveLength(1)
    })

    it('没有验收记录时应该返回null', async () => {
      const res = await request(app)
        .get(`/api/v1/reviews/order/${orderId}`)
        .set('Authorization', `Bearer ${token}`)

      expect(res.body.data).toBeNull()
    })
  })

  describe('完整验收流程测试 (PRD R系列)', () => {
    it('应该完成完整验收流程: 创建 -> 申请修改 -> 提交修改 -> 确认满意', async () => {
      // 1. 创建验收
      const createRes = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({
          order_id: orderId,
          images: ['https://example.com/finished.jpg'],
          description: '成品展示'
        })
      const reviewId = createRes.body.data.id
      const reviewToken = createRes.body.data.review_token

      // 2. 客户申请修改
      const revisionRes = await request(app)
        .post(`/api/v1/reviews/${reviewId}/revision`)
        .send({
          token: reviewToken,
          request_content: '刘海短一点'
        })
      expect(revisionRes.body.data.revision_number).toBe(1)

      // 3. 获取修改记录ID
      const reviewRes = await request(app)
        .get(`/api/v1/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${token}`)
      const revisionId = reviewRes.body.data.revisions[0].id

      // 4. 毛娘提交修改
      await request(app)
        .put(`/api/v1/reviews/${reviewId}/revision/${revisionId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          response_images: ['https://example.com/fixed.jpg'],
          response_notes: '已修改'
        })

      // 5. 客户确认满意
      const approveRes = await request(app)
        .post(`/api/v1/reviews/${reviewId}/approve`)
        .send({ token: reviewToken })
      expect(approveRes.body.data.is_approved).toBe(true)

      // 6. 验证订单状态变为待尾款
      const orderRes = await request(app)
        .get(`/api/v1/orders/${orderId}`)
        .set('Authorization', `Bearer ${token}`)
      expect(orderRes.body.data.status).toBe(ORDER_STATUS.PENDING_BALANCE)
    })
  })
})
