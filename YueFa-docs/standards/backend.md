# 后端编码规范

本文档定义了 YueFa 项目后端代码的编写规范和最佳实践。

## 快速参考

更详细的规范请查看 [/code Skill](../../.claude/skills/code.md)。

## 技术栈

- **框架**: Express 4
- **数据库**: PostgreSQL (生产) / SQLite (开发)
- **认证**: JWT (jsonwebtoken)
- **验证**: express-validator
- **加密**: bcryptjs
- **文件上传**: multer
- **测试**: Vitest + Supertest

## 核心规范

### 1. 路由设计规范

#### RESTful API 规范
```
GET    /api/v1/orders          # 获取列表
GET    /api/v1/orders/:id      # 获取详情
POST   /api/v1/orders          # 创建
PUT    /api/v1/orders/:id      # 更新
DELETE /api/v1/orders/:id      # 删除
```

#### 路由文件结构
```javascript
// src/routes/orders.js
import express from 'express'
import { body, query, param } from 'express-validator'
import { OrderModel } from '../models/Order.js'
import { auth } from '../middleware/auth.js'
import { AppError } from '../middleware/errorHandler.js'

const router = express.Router()

router.get('/', auth, async (req, res, next) => {
  try {
    // 实现逻辑
  } catch (error) {
    next(error)
  }
})

export default router
```

### 2. 数据模型规范

#### 双数据库支持
```javascript
// src/models/Order.js
import { getDb, usePostgres, convertPlaceholders } from './index.js'

export class OrderModel {
  static create(data) {
    const db = getDb()
    const sql = convertPlaceholders(
      'INSERT INTO orders (field1, field2) VALUES (?, ?)',
      [data.field1, data.field2]
    )

    if (usePostgres()) {
      return db.query(sql.query + ' RETURNING *', sql.params).rows[0]
    } else {
      db.run(sql.query, sql.params)
      return this.findById(result.lastID)
    }
  }
}
```

### 3. 数据验证规范

```javascript
router.post('/',
  auth,
  body('field1').notEmpty().withMessage('字段1必填'),
  body('field2').optional().isEmail().withMessage('邮箱格式错误'),
  async (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      throw new AppError(1001, '数据验证失败', 400, errors.array())
    }
    // ...
  }
)
```

### 4. 错误处理规范

#### 统一错误格式
```javascript
throw new AppError(code, message, statusCode, errors)

// 示例
throw new AppError(3001, '订单不存在', 404)
throw new AppError(2002, '无权限', 403)
throw new AppError(1001, '验证失败', 400, validationErrors)
```

#### 错误码分类
- `1xxx`: 验证错误 (400)
- `2xxx`: 认证/权限错误 (401/403)
- `3xxx`: 业务错误 (400/404)
- `5xxx`: 服务器错误 (500)

### 5. 权限控制规范

#### 中间件使用
```javascript
import { auth, optionalAuth } from '../middleware/auth.js'

// 必须认证
router.get('/', auth, async (req, res) => {
  // req.user.userId 可用
})

// 可选认证
router.get('/public', optionalAuth, async (req, res) => {
  // req.user 可能为 null
})
```

#### 资源权限检查
```javascript
const order = OrderModel.findById(id)

if (!order) {
  throw new AppError(3001, '订单不存在', 404)
}

// 检查是否是资源 owner
if (order.user_id !== req.user.userId) {
  throw new AppError(2002, '无权限', 403)
}
```

### 6. 安全规范

#### SQL 注入防护
```javascript
// ✅ 使用参数化查询
const sql = convertPlaceholders(
  'SELECT * FROM users WHERE phone = ?',
  [phone]
)

// ❌ 字符串拼接
const sql = `SELECT * FROM users WHERE phone = '${phone}'`
```

#### 密码加密
```javascript
import bcrypt from 'bcryptjs'

// 加密
const hashedPassword = await bcrypt.hash(password, 10)

// 验证
const isValid = await bcrypt.compare(password, hashedPassword)
```

#### 敏感数据过滤
```javascript
const user = UserModel.findById(id)

// 删除敏感字段
delete user.password
delete user.sms_code

res.json({ code: 0, data: user })
```

## 响应格式规范

### 成功响应
```json
{
  "code": 0,
  "data": {...}
}
```

### 错误响应
```json
{
  "code": 3001,
  "message": "订单不存在",
  "statusCode": 404,
  "errors": []
}
```

## 代码质量要求

### 必须遵守
- [ ] 所有路由有错误处理 (try-catch)
- [ ] 所有输入有数据验证
- [ ] 所有操作有权限检查
- [ ] 使用参数化查询 (防 SQL 注入)
- [ ] 敏感数据已加密/过滤

### 建议遵守
- [ ] 复杂业务逻辑有注释
- [ ] 公共函数有 JSDoc
- [ ] 函数不超过 50 行
- [ ] 单个路由文件不超过 500 行

## 工具配置

### 数据库初始化
```bash
pnpm --filter @yuefa/server db:init
```

### 运行测试
```bash
pnpm --filter @yuefa/server test
```

## 相关资源

- [/code Skill](../../.claude/skills/code.md) - 详细的编码规范
- [/feature Skill](../../.claude/skills/feature.md) - 功能开发流程
- [/test Skill](../../.claude/skills/test.md) - 测试编写规范
- [Express 文档](https://expressjs.com/)
- [express-validator 文档](https://express-validator.github.io/)
