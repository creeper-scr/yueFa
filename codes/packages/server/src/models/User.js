import { selectOne, runQuery } from './index.js'
import { v4 as uuidv4 } from 'uuid'

export const UserModel = {
  // 根据手机号查找用户
  findByPhone(phone) {
    return selectOne('SELECT * FROM users WHERE phone = ?', [phone])
  },

  // 根据ID查找用户
  findById(id) {
    return selectOne('SELECT * FROM users WHERE id = ?', [id])
  },

  // 根据slug查找用户
  findBySlug(slug) {
    return selectOne('SELECT * FROM users WHERE slug = ?', [slug])
  },

  // 创建用户
  create(data) {
    const id = uuidv4()
    const now = new Date().toISOString()
    runQuery(
      `
      INSERT INTO users (id, phone, nickname, avatar_url, wechat_id, announcement, slug, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        id,
        data.phone,
        data.nickname || null,
        data.avatar_url || null,
        data.wechat_id || null,
        data.announcement || null,
        data.slug || null,
        now,
        now
      ]
    )
    return this.findById(id)
  },

  // 更新用户
  update(id, data) {
    const fields = []
    const values = []

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && key !== 'id') {
        fields.push(`${key} = ?`)
        values.push(value)
      }
    }

    if (fields.length === 0) return this.findById(id)

    fields.push('updated_at = ?')
    values.push(new Date().toISOString())
    values.push(id)

    const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`
    runQuery(sql, values)

    return this.findById(id)
  },

  // 检查slug是否可用
  isSlugAvailable(slug, excludeUserId = null) {
    let sql = 'SELECT id FROM users WHERE slug = ?'
    const params = [slug]

    if (excludeUserId) {
      sql += ' AND id != ?'
      params.push(excludeUserId)
    }

    const result = selectOne(sql, params)
    return !result
  }
}
