# /review - 代码审查流程

Replace with description of the skill and when Claude should use it.

当审查 Pull Request 或代码变更时使用此 Skill，确保代码质量、安全性和可维护性。

## 使用场景

- 审查他人的 Pull Request
- 自我审查(提交前检查)
- 代码合并前的最后检查

---

## 代码审查维度

### 1. 功能正确性

#### 1.1 需求实现
- [ ] 实现符合原始需求
- [ ] 所有验收标准都满足
- [ ] 边界情况都处理了
- [ ] 错误场景都考虑了

#### 1.2 业务逻辑
- [ ] 业务规则正确实现
- [ ] 状态流转逻辑正确
- [ ] 计算公式准确
- [ ] 数据关系正确

#### 1.3 边界情况
```javascript
// 检查这些常见边界情况:
// - 空值 (null, undefined, '')
// - 空数组 []
// - 数字边界 (0, 负数, 很大的数)
// - 字符串边界 (空字符串, 很长的字符串)
// - 时间边界 (过去, 未来, 边界日期)
```

---

### 2. 代码质量

#### 2.1 可读性
- [ ] 变量命名清晰语义化
- [ ] 函数命名描述准确
- [ ] 代码结构清晰
- [ ] 缩进和格式统一

**命名规范检查**:
```javascript
// ✅ 好的命名
const customerName = '张三'
const totalPrice = 500
function calculateDeposit(price) {}

// ❌ 不好的命名
const cn = '张三'  // 过于简略
const tp = 500  // 缩写不清楚
function calc(p) {}  // 不知道计算什么
```

#### 2.2 代码复杂度
- [ ] 函数不超过 50 行 (建议)
- [ ] 嵌套层级不超过 3 层
- [ ] 圈复杂度合理
- [ ] 没有重复代码

**复杂度检查**:
```javascript
// ❌ 过于复杂
function processOrder(order) {
  if (order.status === 'pending') {
    if (order.deposit_paid) {
      if (order.wig_received) {
        if (order.deadline < new Date()) {
          // 嵌套太深
        }
      }
    }
  }
}

// ✅ 改进: 早返回
function processOrder(order) {
  if (order.status !== 'pending') return
  if (!order.deposit_paid) return
  if (!order.wig_received) return
  if (order.deadline >= new Date()) return

  // 主要逻辑
}
```

#### 2.3 注释
- [ ] 复杂逻辑有注释说明
- [ ] 业务规则有注释
- [ ] 公共函数有 JSDoc
- [ ] 没有无用的注释

**注释检查**:
```javascript
// ✅ 有价值的注释
// 根据订单总价计算定金和尾款
// 定金 = 总价 * 20%, 尾款 = 总价 * 80%
const deposit = price * 0.2
const balance = price * 0.8

// ❌ 无意义的注释
// 设置 name 变量
const name = 'test'  // 注释没有提供额外信息

// ❌ 过时的注释
// TODO: 需要添加验证 (但代码已经有验证了)
```

#### 2.4 代码风格
- [ ] 符合 ESLint 规则
- [ ] 使用项目统一的代码风格
- [ ] 正确使用 ES Module
- [ ] 正确使用 async/await

---

### 3. 架构设计

#### 3.1 符合现有架构
**前端**:
- [ ] Vue 3 Composition API 规范
- [ ] 组件拆分合理
- [ ] API 调用封装在 api/ 目录
- [ ] 状态管理使用 Pinia (如需要)
- [ ] 路由配置正确

**后端**:
- [ ] Express 路由分层清晰
- [ ] 数据模型在 models/ 目录
- [ ] 业务逻辑在 Model 层
- [ ] 路由层只做参数验证和调用
- [ ] 统一使用 AppError

#### 3.2 模块划分
- [ ] 职责单一
- [ ] 耦合度低
- [ ] 复用性好
- [ ] 扩展性好

#### 3.3 API 设计
- [ ] RESTful 规范
- [ ] 端点命名清晰
- [ ] 请求/响应格式统一
- [ ] 错误码定义合理

**API 设计检查**:
```javascript
// ✅ 好的 API 设计
GET    /api/v1/orders           // 获取列表
GET    /api/v1/orders/:id       // 获取详情
POST   /api/v1/orders           // 创建
PUT    /api/v1/orders/:id       // 更新
DELETE /api/v1/orders/:id       // 删除

// ❌ 不好的 API 设计
GET    /api/v1/getOrders        // 不要在 URL 中使用动词
POST   /api/v1/order/create     // 多余的 /create
```

---

### 4. 测试覆盖

#### 4.1 单元测试
- [ ] 核心业务逻辑有测试
- [ ] 边界情况有测试
- [ ] 异常情况有测试
- [ ] 测试用例充分

**测试覆盖检查**:
```javascript
// 一个功能应该有这些测试:
describe('创建订单', () => {
  it('应该成功创建订单')  // 正常场景
  it('缺少必填字段应该返回 400')  // 验证错误
  it('无效的价格应该返回 400')  // 数据验证
  it('未登录应该返回 401')  // 权限错误
  it('应该正确计算定金和尾款')  // 业务逻辑
})
```

#### 4.2 集成测试
- [ ] API 端到端测试
- [ ] 多个模块协作测试
- [ ] 数据库操作测试

#### 4.3 E2E 测试
- [ ] 关键业务流程有 E2E 测试
- [ ] 用户交互测试
- [ ] 页面跳转测试

#### 4.4 测试质量
- [ ] 测试用例有意义
- [ ] 断言充分
- [ ] 测试数据隔离
- [ ] Mock 使用合理

---

### 5. 安全性

#### 5.1 SQL 注入
```javascript
// ❌ SQL 注入风险
const sql = `SELECT * FROM users WHERE phone = '${phone}'`

// ✅ 使用参数化查询
const sql = convertPlaceholders(
  'SELECT * FROM users WHERE phone = ?',
  [phone]
)
```

#### 5.2 XSS (跨站脚本)
```vue
<!-- ❌ XSS 风险 -->
<div v-html="userInput"></div>

<!-- ✅ 使用文本插值 -->
<div>{{ userInput }}</div>

<!-- 如必须使用 v-html,先转义 -->
<div v-html="sanitizeHtml(userInput)"></div>
```

#### 5.3 权限控制
```javascript
// ✅ 每个需要权限的操作都要检查
const order = OrderModel.findById(id)
if (!order) {
  throw new AppError(3001, '订单不存在', 404)
}

// 权限检查
if (order.user_id !== req.user.userId) {
  throw new AppError(2002, '无权限', 403)
}
```

#### 5.4 敏感数据
- [ ] 密码等敏感数据已加密
- [ ] API 响应不包含敏感字段
- [ ] 日志不包含敏感信息
- [ ] 前端不存储敏感数据

```javascript
// ✅ 不返回敏感字段
const user = UserModel.findById(id)
delete user.password
delete user.sms_code
res.json({ code: 0, data: user })

// ✅ 敏感数据加密
const hashedPassword = await bcrypt.hash(password, 10)
```

#### 5.5 CSRF 防护
- [ ] 修改操作使用 POST/PUT/DELETE
- [ ] 重要操作需要二次确认
- [ ] Token 验证

---

### 6. 性能

#### 6.1 数据库查询
- [ ] 避免 N+1 查询
- [ ] 使用索引
- [ ] 避免全表扫描
- [ ] 分页查询

```javascript
// ✅ 分页查询
const { page = 1, limit = 20 } = req.query
const offset = (page - 1) * limit
const sql = `SELECT * FROM orders LIMIT ${limit} OFFSET ${offset}`

// ✅ 使用索引
// CREATE INDEX idx_orders_user_id ON orders(user_id)
```

#### 6.2 前端性能
- [ ] 避免不必要的重渲染
- [ ] 列表使用虚拟滚动 (如需要)
- [ ] 图片懒加载 (如需要)
- [ ] 代码分割 (路由懒加载)

```javascript
// ✅ 路由懒加载
{
  path: '/admin/orders',
  component: () => import('@/views/admin/Orders.vue')
}

// ✅ 使用 computed 缓存计算结果
const filteredList = computed(() => {
  return list.value.filter(item => item.status === 'active')
})
```

#### 6.3 资源优化
- [ ] 图片压缩
- [ ] 代码压缩 (生产构建)
- [ ] 静态资源 CDN (如需要)

---

### 7. 错误处理

#### 7.1 异常捕获
- [ ] 所有异步操作都有 try-catch
- [ ] 错误能够被正确处理
- [ ] 用户能看到友好的错误提示

```javascript
// ✅ 完整的错误处理
try {
  const data = await fetchData()
  list.value = data
} catch (error) {
  // 记录错误 (开发环境)
  console.error('数据加载失败:', error)

  // 用户提示
  showFailToast(error.message || '加载失败,请稍后重试')

  // 错误上报 (生产环境)
  // reportError(error)
} finally {
  loading.value = false
}
```

#### 7.2 错误信息
- [ ] 错误信息清晰
- [ ] 错误码定义合理
- [ ] 用户看到的提示友好

```javascript
// ✅ 清晰的错误信息
throw new AppError(1001, '订单价格必须是正数', 400)

// ❌ 模糊的错误信息
throw new Error('Invalid input')
```

---

### 8. 可维护性

#### 8.1 代码组织
- [ ] 文件结构清晰
- [ ] 目录划分合理
- [ ] 模块职责明确
- [ ] 命名规范统一

#### 8.2 文档
- [ ] 复杂功能有文档说明
- [ ] API 变更更新文档
- [ ] README 保持更新
- [ ] 公共函数有 JSDoc

#### 8.3 向后兼容
- [ ] API 变更向后兼容
- [ ] 数据库变更有迁移脚本
- [ ] 破坏性变更有说明

---

## 代码审查流程

### 1. 准备阶段
```bash
# 拉取最新代码
git fetch origin
git checkout feature-branch

# 查看变更
git diff main...feature-branch

# 查看提交历史
git log main..feature-branch --oneline
```

### 2. 理解变更
- 阅读相关 Issue/需求
- 理解要解决的问题
- 理解实现方案

### 3. 逐文件审查

**前端文件审查**:
```
src/views/         # 页面组件
├─ 检查组件结构
├─ 检查 API 调用
├─ 检查错误处理
└─ 检查用户体验

src/api/           # API 封装
├─ 检查接口定义
├─ 检查参数格式
└─ 检查 JSDoc

src/stores/        # 状态管理
├─ 检查 state 定义
├─ 检查 actions 逻辑
└─ 检查 getters

src/router/        # 路由配置
├─ 检查路由定义
├─ 检查路由守卫
└─ 检查 meta 信息
```

**后端文件审查**:
```
src/routes/        # 路由文件
├─ 检查端点定义
├─ 检查参数验证
├─ 检查权限控制
└─ 检查错误处理

src/models/        # 数据模型
├─ 检查 SQL 查询
├─ 检查业务逻辑
├─ 检查数据验证
└─ 检查 PostgreSQL/SQLite 兼容性

src/tests/         # 测试文件
├─ 检查测试覆盖
├─ 检查测试质量
└─ 检查断言充分
```

### 4. 运行测试
```bash
# 运行单元测试
pnpm test

# 运行 E2E 测试
pnpm test:e2e

# 运行 lint
pnpm lint

# 本地手动测试
pnpm dev
```

### 5. 提供反馈

**反馈分类**:
- 🔴 **Blocker**: 必须修改 (安全问题、严重 Bug)
- 🟡 **Major**: 建议修改 (设计问题、代码质量)
- 🟢 **Minor**: 可选修改 (风格问题、优化建议)
- 💬 **Question**: 疑问需要讨论

**反馈示例**:
```markdown
## 🔴 Blocker

**src/routes/orders.js:45**
缺少权限检查,任何用户都可以修改他人订单。

建议:
\`\`\`javascript
if (order.user_id !== req.user.userId) {
  throw new AppError(2002, '无权限', 403)
}
\`\`\`

## 🟡 Major

**src/views/Orders.vue:78**
未处理 API 请求失败的情况,可能导致页面卡死。

建议添加 try-catch 和错误提示。

## 🟢 Minor

**src/api/orders.js:12**
函数缺少 JSDoc 注释,建议添加参数和返回值说明。

## 💬 Question

为什么选择在前端计算定金尾款?是否应该由后端计算确保一致性?
```

### 6. 批准或请求修改
- ✅ **Approve**: 代码质量好,可以合并
- 🔄 **Request Changes**: 需要修改后再审查
- 💬 **Comment**: 提供意见但不阻止合并

---

## 审查检查清单

### 代码质量
- [ ] 代码可读性好
- [ ] 命名规范清晰
- [ ] 没有重复代码
- [ ] 复杂度合理
- [ ] 注释充分

### 功能实现
- [ ] 实现符合需求
- [ ] 边界情况都处理
- [ ] 错误处理完整
- [ ] 业务逻辑正确

### 安全性
- [ ] 没有 SQL 注入风险
- [ ] 没有 XSS 漏洞
- [ ] 权限控制正确
- [ ] 敏感数据加密

### 测试
- [ ] 单元测试通过
- [ ] E2E 测试通过
- [ ] 测试覆盖充分
- [ ] 测试质量好

### 性能
- [ ] 数据库查询优化
- [ ] 没有性能瓶颈
- [ ] 资源加载合理

### 架构
- [ ] 符合现有架构
- [ ] 模块划分合理
- [ ] API 设计合理
- [ ] 向后兼容

---

## 常见问题

### Q1: 代码审查的重点是什么？
A: 按优先级:
1. 安全性 (SQL 注入、XSS、权限)
2. 功能正确性 (业务逻辑、边界情况)
3. 测试覆盖 (单元测试、E2E 测试)
4. 代码质量 (可读性、可维护性)
5. 性能 (数据库查询、资源优化)

### Q2: 如何给出建设性的反馈？
A:
- 指出问题并说明原因
- 提供具体的改进建议或代码示例
- 区分严重程度 (Blocker/Major/Minor)
- 语气友好,尊重作者

### Q3: 什么情况下应该 Request Changes？
A:
- 有安全问题
- 有严重 Bug
- 缺少必要的测试
- 不符合项目规范

### Q4: 审查自己的代码需要注意什么？
A: 使用同样的标准,甚至更严格:
- 提交前自查
- 使用 `/code` 检查规范
- 使用 `/test` 确保测试
- 使用 `/ci-check` 预检查

---

## 相关文档

- [代码编写规范](/code)
- [测试编写规范](/test)
- [提交规范](/commit)
- [问题修复流程](/fix)
- [前端编码规范](../../YueFa-docs/standards/frontend.md)
- [后端编码规范](../../YueFa-docs/standards/backend.md)
