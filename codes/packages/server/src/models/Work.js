import { selectOne, selectQuery, runQuery, saveDb } from './index.js'
import { v4 as uuidv4 } from 'uuid'

export const WorkModel = {
  // 根据ID查找作品
  findById(id) {
    const row = selectOne('SELECT * FROM works WHERE id = ? AND status = 1', [id])
    if (!row) return null
    return {
      ...row,
      tags: row.tags ? JSON.parse(row.tags) : []
    }
  },

  // 获取用户的作品列表
  findByUserId(userId) {
    const rows = selectQuery(`
      SELECT * FROM works
      WHERE user_id = ? AND status = 1
      ORDER BY sort_order ASC, created_at DESC
    `, [userId])

    return rows.map(row => ({
      ...row,
      tags: row.tags ? JSON.parse(row.tags) : []
    }))
  },

  // 创建作品
  create(data) {
    const id = uuidv4()
    const tags = data.tags ? JSON.stringify(data.tags) : null
    const now = new Date().toISOString()

    runQuery(`
      INSERT INTO works (id, user_id, image_url, thumbnail_url, title, source_work, tags, sort_order, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, data.user_id, data.image_url, data.thumbnail_url || null,
        data.title || null, data.source_work || null, tags, data.sort_order || 0, now])

    return this.findById(id)
  },

  // 更新作品
  update(id, data) {
    const fields = []
    const values = []

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && key !== 'id' && key !== 'user_id') {
        if (key === 'tags') {
          fields.push('tags = ?')
          values.push(JSON.stringify(value))
        } else {
          fields.push(`${key} = ?`)
          values.push(value)
        }
      }
    }

    if (fields.length === 0) return this.findById(id)

    values.push(id)
    const sql = `UPDATE works SET ${fields.join(', ')} WHERE id = ?`
    runQuery(sql, values)

    return this.findById(id)
  },

  // 删除作品（软删除）
  delete(id) {
    runQuery('UPDATE works SET status = 0 WHERE id = ?', [id])
    return true
  },

  // 批量更新排序
  updateSortOrder(userId, orderList) {
    for (const { id, sort_order } of orderList) {
      runQuery('UPDATE works SET sort_order = ? WHERE id = ? AND user_id = ?', [sort_order, id, userId])
    }
    return true
  }
}
