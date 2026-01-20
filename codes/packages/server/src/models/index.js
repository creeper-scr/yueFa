import initSqlJs from 'sql.js'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let db = null
let dbPath = null

// 初始化数据库
export const initDb = async () => {
  const SQL = await initSqlJs()

  dbPath = process.env.DB_PATH || './data/yuefa.db'
  const absolutePath = path.resolve(__dirname, '../../', dbPath)

  // 确保目录存在
  const dir = path.dirname(absolutePath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  // 尝试加载现有数据库
  if (fs.existsSync(absolutePath)) {
    const fileBuffer = fs.readFileSync(absolutePath)
    db = new SQL.Database(fileBuffer)
  } else {
    db = new SQL.Database()
  }

  // 创建表
  createTables()

  // 保存数据库
  saveDb()

  return db
}

// 保存数据库到文件
export const saveDb = () => {
  if (!db || !dbPath) return

  const absolutePath = path.resolve(__dirname, '../../', dbPath)
  const data = db.export()
  const buffer = Buffer.from(data)
  fs.writeFileSync(absolutePath, buffer)
}

// 获取数据库实例
export const getDb = () => {
  if (!db) {
    throw new Error('Database not initialized. Call initDb() first.')
  }
  return db
}

// 执行SQL并返回结果
export const runQuery = (sql, params = []) => {
  db.run(sql, params)
  saveDb()
}

// 执行SELECT查询
export const selectQuery = (sql, params = []) => {
  const stmt = db.prepare(sql)
  stmt.bind(params)

  const results = []
  while (stmt.step()) {
    const row = stmt.getAsObject()
    results.push(row)
  }
  stmt.free()

  return results
}

// 执行SELECT查询返回单行
export const selectOne = (sql, params = []) => {
  const results = selectQuery(sql, params)
  return results[0] || null
}

// 创建数据表
const createTables = () => {
  // 用户表
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      phone TEXT NOT NULL UNIQUE,
      nickname TEXT,
      avatar_url TEXT,
      wechat_id TEXT,
      announcement TEXT,
      slug TEXT UNIQUE,
      status INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // 作品表
  db.run(`
    CREATE TABLE IF NOT EXISTS works (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      image_url TEXT NOT NULL,
      thumbnail_url TEXT,
      title TEXT,
      source_work TEXT,
      tags TEXT,
      sort_order INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `)

  // 询价表 (PRD 2.0 升级)
  db.run(`
    CREATE TABLE IF NOT EXISTS inquiries (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      customer_name TEXT,
      customer_contact TEXT,
      character_name TEXT NOT NULL,
      source_work TEXT,
      expected_deadline TEXT,
      head_circumference TEXT,
      head_notes TEXT,
      wig_source TEXT DEFAULT 'client_sends',
      budget_range TEXT,
      reference_images TEXT,
      special_requirements TEXT,
      status TEXT DEFAULT 'new',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `)

  // 订单表 (PRD 2.0 核心升级 - 9状态流转)
  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      inquiry_id TEXT,
      customer_name TEXT,
      customer_contact TEXT,
      character_name TEXT NOT NULL,
      source_work TEXT,
      reference_images TEXT,
      head_circumference TEXT,
      head_notes TEXT,

      -- 毛坯管理 (PRD F-03)
      wig_source TEXT DEFAULT 'client_sends',
      wig_tracking_no TEXT,
      wig_received_at TEXT,
      wig_purchase_fee REAL,

      -- 价格信息 (PRD F-02)
      price REAL,
      deposit REAL,
      balance REAL,
      deposit_paid_at TEXT,
      deposit_screenshot TEXT,
      balance_paid_at TEXT,
      balance_screenshot TEXT,

      -- 工期管理 (PRD B-02)
      deadline TEXT,

      -- 发货信息 (PRD S-01)
      shipping_no TEXT,
      shipping_company TEXT,
      shipped_at TEXT,
      shipping_checklist TEXT,

      -- 制作笔记 (PRD B-03)
      production_notes TEXT,

      -- 备注
      notes TEXT,

      -- 订单状态 (PRD 2.0 九状态)
      status TEXT DEFAULT 'pending_quote',

      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (inquiry_id) REFERENCES inquiries(id)
    )
  `)

  // 验收记录表 (PRD R-01 新增)
  db.run(`
    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      images TEXT NOT NULL,
      description TEXT,
      review_token TEXT UNIQUE,
      review_url TEXT,
      is_approved INTEGER,
      approved_at TEXT,
      max_revisions INTEGER DEFAULT 2,
      revision_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    )
  `)

  // 修改记录表 (PRD R-02 新增)
  db.run(`
    CREATE TABLE IF NOT EXISTS review_revisions (
      id TEXT PRIMARY KEY,
      review_id TEXT NOT NULL,
      revision_number INTEGER NOT NULL,
      request_content TEXT NOT NULL,
      request_images TEXT,
      requested_at TEXT DEFAULT CURRENT_TIMESTAMP,
      response_images TEXT,
      response_notes TEXT,
      completed_at TEXT,
      is_satisfied INTEGER,
      confirmed_at TEXT,
      FOREIGN KEY (review_id) REFERENCES reviews(id)
    )
  `)

  // 验证码表
  db.run(`
    CREATE TABLE IF NOT EXISTS sms_codes (
      id TEXT PRIMARY KEY,
      phone TEXT NOT NULL,
      code TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // 创建索引
  db.run(`CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone)`)
  db.run(`CREATE INDEX IF NOT EXISTS idx_users_slug ON users(slug)`)
  db.run(`CREATE INDEX IF NOT EXISTS idx_works_user_id ON works(user_id)`)
  db.run(`CREATE INDEX IF NOT EXISTS idx_inquiries_user_id ON inquiries(user_id)`)
  db.run(`CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status)`)
  db.run(`CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id)`)
  db.run(`CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)`)
  db.run(`CREATE INDEX IF NOT EXISTS idx_orders_deadline ON orders(deadline)`)
  db.run(`CREATE INDEX IF NOT EXISTS idx_sms_codes_phone ON sms_codes(phone)`)
  db.run(`CREATE INDEX IF NOT EXISTS idx_reviews_order_id ON reviews(order_id)`)
  db.run(`CREATE INDEX IF NOT EXISTS idx_reviews_token ON reviews(review_token)`)
  db.run(`CREATE INDEX IF NOT EXISTS idx_revisions_review_id ON review_revisions(review_id)`)
}

export default { initDb, getDb, saveDb, runQuery, selectQuery, selectOne }
