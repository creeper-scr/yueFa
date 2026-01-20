import { beforeAll, afterAll, beforeEach } from 'vitest'
import { initDb, getDb, runQuery } from '../models/index.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// 设置环境变量
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test_jwt_secret'
process.env.JWT_EXPIRES_IN = '1h'
process.env.DB_PATH = './data/test.db'

// 测试前初始化
beforeAll(async () => {
  await initDb()
})

// 每个测试前清空数据
beforeEach(() => {
  const db = getDb()
  db.run('DELETE FROM review_revisions')
  db.run('DELETE FROM reviews')
  db.run('DELETE FROM sms_codes')
  db.run('DELETE FROM orders')
  db.run('DELETE FROM inquiries')
  db.run('DELETE FROM works')
  db.run('DELETE FROM users')
})

// 测试后清理
afterAll(() => {
  const testDbPath = path.resolve(__dirname, '../../data/test.db')
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath)
  }
})
