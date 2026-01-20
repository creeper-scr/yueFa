import { selectOne, selectQuery, runQuery } from './index.js'
import { v4 as uuidv4 } from 'uuid'
import crypto from 'crypto'

export const ReviewModel = {
  // 根据ID查找验收记录
  findById(id) {
    const row = selectOne('SELECT * FROM reviews WHERE id = ?', [id])
    if (!row) return null

    return this._parseReview(row)
  },

  // 根据token查找验收记录 (客户端访问)
  findByToken(token) {
    const row = selectOne('SELECT * FROM reviews WHERE review_token = ?', [token])
    if (!row) return null

    return this._parseReview(row)
  },

  // 根据订单ID查找验收记录
  findByOrderId(orderId) {
    const row = selectOne('SELECT * FROM reviews WHERE order_id = ?', [orderId])
    if (!row) return null

    return this._parseReview(row)
  },

  // 解析验收数据
  _parseReview(row) {
    return {
      ...row,
      images: row.images ? JSON.parse(row.images) : [],
      is_approved: row.is_approved === 1 ? true : row.is_approved === 0 ? false : null
    }
  },

  // 生成唯一的验收token
  _generateToken() {
    return crypto.randomBytes(16).toString('hex')
  },

  // 创建验收记录 (PRD R-01)
  create(data) {
    const id = uuidv4()
    const token = this._generateToken()
    const images = JSON.stringify(data.images || [])
    const now = new Date().toISOString()

    // 构建验收URL
    const baseUrl = process.env.BASE_URL || 'http://localhost:5173'
    const reviewUrl = `${baseUrl}/review/${token}`

    runQuery(`
      INSERT INTO reviews (
        id, order_id, images, description, review_token, review_url,
        max_revisions, revision_count, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, data.order_id, images, data.description || null,
      token, reviewUrl,
      data.max_revisions || 2, 0, now, now
    ])

    return this.findById(id)
  },

  // 更新验收记录
  update(id, data) {
    const fields = []
    const values = []

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && key !== 'id' && key !== 'order_id') {
        if (key === 'images') {
          fields.push(`${key} = ?`)
          values.push(JSON.stringify(value))
        } else {
          fields.push(`${key} = ?`)
          values.push(value)
        }
      }
    }

    if (fields.length === 0) return this.findById(id)

    fields.push('updated_at = ?')
    values.push(new Date().toISOString())
    values.push(id)

    const sql = `UPDATE reviews SET ${fields.join(', ')} WHERE id = ?`
    runQuery(sql, values)

    return this.findById(id)
  },

  // 客户确认满意 (PRD R-01)
  approve(id) {
    const now = new Date().toISOString()

    runQuery(`
      UPDATE reviews
      SET is_approved = 1, approved_at = ?, updated_at = ?
      WHERE id = ?
    `, [now, now, id])

    return this.findById(id)
  },

  // 增加修改次数
  incrementRevisionCount(id) {
    const review = this.findById(id)
    if (!review) return null

    const newCount = (review.revision_count || 0) + 1
    const now = new Date().toISOString()

    runQuery(`
      UPDATE reviews
      SET revision_count = ?, updated_at = ?
      WHERE id = ?
    `, [newCount, now, id])

    return this.findById(id)
  },

  // 检查是否还可以申请修改
  canRequestRevision(id) {
    const review = this.findById(id)
    if (!review) return false

    return review.revision_count < review.max_revisions
  }
}

// 修改记录模型
export const ReviewRevisionModel = {
  // 根据ID查找
  findById(id) {
    const row = selectOne('SELECT * FROM review_revisions WHERE id = ?', [id])
    if (!row) return null

    return this._parseRevision(row)
  },

  // 获取验收的所有修改记录
  findByReviewId(reviewId) {
    const rows = selectQuery(`
      SELECT * FROM review_revisions
      WHERE review_id = ?
      ORDER BY revision_number ASC
    `, [reviewId])

    return rows.map(row => this._parseRevision(row))
  },

  // 解析修改记录
  _parseRevision(row) {
    return {
      ...row,
      request_images: row.request_images ? JSON.parse(row.request_images) : [],
      response_images: row.response_images ? JSON.parse(row.response_images) : [],
      is_satisfied: row.is_satisfied === 1 ? true : row.is_satisfied === 0 ? false : null
    }
  },

  // 创建修改请求 (PRD R-02)
  create(data) {
    const id = uuidv4()
    const requestImages = data.request_images ? JSON.stringify(data.request_images) : null
    const now = new Date().toISOString()

    runQuery(`
      INSERT INTO review_revisions (
        id, review_id, revision_number, request_content, request_images, requested_at
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      id, data.review_id, data.revision_number,
      data.request_content, requestImages, now
    ])

    return this.findById(id)
  },

  // 毛娘提交修改结果
  submitResponse(id, data) {
    const responseImages = data.response_images ? JSON.stringify(data.response_images) : null
    const now = new Date().toISOString()

    runQuery(`
      UPDATE review_revisions
      SET response_images = ?, response_notes = ?, completed_at = ?
      WHERE id = ?
    `, [responseImages, data.response_notes || null, now, id])

    return this.findById(id)
  },

  // 客户确认修改结果
  confirmSatisfaction(id, isSatisfied) {
    const now = new Date().toISOString()

    runQuery(`
      UPDATE review_revisions
      SET is_satisfied = ?, confirmed_at = ?
      WHERE id = ?
    `, [isSatisfied ? 1 : 0, now, id])

    return this.findById(id)
  },

  // 获取待处理的修改请求 (毛娘还未回复的)
  getPendingByReviewId(reviewId) {
    const row = selectOne(`
      SELECT * FROM review_revisions
      WHERE review_id = ? AND completed_at IS NULL
      ORDER BY revision_number DESC
      LIMIT 1
    `, [reviewId])

    if (!row) return null
    return this._parseRevision(row)
  }
}
