import { selectOne, selectQuery, runQuery } from './index.js'
import { v4 as uuidv4 } from 'uuid'

export const InquiryModel = {
  // 根据ID查找询价
  findById(id) {
    const row = selectOne('SELECT * FROM inquiries WHERE id = ?', [id])
    if (!row) return null

    return {
      ...row,
      reference_images: row.reference_images ? JSON.parse(row.reference_images) : []
    }
  },

  // 获取用户的询价列表
  findByUserId(userId, { status, page = 1, limit = 20 } = {}) {
    let sql = 'SELECT * FROM inquiries WHERE user_id = ?'
    const params = [userId]

    if (status) {
      sql += ' AND status = ?'
      params.push(status)
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    params.push(limit, (page - 1) * limit)

    const rows = selectQuery(sql, params)
    return rows.map(row => ({
      ...row,
      reference_images: row.reference_images ? JSON.parse(row.reference_images) : []
    }))
  },

  // 获取询价总数
  countByUserId(userId, status) {
    let sql = 'SELECT COUNT(*) as count FROM inquiries WHERE user_id = ?'
    const params = [userId]

    if (status) {
      sql += ' AND status = ?'
      params.push(status)
    }

    const result = selectOne(sql, params)
    return result ? result.count : 0
  },

  // 创建询价
  create(data) {
    const id = uuidv4()
    const referenceImages = data.reference_images ? JSON.stringify(data.reference_images) : null
    const now = new Date().toISOString()

    runQuery(`
      INSERT INTO inquiries (id, user_id, customer_name, customer_contact, character_name,
                            source_work, expected_deadline, head_circumference, budget_range,
                            reference_images, requirements, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, data.user_id, data.customer_name || null, data.customer_contact || null,
        data.character_name, data.source_work || null, data.expected_deadline || null,
        data.head_circumference || null, data.budget_range || null, referenceImages,
        data.requirements || null, now])

    return this.findById(id)
  },

  // 更新询价状态
  updateStatus(id, status) {
    runQuery('UPDATE inquiries SET status = ? WHERE id = ?', [status, id])
    return this.findById(id)
  }
}
