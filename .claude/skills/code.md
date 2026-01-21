# /code - 代码编写规范与检查

Replace with description of the skill and when Claude should use it.

当开始编写代码时使用此 Skill，确保代码符合项目规范、最佳实践和安全标准。

## 使用场景

- 编写新功能代码
- 修复 Bug
- 重构现有代码
- 代码审查自查

## YueFa 项目技术栈

### 前端
- **框架**: Vue 3 (Composition API)
- **构建**: Vite 5
- **UI**: Vant 4 (Mobile UI)
- **状态**: Pinia 2
- **路由**: Vue Router 4
- **HTTP**: Axios
- **样式**: TailwindCSS 3

### 后端
- **框架**: Express 4
- **数据库**: PostgreSQL / SQLite (双引擎)
- **认证**: JWT (jsonwebtoken)
- **验证**: express-validator
- **文件**: multer
- **加密**: bcryptjs

---

## 前端编码规范

### 1. Vue 3 Composition API 规范

#### 组件结构
```vue
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { showToast, showSuccessToast, showFailToast } from 'vant'
import { getXxxList, createXxx } from '@/api/xxx'

// Props
const props = defineProps({
  id: String,
  title: {
    type: String,
    default: '默认标题'
  }
})

// Emits
const emit = defineEmits(['update', 'delete'])

// Router & Store
const router = useRouter()
const userStore = useUserStore()

// State
const loading = ref(false)
const list = ref([])
const form = ref({
  field1: '',
  field2: ''
})

// Computed
const filteredList = computed(() => {
  return list.value.filter(item => item.status === 'active')
})

// Methods
const fetchData = async () => {
  loading.value = true
  try {
    const res = await getXxxList()
    list.value = res.data
  } catch (error) {
    showFailToast(error.message || '加载失败')
  } finally {
    loading.value = false
  }
}

const handleSubmit = async () => {
  try {
    await createXxx(form.value)
    showSuccessToast('创建成功')
    emit('update')
    router.back()
  } catch (error) {
    showFailToast(error.message || '创建失败')
  }
}

// Lifecycle
onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="page-container">
    <van-nav-bar
      title="页面标题"
      left-arrow
      @click-left="router.back()"
    />

    <van-pull-refresh v-model="loading" @refresh="fetchData">
      <van-list>
        <van-cell
          v-for="item in filteredList"
          :key="item.id"
          :title="item.title"
        />
      </van-list>
    </van-pull-refresh>
  </div>
</template>

<style scoped>
.page-container {
  min-height: 100vh;
  background-color: #f7f8fa;
}
</style>
```

#### 命名规范
- **组件文件**: PascalCase (如 `OrderCard.vue`)
- **非组件文件**: kebab-case (如 `use-orders.js`)
- **组件名**: 多词命名 (避免与 HTML 标签冲突)
- **Props**: camelCase (如 `customerId`)
- **Events**: kebab-case (如 `update-order`)

### 2. API 请求封装

#### API 模块结构
```javascript
// src/api/xxx.js
import request from './request'

/**
 * 获取 XXX 列表
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码
 * @param {number} params.limit - 每页数量
 * @param {string} params.status - 状态筛选
 * @returns {Promise}
 */
export function getXxxList(params) {
  return request.get('/api/v1/xxx', { params })
}

/**
 * 获取 XXX 详情
 * @param {string} id - XXX ID
 * @returns {Promise}
 */
export function getXxxDetail(id) {
  return request.get(`/api/v1/xxx/${id}`)
}

/**
 * 创建 XXX
 * @param {Object} data - XXX 数据
 * @returns {Promise}
 */
export function createXxx(data) {
  return request.post('/api/v1/xxx', data)
}

/**
 * 更新 XXX
 * @param {string} id - XXX ID
 * @param {Object} data - 更新数据
 * @returns {Promise}
 */
export function updateXxx(id, data) {
  return request.put(`/api/v1/xxx/${id}`, data)
}

/**
 * 删除 XXX
 * @param {string} id - XXX ID
 * @returns {Promise}
 */
export function deleteXxx(id) {
  return request.delete(`/api/v1/xxx/${id}`)
}
```

#### 错误处理
```javascript
try {
  const res = await getXxxList()
  // 处理成功响应
  list.value = res.data
} catch (error) {
  // 统一错误处理
  if (error.code === 2001) {
    // Token 过期,request.js 已处理跳转登录
  } else {
    showFailToast(error.message || '操作失败')
  }
}
```

### 3. Pinia 状态管理

```javascript
// src/stores/xxx.js
import { defineStore } from 'pinia'
import { getXxxList, getXxxDetail } from '@/api/xxx'

export const useXxxStore = defineStore('xxx', {
  state: () => ({
    list: [],
    current: null,
    loading: false
  }),

  getters: {
    activeList: (state) => state.list.filter(item => item.status === 'active'),
    currentId: (state) => state.current?.id
  },

  actions: {
    async fetchList(params) {
      this.loading = true
      try {
        const res = await getXxxList(params)
        this.list = res.data
      } finally {
        this.loading = false
      }
    },

    async fetchDetail(id) {
      const res = await getXxxDetail(id)
      this.current = res.data
    },

    setCurrent(item) {
      this.current = item
    },

    reset() {
      this.list = []
      this.current = null
    }
  }
})
```

### 4. 路由配置

```javascript
// src/router/index.js
const routes = [
  // 公开路由
  {
    path: '/s/:slug',
    name: 'PublicPage',
    component: () => import('@/views/client/PublicPage.vue'),
    meta: { title: '个人主页' }
  },

  // 管理路由 (需认证)
  {
    path: '/admin',
    redirect: '/admin/profile',
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/profile',
    name: 'AdminProfile',
    component: () => import('@/views/admin/Profile.vue'),
    meta: { requiresAuth: true, title: '主页编辑' }
  },
  {
    path: '/admin/xxx',
    name: 'AdminXxx',
    component: () => import('@/views/admin/Xxx.vue'),
    meta: { requiresAuth: true, title: 'XXX管理' }
  },
  {
    path: '/admin/xxx/:id',
    name: 'AdminXxxDetail',
    component: () => import('@/views/admin/XxxDetail.vue'),
    meta: { requiresAuth: true, title: 'XXX详情' },
    props: true // 将路由参数作为 props 传递
  }
]

// 导航守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')

  if (to.meta.requiresAuth && !token) {
    // 需要认证但未登录
    next('/login')
  } else {
    // 设置页面标题
    if (to.meta.title) {
      document.title = `${to.meta.title} - 约发`
    }
    next()
  }
})
```

### 5. 前端安全规范

#### XSS 防护
```vue
<!-- 避免 v-html,使用文本插值 -->
<div>{{ userInput }}</div>

<!-- 如必须使用 v-html,先进行转义 -->
<div v-html="sanitizeHtml(content)"></div>
```

#### 敏感数据处理
```javascript
// 不要在前端存储敏感信息
// ❌ 错误
localStorage.setItem('password', password)

// ✅ 正确: 只存储 token
localStorage.setItem('token', token)

// 不要在 URL 中暴露敏感参数
// ❌ 错误
router.push(`/profile?phone=${phone}`)

// ✅ 正确: 使用 ID 或 slug
router.push(`/profile/${userId}`)
```

---

## 后端编码规范

### 1. Express 路由设计

#### 路由文件结构
```javascript
// src/routes/xxx.js
import express from 'express'
import { body, query, param, validationResult } from 'express-validator'
import { XxxModel } from '../models/Xxx.js'
import { auth, optionalAuth } from '../middleware/auth.js'
import { AppError } from '../middleware/errorHandler.js'

const router = express.Router()

// 获取列表
router.get('/',
  auth, // 或 optionalAuth
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['active', 'inactive']),
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw new AppError(1001, '参数验证失败', 400, errors.array())
      }

      const { page = 1, limit = 20, status } = req.query

      const list = XxxModel.findByUserId(req.user.userId, {
        page: parseInt(page),
        limit: parseInt(limit),
        status
      })

      const total = XxxModel.countByUserId(req.user.userId, status)

      res.json({
        code: 0,
        data: {
          list,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total
          }
        }
      })
    } catch (error) {
      next(error)
    }
  }
)

// 获取详情
router.get('/:id',
  auth,
  param('id').notEmpty(),
  async (req, res, next) => {
    try {
      const { id } = req.params
      const item = XxxModel.findById(id)

      if (!item) {
        throw new AppError(3001, 'XXX不存在', 404)
      }

      // 权限检查
      if (item.user_id !== req.user.userId) {
        throw new AppError(2002, '无权限查看此资源', 403)
      }

      res.json({ code: 0, data: item })
    } catch (error) {
      next(error)
    }
  }
)

// 创建
router.post('/',
  auth,
  body('field1').notEmpty().withMessage('字段1必填'),
  body('field2').optional().isEmail().withMessage('字段2格式错误'),
  body('field3').optional().isInt({ min: 0 }).withMessage('字段3必须是正整数'),
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw new AppError(1001, '数据验证失败', 400, errors.array())
      }

      const data = XxxModel.create({
        ...req.body,
        user_id: req.user.userId
      })

      res.json({ code: 0, data })
    } catch (error) {
      next(error)
    }
  }
)

// 更新
router.put('/:id',
  auth,
  param('id').notEmpty(),
  body('field1').optional(),
  body('field2').optional().isEmail(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw new AppError(1001, '数据验证失败', 400, errors.array())
      }

      const { id } = req.params
      const item = XxxModel.findById(id)

      if (!item) {
        throw new AppError(3001, 'XXX不存在', 404)
      }

      // 权限检查
      if (item.user_id !== req.user.userId) {
        throw new AppError(2002, '无权限修改此资源', 403)
      }

      const updated = XxxModel.update(id, req.body)
      res.json({ code: 0, data: updated })
    } catch (error) {
      next(error)
    }
  }
)

// 删除
router.delete('/:id',
  auth,
  param('id').notEmpty(),
  async (req, res, next) => {
    try {
      const { id } = req.params
      const item = XxxModel.findById(id)

      if (!item) {
        throw new AppError(3001, 'XXX不存在', 404)
      }

      // 权限检查
      if (item.user_id !== req.user.userId) {
        throw new AppError(2002, '无权限删除此资源', 403)
      }

      XxxModel.delete(id)
      res.json({ code: 0, message: '删除成功' })
    } catch (error) {
      next(error)
    }
  }
)

export default router
```

#### 路由注册
```javascript
// src/app.js
import xxxRoutes from './routes/xxx.js'

app.use('/api/v1/xxx', xxxRoutes)
```

### 2. 数据模型规范

```javascript
// src/models/Xxx.js
import { getDb, usePostgres, convertPlaceholders } from './index.js'
import { v4 as uuidv4 } from 'uuid'

export class XxxModel {
  /**
   * 创建 XXX
   * @param {Object} data - XXX 数据
   * @returns {Object} 创建的 XXX
   */
  static create(data) {
    const db = getDb()
    const id = uuidv4()
    const now = new Date().toISOString()

    const sql = convertPlaceholders(
      `INSERT INTO xxx (id, user_id, field1, field2, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, data.user_id, data.field1, data.field2, now, now]
    )

    if (usePostgres()) {
      const result = db.query(sql.query + ' RETURNING *', sql.params)
      return result.rows[0]
    } else {
      db.run(sql.query, sql.params)
      return this.findById(id)
    }
  }

  /**
   * 根据 ID 查询
   * @param {string} id - XXX ID
   * @returns {Object|null}
   */
  static findById(id) {
    const db = getDb()
    const sql = convertPlaceholders('SELECT * FROM xxx WHERE id = ?', [id])

    if (usePostgres()) {
      const result = db.query(sql.query, sql.params)
      return result.rows[0] || null
    } else {
      const result = db.exec(sql.query, sql.params)
      if (!result[0] || !result[0].values[0]) return null

      const columns = result[0].columns
      const values = result[0].values[0]
      return columns.reduce((obj, col, i) => {
        obj[col] = values[i]
        return obj
      }, {})
    }
  }

  /**
   * 根据用户 ID 查询列表
   * @param {string} userId - 用户 ID
   * @param {Object} options - 查询选项
   * @returns {Array}
   */
  static findByUserId(userId, options = {}) {
    const { page = 1, limit = 20, status } = options
    const offset = (page - 1) * limit

    const db = getDb()
    let query = 'SELECT * FROM xxx WHERE user_id = ?'
    const params = [userId]

    if (status) {
      query += ' AND status = ?'
      params.push(status)
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    params.push(limit, offset)

    const sql = convertPlaceholders(query, params)

    if (usePostgres()) {
      const result = db.query(sql.query, sql.params)
      return result.rows
    } else {
      const result = db.exec(sql.query, sql.params)
      if (!result[0]) return []

      const columns = result[0].columns
      return result[0].values.map(values =>
        columns.reduce((obj, col, i) => {
          obj[col] = values[i]
          return obj
        }, {})
      )
    }
  }

  /**
   * 更新 XXX
   * @param {string} id - XXX ID
   * @param {Object} data - 更新数据
   * @returns {Object}
   */
  static update(id, data) {
    const db = getDb()
    const now = new Date().toISOString()

    const fields = []
    const params = []

    if (data.field1 !== undefined) {
      fields.push('field1 = ?')
      params.push(data.field1)
    }
    if (data.field2 !== undefined) {
      fields.push('field2 = ?')
      params.push(data.field2)
    }

    fields.push('updated_at = ?')
    params.push(now)
    params.push(id)

    const sql = convertPlaceholders(
      `UPDATE xxx SET ${fields.join(', ')} WHERE id = ?`,
      params
    )

    db.run(sql.query, sql.params)
    return this.findById(id)
  }

  /**
   * 删除 XXX
   * @param {string} id - XXX ID
   */
  static delete(id) {
    const db = getDb()
    const sql = convertPlaceholders('DELETE FROM xxx WHERE id = ?', [id])
    db.run(sql.query, sql.params)
  }

  /**
   * 统计数量
   * @param {string} userId - 用户 ID
   * @param {string} status - 状态筛选
   * @returns {number}
   */
  static countByUserId(userId, status) {
    const db = getDb()
    let query = 'SELECT COUNT(*) as count FROM xxx WHERE user_id = ?'
    const params = [userId]

    if (status) {
      query += ' AND status = ?'
      params.push(status)
    }

    const sql = convertPlaceholders(query, params)

    if (usePostgres()) {
      const result = db.query(sql.query, sql.params)
      return parseInt(result.rows[0].count)
    } else {
      const result = db.exec(sql.query, sql.params)
      return result[0]?.values[0][0] || 0
    }
  }
}
```

### 3. 数据验证规范

```javascript
// 使用 express-validator
import { body, query, param, validationResult } from 'express-validator'

// 常用验证规则
body('email').isEmail().normalizeEmail()
body('phone').matches(/^1[3-9]\d{9}$/).withMessage('手机号格式错误')
body('slug').matches(/^[a-z0-9-]+$/).isLength({ min: 3, max: 20 })
body('price').isFloat({ min: 0 }).withMessage('价格必须是正数')
body('deadline').isISO8601().withMessage('日期格式错误')
body('status').isIn(['active', 'inactive'])
body('tags').optional().isArray()
body('images').optional().isArray()

// 自定义验证
body('field').custom((value, { req }) => {
  if (value === 'invalid') {
    throw new Error('不允许的值')
  }
  return true
})

// 检查验证结果
const errors = validationResult(req)
if (!errors.isEmpty()) {
  throw new AppError(1001, '数据验证失败', 400, errors.array())
}
```

### 4. 后端安全规范

#### SQL 注入防护
```javascript
// ✅ 正确: 使用参数化查询
const sql = convertPlaceholders(
  'SELECT * FROM users WHERE phone = ?',
  [phone]
)

// ❌ 错误: 字符串拼接
const sql = `SELECT * FROM users WHERE phone = '${phone}'`
```

#### 权限控制
```javascript
// 每个需要权限的操作都要检查
const item = XxxModel.findById(id)
if (item.user_id !== req.user.userId) {
  throw new AppError(2002, '无权限操作此资源', 403)
}
```

#### 敏感数据处理
```javascript
// 密码加密
import bcrypt from 'bcryptjs'
const hashedPassword = await bcrypt.hash(password, 10)

// 不要返回敏感字段
const user = UserModel.findById(id)
delete user.password
delete user.sms_code
res.json({ code: 0, data: user })
```

---

## 通用编码规范

### 1. ES Module 规范

```javascript
// ✅ 正确: 使用 ES Module
import express from 'express'
import { v4 as uuidv4 } from 'uuid'

export function myFunction() {}
export default router

// ❌ 错误: CommonJS (项目使用 ES Module)
const express = require('express')
module.exports = router
```

### 2. 错误处理

```javascript
// 统一使用 try-catch 和 AppError
try {
  const data = await someAsyncOperation()
  res.json({ code: 0, data })
} catch (error) {
  next(error) // 传递给错误处理中间件
}

// 业务错误使用 AppError
if (!item) {
  throw new AppError(3001, '资源不存在', 404)
}

// 权限错误
if (item.user_id !== req.user.userId) {
  throw new AppError(2002, '无权限', 403)
}

// 验证错误
if (!errors.isEmpty()) {
  throw new AppError(1001, '验证失败', 400, errors.array())
}
```

### 3. 注释规范

```javascript
/**
 * 函数说明 (复杂业务逻辑需要详细注释)
 * @param {string} id - 参数说明
 * @param {Object} options - 选项说明
 * @param {number} options.page - 页码
 * @returns {Promise<Object>} 返回值说明
 */
async function complexFunction(id, options) {
  // 1. 验证参数
  if (!id) throw new Error('ID 必填')

  // 2. 查询数据
  const data = await fetchData(id)

  // 3. 业务处理 (复杂逻辑需要注释)
  // 根据订单状态计算定金和尾款
  // 定金 = 总价 * 20%, 尾款 = 总价 * 80%
  const deposit = data.price * 0.2
  const balance = data.price * 0.8

  return { ...data, deposit, balance }
}
```

---

## 代码检查清单

### 前端检查
- [ ] 使用 Vue 3 Composition API (`<script setup>`)
- [ ] API 请求有错误处理
- [ ] 使用 Vant 组件库 (不自己实现基础组件)
- [ ] 路由配置正确 (路径、name、meta)
- [ ] 需要认证的页面有路由守卫
- [ ] 敏感数据不存储在 localStorage
- [ ] 避免 XSS (使用文本插值,不用 v-html)
- [ ] 代码格式化 (运行 `pnpm lint`)

### 后端检查
- [ ] 使用 express-validator 验证数据
- [ ] 权限检查完整 (user_id 对比)
- [ ] 使用参数化查询 (防 SQL 注入)
- [ ] 错误使用 AppError 抛出
- [ ] 使用 try-catch 处理异步错误
- [ ] 密码等敏感数据加密
- [ ] 响应不包含敏感字段
- [ ] 数据库操作使用 Model 层
- [ ] 兼容 PostgreSQL 和 SQLite

### 通用检查
- [ ] ES Module 导入/导出
- [ ] 变量命名语义化
- [ ] 复杂逻辑有注释
- [ ] 没有 console.log (除了必要日志)
- [ ] 没有 TODO/FIXME 未处理
- [ ] 代码格式统一

---

## 常见错误

### 前端常见错误
1. 忘记处理 API 错误
2. 路由守卫未生效
3. Vant 组件未自动导入
4. 状态未响应式 (忘记用 ref/reactive)

### 后端常见错误
1. SQL 注入风险 (字符串拼接)
2. 忘记权限检查
3. 未捕获异步错误
4. 数据库占位符未转换 (PostgreSQL vs SQLite)
5. 敏感数据未加密或过滤

---

## 相关文档

- [前端编码规范详细文档](../../YueFa-docs/standards/frontend.md)
- [后端编码规范详细文档](../../YueFa-docs/standards/backend.md)
- [功能开发流程](/feature)
- [测试编写规范](/test)
