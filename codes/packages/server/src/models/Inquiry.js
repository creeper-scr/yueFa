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

  // 按状态统计询价数
  countByStatus(userId) {
    const rows = selectQuery(`
      SELECT status, COUNT(*) as count
      FROM inquiries
      WHERE user_id = ?
      GROUP BY status
    `, [userId])

    const result = {
      new: 0,
      quoted: 0,
      converted: 0,
      rejected: 0,
      total: 0
    }

    for (const row of rows) {
      result[row.status] = row.count
      result.total += row.count
    }

    return result
  },

  // 创建询价 (PRD 2.0 升级 - 支持新字段)
  create(data) {
    const id = uuidv4()
    const referenceImages = data.reference_images ? JSON.stringify(data.reference_images) : null
    const now = new Date().toISOString()

    runQuery(`
      INSERT INTO inquiries (id, user_id, customer_name, customer_contact, character_name,
                            source_work, expected_deadline, head_circumference, head_notes,
                            wig_source, budget_range, reference_images, special_requirements, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, data.user_id, data.customer_name || null, data.customer_contact || null,
        data.character_name, data.source_work || null, data.expected_deadline || null,
        data.head_circumference || null, data.head_notes || null,
        data.wig_source || 'client_sends', data.budget_range || null,
        referenceImages, data.special_requirements || null, now])

    return this.findById(id)
  },

  // 更新询价状态
  updateStatus(id, status) {
    runQuery('UPDATE inquiries SET status = ? WHERE id = ?', [status, id])
    return this.findById(id)
  },

  // 更新询价 (PRD 2.0 新增)
  update(id, data) {
    const fields = []
    const values = []

    const allowedFields = ['customer_name', 'customer_contact', 'character_name',
                          'source_work', 'expected_deadline', 'head_circumference',
                          'head_notes', 'wig_source', 'budget_range', 'special_requirements', 'status']

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && allowedFields.includes(key)) {
        if (key === 'reference_images') {
          fields.push(`${key} = ?`)
          values.push(JSON.stringify(value))
        } else {
          fields.push(`${key} = ?`)
          values.push(value)
        }
      }
    }

    if (fields.length === 0) return this.findById(id)

    values.push(id)
    const sql = `UPDATE inquiries SET ${fields.join(', ')} WHERE id = ?`
    runQuery(sql, values)

    return this.findById(id)
  }
}
