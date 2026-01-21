import pg from 'pg'

const { Pool } = pg

let pool = null

/**
 * 获取数据库连接池
 * 支持 DATABASE_URL 或分离的配置项
 */
export const getPool = () => {
  if (pool) return pool

  const connectionString = process.env.DATABASE_URL

  if (connectionString) {
    pool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    })
  } else {
    pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'yuefa',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    })
  }

  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err)
  })

  return pool
}

/**
 * 初始化数据库连接并运行迁移
 */
export const initDb = async () => {
  const pool = getPool()

  try {
    // 测试连接
    const client = await pool.connect()
    console.log('Database connected successfully')
    client.release()

    // 运行迁移
    await runMigrations(pool)

    return pool
  } catch (error) {
    console.error('Failed to initialize database:', error)
    throw error
  }
}

/**
 * 运行数据库迁移
 */
const runMigrations = async (pool) => {
  const client = await pool.connect()

  try {
    // 创建迁移记录表
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // 检查是否需要运行初始迁移
    const result = await client.query(
      "SELECT name FROM migrations WHERE name = '001_init'"
    )

    if (result.rows.length === 0) {
      console.log('Running initial migration...')
      await runInitialMigration(client)
      await client.query(
        "INSERT INTO migrations (name) VALUES ('001_init')"
      )
      console.log('Initial migration completed')
    }
  } finally {
    client.release()
  }
}

/**
 * 初始迁移 - 创建所有表
 */
const runInitialMigration = async (client) => {
  // 用户表
  await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      phone VARCHAR(20) NOT NULL UNIQUE,
      nickname VARCHAR(100),
      avatar_url TEXT,
      wechat_id VARCHAR(100),
      announcement TEXT,
      slug VARCHAR(100) UNIQUE,
      status INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // 作品表
  await client.query(`
    CREATE TABLE IF NOT EXISTS works (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL REFERENCES users(id),
      image_url TEXT NOT NULL,
      thumbnail_url TEXT,
      title VARCHAR(200),
      source_work VARCHAR(200),
      tags TEXT,
      sort_order INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // 询价表
  await client.query(`
    CREATE TABLE IF NOT EXISTS inquiries (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL REFERENCES users(id),
      customer_name VARCHAR(100),
      customer_contact VARCHAR(200),
      character_name VARCHAR(200) NOT NULL,
      source_work VARCHAR(200),
      expected_deadline DATE,
      head_circumference VARCHAR(50),
      head_notes TEXT,
      wig_source VARCHAR(50) DEFAULT 'client_sends',
      budget_range VARCHAR(100),
      reference_images TEXT,
      special_requirements TEXT,
      status VARCHAR(50) DEFAULT 'new',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // 订单表 (9状态流转)
  await client.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL REFERENCES users(id),
      inquiry_id VARCHAR(36) REFERENCES inquiries(id),
      customer_name VARCHAR(100),
      customer_contact VARCHAR(200),
      character_name VARCHAR(200) NOT NULL,
      source_work VARCHAR(200),
      reference_images TEXT,
      head_circumference VARCHAR(50),
      head_notes TEXT,

      -- 毛坯管理
      wig_source VARCHAR(50) DEFAULT 'client_sends',
      wig_tracking_no VARCHAR(100),
      wig_received_at TIMESTAMP,
      wig_purchase_fee DECIMAL(10,2),

      -- 价格信息
      price DECIMAL(10,2),
      deposit DECIMAL(10,2),
      balance DECIMAL(10,2),
      deposit_paid_at TIMESTAMP,
      deposit_screenshot TEXT,
      balance_paid_at TIMESTAMP,
      balance_screenshot TEXT,

      -- 工期管理
      deadline DATE,

      -- 发货信息
      shipping_no VARCHAR(100),
      shipping_company VARCHAR(100),
      shipped_at TIMESTAMP,
      shipping_checklist TEXT,

      -- 制作笔记
      production_notes TEXT,
      notes TEXT,

      -- 订单状态 (9状态)
      status VARCHAR(50) DEFAULT 'pending_quote',

      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // 验收记录表
  await client.query(`
    CREATE TABLE IF NOT EXISTS reviews (
      id VARCHAR(36) PRIMARY KEY,
      order_id VARCHAR(36) NOT NULL REFERENCES orders(id),
      images TEXT NOT NULL,
      description TEXT,
      review_token VARCHAR(100) UNIQUE,
      review_url TEXT,
      is_approved BOOLEAN,
      approved_at TIMESTAMP,
      max_revisions INTEGER DEFAULT 2,
      revision_count INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // 修改记录表
  await client.query(`
    CREATE TABLE IF NOT EXISTS review_revisions (
      id VARCHAR(36) PRIMARY KEY,
      review_id VARCHAR(36) NOT NULL REFERENCES reviews(id),
      revision_number INTEGER NOT NULL,
      request_content TEXT NOT NULL,
      request_images TEXT,
      requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      response_images TEXT,
      response_notes TEXT,
      completed_at TIMESTAMP,
      is_satisfied BOOLEAN,
      confirmed_at TIMESTAMP
    )
  `)

  // 验证码表
  await client.query(`
    CREATE TABLE IF NOT EXISTS sms_codes (
      id VARCHAR(36) PRIMARY KEY,
      phone VARCHAR(20) NOT NULL,
      code VARCHAR(10) NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      used BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // 创建索引
  await client.query(`CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone)`)
  await client.query(`CREATE INDEX IF NOT EXISTS idx_users_slug ON users(slug)`)
  await client.query(`CREATE INDEX IF NOT EXISTS idx_works_user_id ON works(user_id)`)
  await client.query(`CREATE INDEX IF NOT EXISTS idx_inquiries_user_id ON inquiries(user_id)`)
  await client.query(`CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status)`)
  await client.query(`CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id)`)
  await client.query(`CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)`)
  await client.query(`CREATE INDEX IF NOT EXISTS idx_orders_deadline ON orders(deadline)`)
  await client.query(`CREATE INDEX IF NOT EXISTS idx_sms_codes_phone ON sms_codes(phone)`)
  await client.query(`CREATE INDEX IF NOT EXISTS idx_reviews_order_id ON reviews(order_id)`)
  await client.query(`CREATE INDEX IF NOT EXISTS idx_reviews_token ON reviews(review_token)`)
  await client.query(`CREATE INDEX IF NOT EXISTS idx_revisions_review_id ON review_revisions(review_id)`)
}

/**
 * 执行查询 (INSERT/UPDATE/DELETE)
 */
export const runQuery = async (sql, params = []) => {
  const pool = getPool()
  const result = await pool.query(sql, params)
  return result
}

/**
 * 执行 SELECT 查询
 */
export const selectQuery = async (sql, params = []) => {
  const pool = getPool()
  const result = await pool.query(sql, params)
  return result.rows
}

/**
 * 执行 SELECT 查询返回单行
 */
export const selectOne = async (sql, params = []) => {
  const results = await selectQuery(sql, params)
  return results[0] || null
}

/**
 * 关闭连接池
 */
export const closePool = async () => {
  if (pool) {
    await pool.end()
    pool = null
  }
}

/**
 * 兼容层 - 模拟原 sql.js 的同步 API
 * 注意：这些方法是异步的，需要 await
 */
export const getDb = () => {
  return {
    run: async (sql, params) => runQuery(sql, params),
    prepare: () => { throw new Error('prepare() not supported in PostgreSQL mode') },
    export: () => { throw new Error('export() not supported in PostgreSQL mode') },
  }
}

export const saveDb = () => {
  // PostgreSQL 自动持久化，无需手动保存
}

export default {
  initDb,
  getPool,
  getDb,
  saveDb,
  runQuery,
  selectQuery,
  selectOne,
  closePool,
}
