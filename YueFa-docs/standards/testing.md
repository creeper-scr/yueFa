# 测试编写规范

本文档定义了 YueFa 项目测试编写的规范和最佳实践。

## 快速参考

更详细的测试规范请查看 [/test Skill](../../.claude/skills/test.md)。

## 测试策略

### 测试金字塔
```
      E2E 测试 (少量)
    ↗  关键业务流程  ↖
  集成测试 (适量)
  ↗  API 端到端   ↖
单元测试 (大量)
业务逻辑、组件
```

### 测试覆盖目标
- **单元测试**: 核心业务逻辑 80%+
- **集成测试**: 所有 API 端点
- **E2E 测试**: 关键业务流程

## 后端测试规范

### 测试框架
- Vitest + Supertest

### 测试文件位置
```
codes/packages/server/src/tests/
├── setup.js          # 全局配置
├── auth.test.js      # 认证测试
├── users.test.js     # 用户测试
├── orders.test.js    # 订单测试
└── ...
```

### 测试模板
```javascript
import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { app } from '../app.js'

describe('Orders API', () => {
  const testPhone = '13800138001'
  let token

  beforeEach(async () => {
    // 创建测试用户并登录
    SmsCodeModel.create(testPhone, '123456')
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ phone: testPhone, code: '123456' })
    token = res.body.data.token
  })

  it('应该返回订单列表', async () => {
    const res = await request(app)
      .get('/api/v1/orders')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.code).toBe(0)
    expect(res.body.data.list).toBeDefined()
  })
})
```

### 测试覆盖场景
- ✅ 正常场景
- ✅ 边界场景 (空值、最大值、最小值)
- ✅ 异常场景 (400/401/403/404)
- ✅ 权限场景 (owner/非owner)

## 前端测试规范

### 组件测试 (Vitest + Vue Test Utils)

```javascript
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import OrderCard from './OrderCard.vue'

describe('OrderCard 组件', () => {
  it('应该正确渲染订单信息', () => {
    const wrapper = mount(OrderCard, {
      props: {
        order: {
          id: '1',
          customer_name: '张三',
          price: 500
        }
      }
    })

    expect(wrapper.find('.customer-name').text()).toBe('张三')
    expect(wrapper.find('.price').text()).toContain('500')
  })
})
```

### E2E 测试 (Playwright)

```javascript
import { test, expect } from '@playwright/test'
import { setupMockApi, loginAs, mockData } from './helpers.js'

test('应该可以创建订单', async ({ page }) => {
  await setupMockApi(page)
  await loginAs(page, mockData.user)

  await page.goto('/admin/orders/create')
  await page.fill('[placeholder="客户姓名"]', '张三')
  await page.fill('[placeholder="价格"]', '500')
  await page.click('button:has-text("提交")')

  await expect(page.locator('.van-toast')).toContainText('创建成功')
})
```

## 测试命令

```bash
# 运行所有测试
pnpm test

# 运行特定包的测试
pnpm test:web        # 前端单元测试
pnpm test:server     # 后端单元测试
pnpm test:e2e        # E2E 测试

# 生成覆盖率报告
pnpm test:coverage

# UI 模式
pnpm --filter @yuefa/web test:ui
pnpm --filter @yuefa/web test:e2e:ui
```

## 测试最佳实践

### 1. 数据隔离
- 每个测试使用唯一的测试数据
- 使用 `beforeEach` 初始化
- 测试后自动清理

### 2. 测试命名
```javascript
// ✅ 清晰的描述
it('应该在用户未登录时返回 401')
it('应该正确计算订单定金和尾款')

// ❌ 模糊的描述
it('测试登录')
it('测试订单')
```

### 3. 断言充分
```javascript
// ✅ 充分的断言
expect(res.status).toBe(200)
expect(res.body.code).toBe(0)
expect(res.body.data).toMatchObject({
  id: expect.any(String),
  price: 500
})

// ❌ 不充分的断言
expect(res.status).toBe(200)
```

### 4. Mock 外部依赖
- Mock 第三方服务 (OSS、短信)
- Mock API 请求 (E2E 测试)
- Mock 时间 (如需要)

## 测试检查清单

### 单元测试
- [ ] 正常场景测试
- [ ] 边界场景测试
- [ ] 异常场景测试
- [ ] 权限场景测试
- [ ] 断言充分

### E2E 测试
- [ ] 关键业务流程
- [ ] 用户交互
- [ ] 页面跳转
- [ ] 错误提示
- [ ] 成功提示

### 测试质量
- [ ] 测试用例有意义
- [ ] 测试数据隔离
- [ ] Mock 使用合理
- [ ] 测试可重复运行

## 相关资源

- [/test Skill](../../.claude/skills/test.md) - 详细的测试规范
- [Vitest 文档](https://vitest.dev/)
- [Playwright 文档](https://playwright.dev/)
- [Vue Test Utils 文档](https://test-utils.vuejs.org/)
