# /fix - 问题修复流程

Replace with description of the skill and when Claude should use it.

当发现 Bug 或问题时，使用此 Skill 进行系统化的问题排查和修复。确保修复彻底、有测试覆盖、不引入新问题。

## 使用场景

- 用户报告 Bug
- 测试发现问题
- 生产环境出现错误
- 代码审查发现问题

---

## 问题修复流程

### 第一步: 问题复现

#### 1.1 收集问题信息
- **问题描述**: 具体现象是什么？
- **复现步骤**: 如何触发这个问题？
- **预期行为**: 应该是什么样的？
- **实际行为**: 现在是什么样的？
- **环境信息**:
  - 浏览器/设备
  - 操作系统
  - 应用版本
  - 用户角色 (师傅/客户)

#### 1.2 本地复现
```bash
# 1. 切换到问题分支或 main
git checkout main
git pull

# 2. 启动本地环境
cd codes
pnpm dev

# 3. 按照复现步骤操作
# 访问对应页面,执行对应操作

# 4. 查看浏览器控制台
# - 是否有 JavaScript 错误?
# - 是否有网络请求失败?
# - 是否有警告信息?

# 5. 查看服务器日志
# 后端是否有错误日志?
```

#### 1.3 确定影响范围
- 影响哪些功能？
- 影响哪些用户？
- 严重程度如何？
  - P0: 核心功能完全不可用
  - P1: 重要功能异常
  - P2: 次要功能异常
  - P3: 体验优化

---

### 第二步: 根因分析

#### 2.1 错误追踪

**前端错误**:
```javascript
// 查看浏览器控制台
// 1. JavaScript 错误
//    - 未捕获的异常
//    - Promise rejection
//    - Vue 警告

// 2. 网络错误
//    - API 请求失败 (查看 Network 标签)
//    - 状态码: 400/401/403/404/500
//    - 响应内容

// 3. 使用 Vue DevTools
//    - 查看组件状态
//    - 查看 Pinia store 数据
//    - 查看路由信息
```

**后端错误**:
```bash
# 查看后端日志
cd codes/packages/server

# 开发环境: 终端输出
# 生产环境: 查看云端日志

# 常见错误:
# - SQL 错误 (数据库查询失败)
# - 验证错误 (数据格式错误)
# - 权限错误 (未授权访问)
# - 业务逻辑错误
```

#### 2.2 代码追踪
```bash
# 找到相关代码文件
# 前端: src/views/, src/components/, src/api/
# 后端: src/routes/, src/models/

# 使用 IDE 的调试功能
# - 设置断点
# - 单步执行
# - 查看变量值

# 或使用 console.log/debugger
# (记得修复后删除)
```

#### 2.3 数据排查
```bash
# 检查数据库数据
# PostgreSQL (生产)
# SQLite (开发)

# 常见问题:
# - 数据不存在
# - 数据格式错误
# - 关联数据缺失
# - 数据状态异常
```

#### 2.4 确定根本原因
- 是代码逻辑错误？
- 是数据验证缺失？
- 是边界情况未处理？
- 是并发问题？
- 是环境配置问题？

---

### 第三步: 修复方案设计

#### 3.1 评估修复方案

**方案考虑因素**:
- 能否彻底解决问题？
- 是否会引入新问题？
- 是否向后兼容？
- 是否需要数据迁移？
- 修复成本和风险如何？

#### 3.2 修复策略

**策略 1: 直接修复**
```
适用于: 简单的逻辑错误、边界情况处理

例如:
- 修正条件判断
- 添加空值检查
- 修正计算公式
```

**策略 2: 重构修复**
```
适用于: 设计缺陷导致的问题

例如:
- 重构复杂的函数
- 改进数据结构
- 优化业务流程
```

**策略 3: 添加保护**
```
适用于: 外部依赖导致的问题

例如:
- 添加错误捕获
- 添加重试机制
- 添加降级方案
```

#### 3.3 修复示例

**前端修复示例**:
```javascript
// ❌ 错误代码: 未处理空值
const userName = user.profile.name  // user.profile 可能为 null

// ✅ 修复: 添加空值检查
const userName = user?.profile?.name || '未设置'

// ❌ 错误代码: 未捕获异步错误
const data = await fetchData()

// ✅ 修复: 添加错误处理
try {
  const data = await fetchData()
  // 处理数据
} catch (error) {
  showFailToast(error.message || '加载失败')
}

// ❌ 错误代码: 状态未响应式
let count = 0  // 在 Vue 组件中

// ✅ 修复: 使用 ref
const count = ref(0)
```

**后端修复示例**:
```javascript
// ❌ 错误代码: 缺少权限检查
router.put('/api/v1/orders/:id', auth, async (req, res, next) => {
  const order = OrderModel.update(req.params.id, req.body)
  res.json({ code: 0, data: order })
})

// ✅ 修复: 添加权限检查
router.put('/api/v1/orders/:id', auth, async (req, res, next) => {
  try {
    const order = OrderModel.findById(req.params.id)

    if (!order) {
      throw new AppError(3001, '订单不存在', 404)
    }

    // 权限检查
    if (order.user_id !== req.user.userId) {
      throw new AppError(2002, '无权限修改此订单', 403)
    }

    const updated = OrderModel.update(req.params.id, req.body)
    res.json({ code: 0, data: updated })
  } catch (error) {
    next(error)
  }
})

// ❌ 错误代码: SQL 注入风险
const sql = `SELECT * FROM users WHERE phone = '${phone}'`

// ✅ 修复: 使用参数化查询
const sql = convertPlaceholders(
  'SELECT * FROM users WHERE phone = ?',
  [phone]
)
```

---

### 第四步: 编写回归测试

#### 4.1 为 Bug 编写测试

**原则**: 先写测试,再修复代码 (TDD)

**后端测试**:
```javascript
// src/tests/xxx.test.js
describe('Bug #123 修复', () => {
  it('应该正确处理空值情况', async () => {
    // 复现 Bug 的测试用例
    const res = await request(app)
      .post('/api/v1/xxx')
      .set('Authorization', `Bearer ${token}`)
      .send({ field1: null }) // 触发 Bug 的数据

    // 验证修复后的行为
    expect(res.status).toBe(400)
    expect(res.body.message).toContain('字段1不能为空')
  })

  it('应该拒绝未授权的访问', async () => {
    // 权限问题的回归测试
    const res = await request(app)
      .put('/api/v1/xxx/other-user-resource')
      .set('Authorization', `Bearer ${token}`)
      .send({ field1: 'test' })

    expect(res.status).toBe(403)
    expect(res.body.code).toBe(2002)
  })
})
```

**E2E 测试**:
```javascript
// e2e/xxx-bugfix.spec.js
test('Bug #123: 空值导致页面崩溃', async ({ page }) => {
  await loginAs(page, mockData.user)
  await page.goto('/admin/xxx')

  // 模拟触发 Bug 的操作
  await page.fill('[placeholder="字段1"]', '')  // 空值
  await page.click('button:has-text("提交")')

  // 验证页面不崩溃
  await expect(page.locator('.van-field__error-message')).toBeVisible()
  await expect(page.locator('.van-field__error-message')).toHaveText('字段1不能为空')
})
```

#### 4.2 运行测试验证

```bash
# 1. 运行测试 (应该失败,因为还没修复)
pnpm test

# 2. 修复代码

# 3. 再次运行测试 (应该通过)
pnpm test

# 4. 运行 E2E 测试
pnpm test:e2e
```

---

### 第五步: 本地验证

#### 5.1 手动测试
```bash
# 启动开发环境
pnpm dev

# 1. 复现原问题的步骤
# 2. 验证问题已修复
# 3. 测试边界情况
# 4. 测试相关功能未受影响
```

#### 5.2 自动化测试
```bash
# 运行所有测试
pnpm test

# 确保:
# - 新测试通过
# - 现有测试不受影响
# - 代码覆盖率不降低
```

---

### 第六步: 提交和部署

#### 6.1 使用 `/commit` 提交

```bash
# 提交格式
git add .
git commit -m "$(cat <<'EOF'
fix(scope): 修复 XXX 问题

问题描述:
- 在 YYY 场景下会出现 ZZZ 错误

根本原因:
- AAA 导致 BBB

修复方案:
- CCC
- 添加了回归测试

Closes #123

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"
```

**示例**:
```bash
git commit -m "$(cat <<'EOF'
fix(orders): 修复订单状态更新权限检查缺失

问题描述:
- 任何用户都可以修改他人的订单状态

根本原因:
- 订单状态更新接口缺少 user_id 权限检查

修复方案:
- 添加订单 owner 权限检查
- 添加回归测试用例

Closes #156

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"
```

#### 6.2 使用 `/ci-check` 预检查

```bash
# 运行 CI 预检查
pnpm lint && pnpm test && pnpm test:e2e
```

#### 6.3 Push 和部署

```bash
# Push 到 GitHub
git push origin main

# 查看 CI/CD 执行
# 访问 GitHub Actions

# 等待自动部署完成
```

---

### 第七步: 验证部署

#### 7.1 生产环境验证
```bash
# 访问生产环境
# 复现原问题的步骤
# 验证问题已修复
```

#### 7.2 监控观察
- 查看错误日志是否还有相同错误
- 查看用户反馈
- 监控相关指标

---

## 常见 Bug 类型和修复模式

### 1. 空值/undefined 错误
```javascript
// ❌ 问题
user.profile.name  // profile 可能为 null

// ✅ 修复
user?.profile?.name || '默认值'
```

### 2. 异步错误未捕获
```javascript
// ❌ 问题
const data = await fetchData()  // 可能失败

// ✅ 修复
try {
  const data = await fetchData()
} catch (error) {
  handleError(error)
}
```

### 3. 权限检查缺失
```javascript
// ❌ 问题
router.put('/:id', auth, async (req, res) => {
  const data = Model.update(req.params.id, req.body)
  res.json({ code: 0, data })
})

// ✅ 修复
router.put('/:id', auth, async (req, res) => {
  const item = Model.findById(req.params.id)
  if (item.user_id !== req.user.userId) {
    throw new AppError(2002, '无权限', 403)
  }
  const data = Model.update(req.params.id, req.body)
  res.json({ code: 0, data })
})
```

### 4. 数据验证缺失
```javascript
// ❌ 问题
router.post('/', auth, async (req, res) => {
  const data = Model.create(req.body)  // 未验证
  res.json({ code: 0, data })
})

// ✅ 修复
router.post('/',
  auth,
  body('field1').notEmpty().withMessage('字段1必填'),
  body('field2').isEmail().withMessage('邮箱格式错误'),
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      throw new AppError(1001, '验证失败', 400, errors.array())
    }
    const data = Model.create(req.body)
    res.json({ code: 0, data })
  }
)
```

### 5. 状态管理错误
```vue
<!-- ❌ 问题: 非响应式 -->
<script setup>
let count = 0  // 不是响应式
</script>

<!-- ✅ 修复: 使用 ref -->
<script setup>
import { ref } from 'vue'
const count = ref(0)
</script>
```

### 6. 边界情况未处理
```javascript
// ❌ 问题
const pages = Math.ceil(total / limit)  // limit 可能为 0

// ✅ 修复
const pages = limit > 0 ? Math.ceil(total / limit) : 1
```

---

## Bug 修复检查清单

### 问题分析
- [ ] 问题已在本地复现
- [ ] 确定了根本原因
- [ ] 确定了影响范围
- [ ] 评估了修复方案

### 代码修复
- [ ] 修复了根本原因 (不是表面现象)
- [ ] 添加了空值/边界检查
- [ ] 添加了错误处理
- [ ] 添加了必要的验证
- [ ] 代码符合项目规范

### 测试
- [ ] 编写了回归测试
- [ ] 本地测试全部通过
- [ ] E2E 测试通过 (如需要)
- [ ] 手动验证修复效果

### 提交
- [ ] 提交信息清晰描述问题和修复
- [ ] 关联了相关 Issue
- [ ] CI 预检查通过

### 部署验证
- [ ] 生产环境验证修复
- [ ] 监控错误日志
- [ ] 没有引入新问题

---

## 紧急修复流程 (Hotfix)

### 严重生产问题 (P0)
```bash
# 1. 从 main 创建 hotfix 分支
git checkout main
git pull
git checkout -b hotfix/critical-bug

# 2. 快速修复
# 修改最少的代码
# 确保修复有效

# 3. 测试验证
pnpm test
pnpm test:e2e  # 如果时间允许

# 4. 提交
git add .
git commit -m "fix: 紧急修复生产 XXX 问题"

# 5. 合并到 main 并部署
git checkout main
git merge hotfix/critical-bug
git push origin main

# 6. 监控部署
# 确认问题解决

# 7. 后续完善
# 补充完整的测试
# 改进设计 (如需要)
```

---

## 常见问题

### Q1: 如何确定是否彻底修复？
A:
- 编写了能复现 Bug 的测试用例
- 测试用例在修复前失败,修复后通过
- 相关的边界情况都测试了

### Q2: 修复一个 Bug 引入了新 Bug 怎么办？
A:
- 回滚修复,重新分析
- 可能是修复方案不对,需要重新设计
- 确保有完整的测试覆盖

### Q3: 生产问题但本地无法复现？
A:
- 检查环境差异 (数据库、配置、版本)
- 查看生产日志
- 考虑使用生产数据的副本测试 (注意脱敏)

### Q4: Bug 修复的优先级如何判断？
A:
- P0 (紧急): 核心功能不可用,立即修复
- P1 (高): 重要功能异常,当天修复
- P2 (中): 次要功能异常,本周修复
- P3 (低): 体验问题,计划修复

---

## 相关文档

- [代码编写规范](/code)
- [测试编写规范](/test)
- [提交规范](/commit)
- [代码审查流程](/review)
