/**
 * 数据库抽象层
 * 根据环境变量自动选择 PostgreSQL 或 SQLite (sql.js)
 *
 * 生产环境使用 PostgreSQL (DATABASE_URL)
 * 开发/测试环境可继续使用 SQLite (DB_PATH)
 */

// 判断使用哪种数据库
const usePostgres = () => {
  return !!process.env.DATABASE_URL || process.env.DB_TYPE === 'postgres'
}

let dbModule = null

/**
 * 初始化数据库
 */
export const initDb = async () => {
  if (usePostgres()) {
    const postgres = await import('../db/postgres.js')
    dbModule = postgres
    return postgres.initDb()
  } else {
    const sqlite = await import('../db/sqlite.js')
    dbModule = sqlite
    return sqlite.initDb()
  }
}

/**
 * 获取数据库实例
 */
export const getDb = () => {
  if (!dbModule) {
    throw new Error('Database not initialized. Call initDb() first.')
  }
  return dbModule.getDb()
}

/**
 * 保存数据库 (仅 SQLite 需要)
 */
export const saveDb = () => {
  if (dbModule && dbModule.saveDb) {
    dbModule.saveDb()
  }
}

/**
 * 执行查询 (INSERT/UPDATE/DELETE)
 * 注意：同步接口，兼容 SQLite 和 PostgreSQL
 */
export const runQuery = (sql, params = []) => {
  if (!dbModule) {
    throw new Error('Database not initialized. Call initDb() first.')
  }

  // 转换 SQLite 占位符 (?) 为 PostgreSQL 占位符 ($1, $2...)
  if (usePostgres()) {
    sql = convertPlaceholders(sql)
  }

  return dbModule.runQuery(sql, params)
}

/**
 * 执行 SELECT 查询
 * 注意：同步接口，兼容 SQLite 和 PostgreSQL
 */
export const selectQuery = (sql, params = []) => {
  if (!dbModule) {
    throw new Error('Database not initialized. Call initDb() first.')
  }

  if (usePostgres()) {
    sql = convertPlaceholders(sql)
  }

  return dbModule.selectQuery(sql, params)
}

/**
 * 执行 SELECT 查询返回单行
 * 注意：同步接口，兼容 SQLite 和 PostgreSQL
 */
export const selectOne = (sql, params = []) => {
  if (!dbModule) {
    throw new Error('Database not initialized. Call initDb() first.')
  }

  if (usePostgres()) {
    sql = convertPlaceholders(sql)
  }

  return dbModule.selectOne(sql, params)
}

/**
 * 关闭数据库连接
 */
export const closeDb = async () => {
  if (dbModule && dbModule.closePool) {
    await dbModule.closePool()
  }
  dbModule = null
}

/**
 * 将 SQLite 的 ? 占位符转换为 PostgreSQL 的 $1, $2...
 */
const convertPlaceholders = (sql) => {
  let index = 0
  return sql.replace(/\?/g, () => `$${++index}`)
}

/**
 * 获取数据库类型
 */
export const getDbType = () => {
  return usePostgres() ? 'postgres' : 'sqlite'
}

export default {
  initDb,
  getDb,
  saveDb,
  runQuery,
  selectQuery,
  selectOne,
  closeDb,
  getDbType
}
