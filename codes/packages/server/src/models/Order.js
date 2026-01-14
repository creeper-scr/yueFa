import { selectOne, selectQuery, runQuery } from './index.js'
import { v4 as uuidv4 } from 'uuid'

export const OrderModel = {
  // 根据ID查找订单
  findById(id) {
    const row = selectOne('SELECT * FROM orders WHERE id = ?', [id])
    if (!row) return null

    return {
      ...row,
      reference_images: row.reference_images ? JSON.parse(row.reference_images) : [],
      notes: row.notes ? JSON.parse(row.notes) : []
    }
  },

  // 获取用户的订单列表
  findByUserId(userId, { status, page = 1, limit = 20 } = {}) {
    let sql = 'SELECT * FROM orders WHERE user_id = ?'
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
      reference_images: row.reference_images ? JSON.parse(row.reference_images) : [],
      notes: row.notes ? JSON.parse(row.notes) : []
    }))
  },

  // 获取订单总数
  countByUserId(userId, status) {
    let sql = 'SELECT COUNT(*) as count FROM orders WHERE user_id = ?'
    const params = [userId]

    if (status) {
      sql += ' AND status = ?'
      params.push(status)
    }

    const result = selectOne(sql, params)
    return result ? result.count : 0
  },

  // 按状态统计订单数
  countByStatus(userId) {
    const rows = selectQuery(`
      SELECT status, COUNT(*) as count
      FROM orders
      WHERE user_id = ?
      GROUP BY status
    `, [userId])

    const result = {
      pending_deposit: 0,
      in_production: 0,
      pending_ship: 0,
      completed: 0,
      total: 0
    }

    for (const row of rows) {
      result[row.status] = row.count
      result.total += row.count
    }

    return result
  },

  // 创建订单
  create(data) {
    const id = uuidv4()
    const referenceImages = data.reference_images ? JSON.stringify(data.reference_images) : null
    const notes = data.notes ? JSON.stringify(data.notes) : '[]'
    const now = new Date().toISOString()

    runQuery(`
      INSERT INTO orders (id, user_id, inquiry_id, customer_name, customer_contact,
                         character_name, source_work, deadline, head_circumference,
                         price, deposit, reference_images, requirements, status, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, data.user_id, data.inquiry_id || null, data.customer_name || null,
        data.customer_contact || null, data.character_name, data.source_work || null,
        data.deadline || null, data.head_circumference || null, data.price || null,
        data.deposit || null, referenceImages, data.requirements || null,
        data.status || 'pending_deposit', notes, now, now])

    return this.findById(id)
  },

  // 更新订单
  update(id, data) {
    const fields = []
    const values = []

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && key !== 'id' && key !== 'user_id') {
        if (key === 'reference_images' || key === 'notes') {
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

    const sql = `UPDATE orders SET ${fields.join(', ')} WHERE id = ?`
    runQuery(sql, values)

    return this.findById(id)
  },

  // 添加备注
  addNote(id, content) {
    const order = this.findById(id)
    if (!order) return null

    const notes = order.notes || []
    notes.push({
      id: uuidv4(),
      content,
      created_at: new Date().toISOString()
    })

    runQuery('UPDATE orders SET notes = ?, updated_at = ? WHERE id = ?',
      [JSON.stringify(notes), new Date().toISOString(), id])

    return this.findById(id)
  }
}
