import { selectOne, runQuery } from './index.js'
import { v4 as uuidv4 } from 'uuid'

export const SmsCodeModel = {
  // 创建验证码
  create(phone, code, expiresInMinutes = 5) {
    const id = uuidv4()
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000).toISOString()
    const now = new Date().toISOString()

    // 删除该手机号之前的未使用验证码
    runQuery('DELETE FROM sms_codes WHERE phone = ? AND used = 0', [phone])

    // 创建新验证码
    runQuery(
      `
      INSERT INTO sms_codes (id, phone, code, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?)
    `,
      [id, phone, code, expiresAt, now]
    )

    return { id, phone, code, expires_at: expiresAt }
  },

  // 验证并使用验证码
  verify(phone, code) {
    const now = new Date().toISOString()

    const record = selectOne(
      `
      SELECT * FROM sms_codes
      WHERE phone = ? AND code = ? AND used = 0 AND expires_at > ?
      ORDER BY created_at DESC
      LIMIT 1
    `,
      [phone, code, now]
    )

    if (!record) return false

    // 标记为已使用
    runQuery('UPDATE sms_codes SET used = 1 WHERE id = ?', [record.id])

    return true
  },

  // 检查发送频率限制（1分钟内只能发送1次）
  canSend(phone) {
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString()

    const record = selectOne(
      `
      SELECT * FROM sms_codes
      WHERE phone = ? AND created_at > ?
      LIMIT 1
    `,
      [phone, oneMinuteAgo]
    )

    return !record
  }
}
