import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { app } from '../app.js'
import { SmsCodeModel } from '../models/SmsCode.js'

describe('Works API', () => {
  const testPhone = '13800138000'
  let token
  let userId
  let workId

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
      .send({ slug: 'test_works_user' })
  })

  describe('GET /api/v1/works', () => {
    it('应该返回当前用户的作品列表', async () => {
      // 先创建一个作品
      await request(app)
        .post('/api/v1/works')
        .set('Authorization', `Bearer ${token}`)
        .send({
          image_url: 'https://example.com/work1.jpg',
          title: '雷电将军',
          source_work: '原神',
          tags: ['长发', '渐变紫']
        })

      const res = await request(app)
        .get('/api/v1/works')
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(res.body.code).toBe(0)
      expect(Array.isArray(res.body.data)).toBe(true)
      expect(res.body.data.length).toBeGreaterThanOrEqual(1)
    })

    it('应该返回空数组当没有作品时', async () => {
      const res = await request(app)
        .get('/api/v1/works')
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(res.body.code).toBe(0)
      expect(res.body.data).toHaveLength(0)
    })
  })

  describe('POST /api/v1/works', () => {
    it('应该成功创建新作品', async () => {
      const res = await request(app)
        .post('/api/v1/works')
        .set('Authorization', `Bearer ${token}`)
        .send({
          image_url: 'https://example.com/work.jpg',
          title: '胡桃',
          source_work: '原神',
          tags: ['双马尾', '棕色']
        })

      expect(res.status).toBe(200)
      expect(res.body.code).toBe(0)
      expect(res.body.data.title).toBe('胡桃')
      expect(res.body.data.image_url).toBe('https://example.com/work.jpg')
      expect(res.body.data.tags).toEqual(['双马尾', '棕色'])
      workId = res.body.data.id
    })

    it('应该拒绝缺少image_url的请求', async () => {
      const res = await request(app)
        .post('/api/v1/works')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: '胡桃',
          source_work: '原神'
        })

      expect(res.body.code).toBe(1001)
    })

    it('应该拒绝未认证的请求', async () => {
      const res = await request(app)
        .post('/api/v1/works')
        .send({
          image_url: 'https://example.com/work.jpg',
          title: '胡桃'
        })

      expect(res.body.code).toBe(2001)
    })
  })

  describe('PUT /api/v1/works/:id', () => {
    beforeEach(async () => {
      // 创建一个作品
      const createRes = await request(app)
        .post('/api/v1/works')
        .set('Authorization', `Bearer ${token}`)
        .send({
          image_url: 'https://example.com/work.jpg',
          title: '原标题'
        })
      workId = createRes.body.data.id
    })

    it('应该成功更新作品', async () => {
      const res = await request(app)
        .put(`/api/v1/works/${workId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: '新标题',
          source_work: '原神'
        })

      expect(res.status).toBe(200)
      expect(res.body.code).toBe(0)
      expect(res.body.data.title).toBe('新标题')
    })

    it('应该返回404对于不存在的作品', async () => {
      const res = await request(app)
        .put('/api/v1/works/nonexistent-id')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: '新标题' })

      expect(res.body.code).toBe(3001)
    })

    it('应该拒绝无权限修改他人作品', async () => {
      // 创建另一个用户
      SmsCodeModel.create('13900139000', '654321')
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ phone: '13900139000', code: '654321' })
      const otherToken = loginRes.body.data.token

      const res = await request(app)
        .put(`/api/v1/works/${workId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ title: '尝试修改' })

      expect(res.body.code).toBe(2002)
    })
  })

  describe('DELETE /api/v1/works/:id', () => {
    beforeEach(async () => {
      const createRes = await request(app)
        .post('/api/v1/works')
        .set('Authorization', `Bearer ${token}`)
        .send({
          image_url: 'https://example.com/work.jpg',
          title: '待删除'
        })
      workId = createRes.body.data.id
    })

    it('应该成功删除作品', async () => {
      const res = await request(app)
        .delete(`/api/v1/works/${workId}`)
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(res.body.code).toBe(0)
      expect(res.body.message).toBe('删除成功')

      // 验证已被删除（软删除）
      const listRes = await request(app)
        .get('/api/v1/works')
        .set('Authorization', `Bearer ${token}`)
      expect(listRes.body.data.find(w => w.id === workId)).toBeUndefined()
    })

    it('应该拒绝无权限删除他人作品', async () => {
      SmsCodeModel.create('13900139000', '654321')
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ phone: '13900139000', code: '654321' })
      const otherToken = loginRes.body.data.token

      const res = await request(app)
        .delete(`/api/v1/works/${workId}`)
        .set('Authorization', `Bearer ${otherToken}`)

      expect(res.body.code).toBe(2002)
    })
  })

  describe('PUT /api/v1/works/batch/sort', () => {
    let workId1, workId2

    beforeEach(async () => {
      const res1 = await request(app)
        .post('/api/v1/works')
        .set('Authorization', `Bearer ${token}`)
        .send({ image_url: 'https://example.com/1.jpg', title: '作品1' })
      workId1 = res1.body.data.id

      const res2 = await request(app)
        .post('/api/v1/works')
        .set('Authorization', `Bearer ${token}`)
        .send({ image_url: 'https://example.com/2.jpg', title: '作品2' })
      workId2 = res2.body.data.id
    })

    it('应该成功批量更新排序', async () => {
      const res = await request(app)
        .put('/api/v1/works/batch/sort')
        .set('Authorization', `Bearer ${token}`)
        .send({
          orders: [
            { id: workId1, sort_order: 2 },
            { id: workId2, sort_order: 1 }
          ]
        })

      expect(res.status).toBe(200)
      expect(res.body.code).toBe(0)
    })

    it('应该拒绝无效的参数格式', async () => {
      const res = await request(app)
        .put('/api/v1/works/batch/sort')
        .set('Authorization', `Bearer ${token}`)
        .send({ orders: 'invalid' })

      expect(res.body.code).toBe(1001)
    })
  })

  describe('GET /api/v1/users/:slug/works', () => {
    beforeEach(async () => {
      // 创建几个作品
      await request(app)
        .post('/api/v1/works')
        .set('Authorization', `Bearer ${token}`)
        .send({
          image_url: 'https://example.com/work1.jpg',
          title: '公开作品1'
        })

      await request(app)
        .post('/api/v1/works')
        .set('Authorization', `Bearer ${token}`)
        .send({
          image_url: 'https://example.com/work2.jpg',
          title: '公开作品2'
        })
    })

    it('应该返回公开作品列表', async () => {
      const res = await request(app)
        .get('/api/v1/users/test_works_user/works')

      expect(res.status).toBe(200)
      expect(res.body.code).toBe(0)
      expect(Array.isArray(res.body.data)).toBe(true)
      expect(res.body.data.length).toBe(2)
    })

    it('应该返回404对于不存在的slug', async () => {
      const res = await request(app)
        .get('/api/v1/users/nonexistent/works')

      expect(res.body.code).toBe(3001)
    })
  })
})
