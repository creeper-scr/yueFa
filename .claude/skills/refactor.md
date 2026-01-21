# /refactor - 代码重构流程

Replace with description of the skill and when Claude should use it.

当需要改进代码结构而不改变外部行为时使用此 Skill。确保重构安全、有序、有测试保护。

## 使用场景

- 代码重复需要抽取
- 函数过于复杂需要拆分
- 模块职责不清需要重组
- 性能瓶颈需要优化
- 技术债务需要偿还

## 重构原则

### 核心原则
1. **小步重构**: 每次只做一种重构,频繁提交
2. **测试先行**: 重构前确保有测试覆盖
3. **行为不变**: 外部可观察行为不改变
4. **独立进行**: 重构和功能开发分离

### 何时不应该重构
- ❌ 没有测试覆盖
- ❌ 正在赶紧急功能
- ❌ 代码即将废弃
- ❌ 重写比重构更合适

---

## 重构流程

### 第一步: 重构规划

#### 1.1 识别重构目标

**代码坏味道** (Code Smells):
```javascript
// 1. 重复代码
function calculateOrderDeposit(order) {
  return order.price * 0.2
}
function calculateOrderBalance(order) {
  return order.price * 0.8
}
// → 可以抽取公共逻辑

// 2. 过长函数 (>50行)
function processOrder(order) {
  // 100+ 行代码
  // → 需要拆分

// 3. 过多参数 (>3个)
function createOrder(name, contact, character, work, price, deadline, notes) {}
// → 使用对象参数

// 4. 复杂条件判断
if (order.status === 'pending' && order.deposit_paid && order.wig_received) {}
// → 抽取为语义化的函数

// 5. 嵌套过深 (>3层)
if (a) {
  if (b) {
    if (c) {
      if (d) {}
    }
  }
}
// → 早返回或抽取函数
```

**性能问题**:
- N+1 查询
- 全表扫描
- 未使用索引
- 重复计算

**架构问题**:
- 职责不清
- 耦合度高
- 扩展性差
- 可测试性差

#### 1.2 评估影响范围
```bash
# 查找函数/变量的使用位置
grep -r "functionName" src/

# 查找导入位置
grep -r "import.*functionName" src/

# 查看 Git 历史
git log -p -- path/to/file.js

# 确定:
# - 有多少地方在使用?
# - 是否是公共 API?
# - 是否有测试覆盖?
# - 重构风险有多大?
```

#### 1.3 制定重构策略

**策略选择**:
```
简单重构 (1小时内):
- 重命名
- 提取变量
- 提取函数

中等重构 (半天内):
- 提取类/模块
- 移动函数
- 简化条件

复杂重构 (1天以上):
- 架构调整
- 设计模式引入
- 大规模重组
```

---

### 第二步: 测试保护

#### 2.1 补充现有测试
```bash
# 运行现有测试
pnpm test

# 检查测试覆盖率
pnpm test:coverage

# 如果覆盖率不足,先补充测试
```

#### 2.2 编写重构前的测试
```javascript
// 重构前先写测试,确保行为不变
describe('calculateOrderFinancials', () => {
  it('应该正确计算定金和尾款', () => {
    const result = calculateOrderFinancials({ price: 500 })
    expect(result.deposit).toBe(100)  // 20%
    expect(result.balance).toBe(400)  // 80%
  })

  it('应该处理小数情况', () => {
    const result = calculateOrderFinancials({ price: 550 })
    expect(result.deposit).toBe(110)
    expect(result.balance).toBe(440)
  })

  it('应该处理零价格', () => {
    const result = calculateOrderFinancials({ price: 0 })
    expect(result.deposit).toBe(0)
    expect(result.balance).toBe(0)
  })
})
```

#### 2.3 建立回归测试基线
```bash
# 运行所有测试并记录结果
pnpm test > test-baseline.txt

# 重构过程中频繁运行测试
pnpm test

# 确保测试结果一致
```

---

### 第三步: 小步重构

#### 3.1 重构技巧

**技巧 1: 提取函数**
```javascript
// ❌ 重构前: 复杂的计算逻辑
function processOrder(order) {
  const deposit = order.price * 0.2
  const balance = order.price * 0.8
  const deadline = new Date(order.created_at)
  deadline.setDate(deadline.getDate() + 30)
  // ...更多逻辑
}

// ✅ 重构后: 提取为独立函数
function calculateFinancials(price) {
  return {
    deposit: price * 0.2,
    balance: price * 0.8
  }
}

function calculateDeadline(createdAt, daysToAdd = 30) {
  const deadline = new Date(createdAt)
  deadline.setDate(deadline.getDate() + daysToAdd)
  return deadline
}

function processOrder(order) {
  const { deposit, balance } = calculateFinancials(order.price)
  const deadline = calculateDeadline(order.created_at)
  // ...
}
```

**技巧 2: 提取变量**
```javascript
// ❌ 重构前: 魔法数字和复杂表达式
if (order.price * 0.2 > 100 && order.status === 'pending_deposit') {
  // ...
}

// ✅ 重构后: 提取为语义化变量
const DEPOSIT_RATIO = 0.2
const MIN_DEPOSIT = 100

const deposit = order.price * DEPOSIT_RATIO
const isPendingDeposit = order.status === 'pending_deposit'

if (deposit > MIN_DEPOSIT && isPendingDeposit) {
  // ...
}
```

**技巧 3: 简化条件**
```javascript
// ❌ 重构前: 复杂条件
if (order.status === 'in_progress' &&
    order.deposit_paid_at !== null &&
    order.wig_received_at !== null &&
    !order.completed_at) {
  // ...
}

// ✅ 重构后: 抽取为语义化函数
function isOrderInProgressAndReady(order) {
  return order.status === 'in_progress' &&
         order.deposit_paid_at !== null &&
         order.wig_received_at !== null &&
         !order.completed_at
}

if (isOrderInProgressAndReady(order)) {
  // ...
}
```

**技巧 4: 使用对象参数**
```javascript
// ❌ 重构前: 参数过多
function createOrder(
  customerName,
  customerContact,
  characterName,
  sourceWork,
  price,
  deadline,
  notes
) {
  // ...
}

// ✅ 重构后: 使用对象参数
function createOrder(orderData) {
  const {
    customerName,
    customerContact,
    characterName,
    sourceWork,
    price,
    deadline,
    notes
  } = orderData
  // ...
}

// 调用更清晰
createOrder({
  customerName: '张三',
  customerContact: 'wx: test',
  characterName: '初音未来',
  sourceWork: 'VOCALOID',
  price: 500,
  deadline: '2026-03-15',
  notes: '备注'
})
```

**技巧 5: 早返回 (Guard Clauses)**
```javascript
// ❌ 重构前: 嵌套过深
function updateOrder(id, data, userId) {
  const order = OrderModel.findById(id)
  if (order) {
    if (order.user_id === userId) {
      if (data.price > 0) {
        // 更新逻辑
      } else {
        throw new Error('价格必须大于0')
      }
    } else {
      throw new Error('无权限')
    }
  } else {
    throw new Error('订单不存在')
  }
}

// ✅ 重构后: 早返回
function updateOrder(id, data, userId) {
  const order = OrderModel.findById(id)
  if (!order) {
    throw new Error('订单不存在')
  }

  if (order.user_id !== userId) {
    throw new Error('无权限')
  }

  if (data.price <= 0) {
    throw new Error('价格必须大于0')
  }

  // 更新逻辑
}
```

**技巧 6: 消除重复代码**
```javascript
// ❌ 重构前: 重复逻辑
function getActiveOrders(userId) {
  return OrderModel.findByUserId(userId, { status: 'active' })
}

function getCompletedOrders(userId) {
  return OrderModel.findByUserId(userId, { status: 'completed' })
}

function getPendingOrders(userId) {
  return OrderModel.findByUserId(userId, { status: 'pending' })
}

// ✅ 重构后: 统一接口
function getOrdersByStatus(userId, status) {
  return OrderModel.findByUserId(userId, { status })
}

// 使用
const activeOrders = getOrdersByStatus(userId, 'active')
const completedOrders = getOrdersByStatus(userId, 'completed')
```

#### 3.2 重构步骤
```bash
# 1. 做一个小的重构
# 例如: 提取一个函数

# 2. 运行测试
pnpm test

# 3. 确认测试通过
# 如果失败,回滚重构

# 4. 提交
git add .
git commit -m "refactor: 提取 calculateFinancials 函数"

# 5. 继续下一个小重构
# 重复 1-4 步骤
```

---

### 第四步: 性能优化重构

#### 4.1 数据库查询优化
```javascript
// ❌ 重构前: N+1 查询
async function getOrdersWithUsers(userId) {
  const orders = OrderModel.findByUserId(userId)

  for (const order of orders) {
    order.customer = await CustomerModel.findById(order.customer_id)  // N 次查询
  }

  return orders
}

// ✅ 重构后: 批量查询或 JOIN
async function getOrdersWithUsers(userId) {
  // 使用 SQL JOIN 一次性查询
  const sql = convertPlaceholders(`
    SELECT o.*, c.name as customer_name, c.contact as customer_contact
    FROM orders o
    LEFT JOIN customers c ON o.customer_id = c.id
    WHERE o.user_id = ?
  `, [userId])

  const db = getDb()
  const result = db.query(sql.query, sql.params)
  return result.rows
}
```

#### 4.2 前端性能优化
```vue
<!-- ❌ 重构前: 未优化的列表渲染 -->
<template>
  <div v-for="(order, index) in allOrders" :key="index">
    <div>{{ order.customer_name }}</div>
    <div>{{ getStatusText(order.status) }}</div>
    <div>{{ formatPrice(order.price) }}</div>
  </div>
</template>

<script setup>
const allOrders = ref([])  // 可能有几千条

// 每次渲染都重新计算
function getStatusText(status) {
  // 复杂计算
}
</script>

<!-- ✅ 重构后: 计算属性 + 分页 -->
<template>
  <div v-for="order in displayOrders" :key="order.id">
    <div>{{ order.customer_name }}</div>
    <div>{{ order.statusText }}</div>
    <div>{{ order.priceText }}</div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const allOrders = ref([])
const page = ref(1)
const limit = 20

// 使用 computed 缓存
const displayOrders = computed(() => {
  const start = (page.value - 1) * limit
  const end = start + limit

  return allOrders.value
    .slice(start, end)
    .map(order => ({
      ...order,
      statusText: getStatusText(order.status),
      priceText: formatPrice(order.price)
    }))
})
</script>
```

---

### 第五步: 验证和部署

#### 5.1 完整测试验证
```bash
# 运行所有测试
pnpm test

# 运行 E2E 测试
pnpm test:e2e

# 确认测试覆盖率没有下降
pnpm test:coverage

# 本地手动测试
pnpm dev
```

#### 5.2 代码审查
```bash
# 自我审查
# 使用 /review 检查清单

# 对比重构前后
git diff main...refactor-branch

# 确认:
# - 外部行为没有改变
# - 代码更清晰可读
# - 性能有提升 (如果是性能优化)
# - 测试都通过
```

#### 5.3 分阶段部署
```bash
# 1. 提交重构
git add .
git commit -m "refactor(orders): 重构订单财务计算逻辑

- 提取 calculateFinancials 函数
- 简化复杂条件判断
- 添加单元测试
- 不改变外部行为

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

# 2. Push 并观察
git push origin main

# 3. 监控生产环境
# - 查看错误日志
# - 监控性能指标
# - 观察用户反馈

# 4. 如有问题,准备回滚
git revert <commit-hash>
```

---

## 常见重构模式

### 1. 提取函数 (Extract Function)
**时机**: 函数过长或有重复逻辑

```javascript
// 重构前
function processOrder(order) {
  // 50+ 行代码
  const deposit = order.price * 0.2
  const balance = order.price * 0.8
  // ...
}

// 重构后
function calculateFinancials(price) {
  return {
    deposit: price * 0.2,
    balance: price * 0.8
  }
}

function processOrder(order) {
  const { deposit, balance } = calculateFinancials(order.price)
  // ...
}
```

### 2. 内联函数 (Inline Function)
**时机**: 函数太简单,名字和内容一样清晰

```javascript
// 重构前
function getRating(driver) {
  return moreThanFiveLateDeliveries(driver) ? 2 : 1
}

function moreThanFiveLateDeliveries(driver) {
  return driver.numberOfLateDeliveries > 5
}

// 重构后
function getRating(driver) {
  return driver.numberOfLateDeliveries > 5 ? 2 : 1
}
```

### 3. 提取变量 (Extract Variable)
**时机**: 表达式过于复杂

```javascript
// 重构前
return (
  platform.toUpperCase().indexOf(browser.platform.toUpperCase()) > -1 &&
  browser.version >= 10 &&
  browser.version < 12
)

// 重构后
const isSupportedPlatform = platform.toUpperCase().indexOf(
  browser.platform.toUpperCase()
) > -1
const isSupportedVersion = browser.version >= 10 && browser.version < 12

return isSupportedPlatform && isSupportedVersion
```

### 4. 以对象取代临时变量 (Replace Temp with Query)
```javascript
// 重构前
const basePrice = quantity * itemPrice
const discount = Math.max(0, quantity - 500) * itemPrice * 0.05
const shipping = Math.min(basePrice * 0.1, 100)
return basePrice - discount + shipping

// 重构后
function basePrice() {
  return quantity * itemPrice
}

function discount() {
  return Math.max(0, quantity - 500) * itemPrice * 0.05
}

function shipping() {
  return Math.min(basePrice() * 0.1, 100)
}

return basePrice() - discount() + shipping()
```

### 5. 分解条件式 (Decompose Conditional)
```javascript
// 重构前
if (date.before(SUMMER_START) || date.after(SUMMER_END)) {
  charge = quantity * winterRate + winterServiceCharge
} else {
  charge = quantity * summerRate
}

// 重构后
function isWinter(date) {
  return date.before(SUMMER_START) || date.after(SUMMER_END)
}

function winterCharge(quantity) {
  return quantity * winterRate + winterServiceCharge
}

function summerCharge(quantity) {
  return quantity * summerRate
}

charge = isWinter(date) ? winterCharge(quantity) : summerCharge(quantity)
```

---

## 重构检查清单

### 重构前
- [ ] 有充分的测试覆盖
- [ ] 理解了要重构的代码
- [ ] 确定了重构目标
- [ ] 评估了影响范围
- [ ] 制定了重构计划

### 重构中
- [ ] 小步重构,频繁提交
- [ ] 每次重构后运行测试
- [ ] 保持外部行为不变
- [ ] 重构和功能开发分离

### 重构后
- [ ] 所有测试通过
- [ ] 代码更清晰可读
- [ ] 没有引入新问题
- [ ] 性能没有下降 (或有提升)
- [ ] 完成代码审查

---

## 常见问题

### Q1: 重构和重写的区别？
A:
- **重构**: 小步改进,保持行为不变,有测试保护
- **重写**: 推倒重来,行为可能改变,风险大

### Q2: 什么时候应该重写而不是重构？
A:
- 代码质量极差,难以理解
- 架构设计根本性错误
- 技术栈已过时
- 重构成本 > 重写成本

### Q3: 重构会不会引入 Bug？
A: 可能会,但可以降低风险:
- 有充分的测试覆盖
- 小步重构,频繁验证
- 做好代码审查
- 可以回滚

### Q4: 如何说服团队花时间重构？
A:
- 展示技术债务的影响
- 量化重构的收益 (开发效率、Bug 减少)
- 在功能开发中穿插小的重构
- 为重构分配专门的时间

---

## 相关文档

- [代码编写规范](/code)
- [测试编写规范](/test)
- [提交规范](/commit)
- [代码审查流程](/review)
- [问题修复流程](/fix)

---

## 推荐阅读

- 《重构: 改善既有代码的设计》 - Martin Fowler
- 《代码整洁之道》 - Robert C. Martin
- 《架构整洁之道》 - Robert C. Martin
