# /feature - 新功能开发规划流程

Replace with description of the skill and when Claude should use it.

当用户请求开发新功能时，使用此 Skill 进行系统化的需求分析和技术设计。适用于所有需要架构设计和技术方案的新功能开发。

## 使用场景

- 用户提出新功能需求
- 需要添加新的API端点
- 需要设计新的数据库表结构
- 需要开发新的前端页面或组件
- 功能涉及前后端协作

## 执行流程

### 1. 需求澄清 (Requirements Clarification)

#### 业务需求分析
与用户确认以下关键信息:

**功能目标**:
- 这个功能要解决什么问题？
- 目标用户是谁？(师傅端/客户端/管理端)
- 核心业务流程是什么？

**功能范围**:
- MVP 最小可行功能包含什么？
- 哪些是后续迭代的功能？
- 有哪些边界情况需要处理？

**业务规则**:
- 数据验证规则
- 业务约束条件
- 权限控制要求

**用户体验**:
- 用户操作流程
- 错误处理和提示
- 成功/失败反馈

#### 技术约束
- 性能要求 (响应时间、并发)
- 兼容性要求 (浏览器、设备)
- 第三方服务依赖 (OSS、短信等)

---

### 2. 技术方案设计 (Technical Design)

#### 前端设计 (Vue 3 + Vant)

**页面/组件设计**:
```
路由设计:
- 路径: /admin/xxx 或 /client/xxx
- 权限: 需要认证/公开访问
- 父路由: 挂载位置

组件层次:
- 页面组件 (views/)
- 复用组件 (components/)
- 状态管理 (stores/)
```

**API 调用设计**:
```javascript
// src/api/xxx.js
import request from './request'

// 获取列表
export function getXxxList(params) {
  return request.get('/api/v1/xxx', { params })
}

// 创建
export function createXxx(data) {
  return request.post('/api/v1/xxx', data)
}

// 更新
export function updateXxx(id, data) {
  return request.put(`/api/v1/xxx/${id}`, data)
}

// 删除
export function deleteXxx(id) {
  return request.delete(`/api/v1/xxx/${id}`)
}
```

**状态管理设计** (如需要):
```javascript
// src/stores/xxx.js
import { defineStore } from 'pinia'

export const useXxxStore = defineStore('xxx', {
  state: () => ({
    list: [],
    current: null,
  }),
  actions: {
    async fetchList() {},
    async create(data) {},
    async update(id, data) {},
  }
})
```

**UI 组件选择** (基于 Vant):
- 表单: van-form, van-field, van-button
- 列表: van-list, van-pull-refresh
- 弹窗: van-popup, van-dialog
- 导航: van-nav-bar, van-tab, van-tabbar

#### 后端设计 (Express + PostgreSQL/SQLite)

**API 端点设计** (RESTful):
```
GET    /api/v1/xxx          # 获取列表
GET    /api/v1/xxx/:id      # 获取详情
POST   /api/v1/xxx          # 创建
PUT    /api/v1/xxx/:id      # 更新
DELETE /api/v1/xxx/:id      # 删除
```

**路由文件结构**:
```javascript
// src/routes/xxx.js
import express from 'express'
import { body, query, validationResult } from 'express-validator'
import { XxxModel } from '../models/Xxx.js'
import { auth, optionalAuth } from '../middleware/auth.js'
import { AppError } from '../middleware/errorHandler.js'

const router = express.Router()

// 获取列表
router.get('/',
  auth, // 或 optionalAuth
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  async (req, res, next) => {
    try {
      // 实现逻辑
      const data = XxxModel.findAll(req.query)
      res.json({ code: 0, data })
    } catch (error) {
      next(error)
    }
  }
)

// 创建
router.post('/',
  auth,
  body('field1').notEmpty().withMessage('字段1必填'),
  body('field2').optional().isEmail(),
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

export default router
```

**数据模型设计**:
```javascript
// src/models/Xxx.js
import { getDb, usePostgres, convertPlaceholders } from './index.js'

export class XxxModel {
  // 创建
  static create(data) {
    const db = getDb()
    const sql = convertPlaceholders(
      'INSERT INTO xxx (field1, field2, created_at) VALUES (?, ?, ?)',
      [data.field1, data.field2, new Date().toISOString()]
    )

    if (usePostgres()) {
      const result = db.query(sql.query + ' RETURNING *', sql.params)
      return result.rows[0]
    } else {
      const result = db.run(sql.query, sql.params)
      return this.findById(result.lastID)
    }
  }

  // 查询
  static findAll(options = {}) {
    const { page = 1, limit = 20 } = options
    const offset = (page - 1) * limit

    const db = getDb()
    const sql = convertPlaceholders(
      'SELECT * FROM xxx ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [limit, offset]
    )

    if (usePostgres()) {
      const result = db.query(sql.query, sql.params)
      return result.rows
    } else {
      return db.exec(sql.query, sql.params)[0]?.values.map(row => ({
        // 映射字段
      })) || []
    }
  }

  // 更新
  static update(id, data) {
    const db = getDb()
    const sql = convertPlaceholders(
      'UPDATE xxx SET field1 = ?, updated_at = ? WHERE id = ?',
      [data.field1, new Date().toISOString(), id]
    )

    db.run(sql.query, sql.params)
    return this.findById(id)
  }

  // 删除
  static delete(id) {
    const db = getDb()
    const sql = convertPlaceholders('DELETE FROM xxx WHERE id = ?', [id])
    db.run(sql.query, sql.params)
  }
}
```

#### 数据库设计

**表结构设计**:
```sql
CREATE TABLE xxx (
  id INTEGER PRIMARY KEY AUTOINCREMENT, -- SQLite
  -- id SERIAL PRIMARY KEY,              -- PostgreSQL
  user_id TEXT NOT NULL,                 -- 关联用户
  field1 TEXT NOT NULL,                  -- 字段1
  field2 TEXT,                           -- 字段2 (可选)
  status TEXT DEFAULT 'active',          -- 状态
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_xxx_user_id ON xxx(user_id);
CREATE INDEX idx_xxx_status ON xxx(status);
```

**数据库迁移脚本**:
```javascript
// src/db/migrations/xxx_add_xxx_table.js
export const up = (db, usePostgres) => {
  const sql = usePostgres
    ? `CREATE TABLE xxx (...)`  // PostgreSQL 语法
    : `CREATE TABLE xxx (...)`  // SQLite 语法

  db.run(sql)
}

export const down = (db) => {
  db.run('DROP TABLE IF EXISTS xxx')
}
```

---

### 3. 接口设计 (API Contract)

#### 请求/响应格式

**统一响应格式**:
```json
{
  "code": 0,           // 0=成功, 非0=错误码
  "message": "成功",    // 消息
  "data": {...}        // 数据
}
```

**错误响应格式**:
```json
{
  "code": 3001,
  "message": "资源不存在",
  "statusCode": 404,
  "errors": []         // 验证错误详情
}
```

#### API 文档示例

**创建 XXX**
```
POST /api/v1/xxx
Content-Type: application/json
Authorization: Bearer {token}

Request Body:
{
  "field1": "value1",
  "field2": "value2"
}

Response 200:
{
  "code": 0,
  "data": {
    "id": "uuid",
    "field1": "value1",
    "field2": "value2",
    "created_at": "2026-01-21T10:00:00Z"
  }
}

Response 400:
{
  "code": 1001,
  "message": "数据验证失败",
  "errors": [
    {"field": "field1", "message": "字段1必填"}
  ]
}

Response 401:
{
  "code": 2001,
  "message": "登录已过期"
}
```

---

### 4. 影响范围分析 (Impact Analysis)

#### 代码影响
- **新增文件**:
  - 前端: `src/views/xxx.vue`, `src/api/xxx.js`
  - 后端: `src/routes/xxx.js`, `src/models/Xxx.js`
  - 测试: `src/tests/xxx.test.js`, `e2e/xxx.spec.js`

- **修改文件**:
  - 路由配置: `src/router/index.js`
  - 后端路由注册: `src/app.js`
  - 数据库初始化: `src/scripts/initDb.js`

#### 依赖影响
- 是否需要新增 npm 包？
- 是否依赖第三方服务？
- 是否需要环境变量配置？

#### 兼容性影响
- 是否影响现有 API？
- 是否需要数据迁移？
- 是否向后兼容？

---

### 5. 任务分解 (Task Breakdown)

#### 后端开发任务
- [ ] 创建数据模型 (`src/models/Xxx.js`)
- [ ] 创建数据库迁移脚本
- [ ] 创建路由文件 (`src/routes/xxx.js`)
- [ ] 注册路由到 app.js
- [ ] 编写单元测试 (`src/tests/xxx.test.js`)
- [ ] API 测试验证

#### 前端开发任务
- [ ] 创建 API 封装 (`src/api/xxx.js`)
- [ ] 创建页面组件 (`src/views/xxx.vue`)
- [ ] 配置路由 (`src/router/index.js`)
- [ ] 创建状态管理 (如需要)
- [ ] 编写单元测试 (`src/components/xxx.spec.js`)
- [ ] 编写 E2E 测试 (`e2e/xxx.spec.js`)

#### 集成测试任务
- [ ] 前后端联调
- [ ] E2E 完整流程测试
- [ ] 错误场景测试
- [ ] 性能测试 (如需要)

---

### 6. 输出功能设计文档

将以上分析和设计输出为功能设计文档:

**文档路径**: `YueFa-docs/features/[功能名]-design.md`

**文档模板**:
```markdown
# [功能名] 功能设计文档

## 1. 功能概述
- 功能目标
- 目标用户
- 核心业务流程

## 2. 需求分析
- 业务需求
- 技术约束
- 边界情况

## 3. 技术方案
### 3.1 前端设计
- 页面/组件结构
- 路由设计
- 状态管理
- UI 组件

### 3.2 后端设计
- API 端点
- 数据模型
- 业务逻辑

### 3.3 数据库设计
- 表结构
- 索引设计
- 数据迁移

## 4. 接口设计
- API 文档
- 请求/响应示例
- 错误码定义

## 5. 影响范围
- 代码影响
- 依赖影响
- 兼容性影响

## 6. 任务分解
- 后端任务列表
- 前端任务列表
- 测试任务列表

## 7. 测试计划
- 单元测试
- 集成测试
- E2E 测试

## 8. 验收标准
- 功能完整性
- 性能指标
- 用户体验
```

---

## 检查清单 (Checklist)

完成功能设计后，确认以下检查项:

### 需求澄清
- [x] 功能目标明确
- [x] 用户角色确定
- [x] 核心流程清晰
- [x] 业务规则完整
- [x] 边界情况考虑

### 技术方案
- [x] 前端组件设计完整
- [x] 后端 API 设计符合 RESTful
- [x] 数据库表结构合理
- [x] 数据验证规则明确
- [x] 错误处理方案完整

### 接口设计
- [x] API 端点定义清晰
- [x] 请求/响应格式统一
- [x] 错误码定义完整
- [x] 权限控制明确

### 影响分析
- [x] 新增文件列表完整
- [x] 修改文件列表完整
- [x] 依赖关系明确
- [x] 兼容性考虑充分

### 任务分解
- [x] 任务颗粒度合理
- [x] 前后端任务明确
- [x] 测试任务包含
- [x] 任务优先级明确

---

## 常见问题 (FAQ)

### Q1: 什么时候需要使用 `/feature`？
A: 所有非临时的功能开发都应该使用 `/feature` 进行设计。包括新页面、新 API、新数据表等。小的 Bug 修复可以直接使用 `/fix`。

### Q2: 设计文档需要多详细？
A: 标准版即可。包含核心的技术方案、API 设计、数据库设计。不需要写伪代码，但需要明确接口和数据结构。

### Q3: 前后端需要同时设计吗？
A: 是的。前后端需要一起设计，确保接口契约明确。可以先设计 API 接口，再分别设计前后端实现。

### Q4: 数据库设计需要考虑 PostgreSQL 和 SQLite 吗？
A: 是的。本项目支持双数据库引擎，需要确保 SQL 语法兼容。使用数据库抽象层的 `convertPlaceholders` 来处理占位符差异。

### Q5: 如何处理第三方服务依赖？
A: 在技术约束中明确第三方服务（如 OSS、短信），并在环境变量配置中添加必要的 key。测试时使用 Mock。

---

## 相关文档

- [前端编码规范](../../YueFa-docs/standards/frontend.md)
- [后端编码规范](../../YueFa-docs/standards/backend.md)
- [测试编写规范](../../YueFa-docs/standards/testing.md)
- [开发流程总览](../../YueFa-docs/workflows/development.md)
- [YueFa 系统架构](../../YueFa-docs/约发MVP系统架构与开发计划.md)

---

## 下一步

功能设计完成后:
1. 使用 `/code` 开始编码
2. 使用 `/test` 编写测试
3. 使用 `/commit` 提交代码
4. 使用 `/ci-check` 进行 CI 预检查
