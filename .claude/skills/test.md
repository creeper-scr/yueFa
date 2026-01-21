# /test - 本地测试编写与运行

Replace with description of the skill and when Claude should use it.

当完成代码编写后使用此 Skill，确保功能正确性和代码质量。包含单元测试、API 测试和 E2E 测试的编写和运行。

## 使用场景

- 新功能开发后编写测试
- Bug 修复后编写回归测试
- 代码重构后验证功能
- 本地运行全部测试

## YueFa 测试框架

### 测试技术栈
- **单元测试**: Vitest 1.4.0
- **API 测试**: Supertest 6.3.4
- **E2E 测试**: Playwright 1.57.0
- **DOM 环境**: happy-dom 14.3.6 (前端)
- **Vue 测试**: @vue/test-utils 2.4.5

---

## 测试分层策略

### 1. 后端单元/API 测试 (Vitest + Supertest)

#### 测试文件位置
```
codes/packages/server/src/tests/
├── setup.js          # 全局测试配置
├── auth.test.js      # 认证测试
├── users.test.js     # 用户测试
├── works.test.js     # 作品测试
├── orders.test.js    # 订单测试
├── reviews.test.js   # 验收测试
├── inquiries.test.js # 询价测试
└── xxx.test.js       # 新功能测试
```

#### 测试模板
```javascript
// src/tests/xxx.test.js
import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { app } from '../app.js'
import { SmsCodeModel } from '../models/SmsCode.js'

describe('Xxx API', () => {
  // 使用唯一的测试数据避免冲突
  const testPhone = '13800138999' // 确保手机号唯一
  const testSlug = 'test_xxx_user' // 确保 slug 唯一
  let token
  let xxxId

  // 每个测试前创建测试用户并登录
  beforeEach(async () => {
    // 创建验证码
    SmsCodeModel.create(testPhone, '123456')

    // 登录获取 token
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ phone: testPhone, code: '123456' })

    expect(loginRes.status).toBe(200)
    expect(loginRes.body.code).toBe(0)
    token = loginRes.body.data.token

    // 设置用户 slug
    await request(app)
      .put('/api/v1/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ slug: testSlug })
  })

  describe('GET /api/v1/xxx', () => {
    it('应该返回空列表', async () => {
      const res = await request(app)
        .get('/api/v1/xxx')
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(res.body.code).toBe(0)
      expect(res.body.data.list).toHaveLength(0)
    })

    it('应该返回列表和分页信息', async () => {
      // 先创建一个 XXX
      await request(app)
        .post('/api/v1/xxx')
        .set('Authorization', `Bearer ${token}`)
        .send({
          field1: '测试数据',
          field2: 'test@example.com'
        })

      const res = await request(app)
        .get('/api/v1/xxx?page=1&limit=20')
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(res.body.code).toBe(0)
      expect(res.body.data.list).toHaveLength(1)
      expect(res.body.data.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 1
      })
    })

    it('应该支持状态筛选', async () => {
      const res = await request(app)
        .get('/api/v1/xxx?status=active')
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(res.body.data.list).toBeDefined()
    })

    it('未登录应该返回 401', async () => {
      const res = await request(app)
        .get('/api/v1/xxx')

      expect(res.status).toBe(401)
      expect(res.body.code).toBe(2001)
    })
  })

  describe('POST /api/v1/xxx', () => {
    it('应该成功创建 XXX', async () => {
      const data = {
        field1: '测试字段1',
        field2: 'test@example.com'
      }

      const res = await request(app)
        .post('/api/v1/xxx')
        .set('Authorization', `Bearer ${token}`)
        .send(data)

      expect(res.status).toBe(200)
      expect(res.body.code).toBe(0)
      expect(res.body.data).toMatchObject({
        field1: data.field1,
        field2: data.field2
      })
      expect(res.body.data.id).toBeDefined()
      expect(res.body.data.created_at).toBeDefined()

      xxxId = res.body.data.id
    })

    it('缺少必填字段应该返回 400', async () => {
      const res = await request(app)
        .post('/api/v1/xxx')
        .set('Authorization', `Bearer ${token}`)
        .send({}) // 缺少 field1

      expect(res.status).toBe(400)
      expect(res.body.code).toBe(1001)
      expect(res.body.message).toContain('验证失败')
    })

    it('字段格式错误应该返回 400', async () => {
      const res = await request(app)
        .post('/api/v1/xxx')
        .set('Authorization', `Bearer ${token}`)
        .send({
          field1: '测试',
          field2: 'invalid-email' // 错误的 email 格式
        })

      expect(res.status).toBe(400)
      expect(res.body.code).toBe(1001)
    })

    it('未登录应该返回 401', async () => {
      const res = await request(app)
        .post('/api/v1/xxx')
        .send({ field1: '测试' })

      expect(res.status).toBe(401)
      expect(res.body.code).toBe(2001)
    })
  })

  describe('GET /api/v1/xxx/:id', () => {
    beforeEach(async () => {
      // 创建测试数据
      const res = await request(app)
        .post('/api/v1/xxx')
        .set('Authorization', `Bearer ${token}`)
        .send({ field1: '测试数据' })

      xxxId = res.body.data.id
    })

    it('应该返回 XXX 详情', async () => {
      const res = await request(app)
        .get(`/api/v1/xxx/${xxxId}`)
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(res.body.code).toBe(0)
      expect(res.body.data.id).toBe(xxxId)
      expect(res.body.data.field1).toBe('测试数据')
    })

    it('不存在的 ID 应该返回 404', async () => {
      const res = await request(app)
        .get('/api/v1/xxx/non-existent-id')
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(404)
      expect(res.body.code).toBe(3001)
    })

    it('无权限查看应该返回 403', async () => {
      // 创建另一个用户
      const otherPhone = '13900139000'
      SmsCodeModel.create(otherPhone, '123456')
      const otherRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ phone: otherPhone, code: '123456' })
      const otherToken = otherRes.body.data.token

      // 尝试访问他人的资源
      const res = await request(app)
        .get(`/api/v1/xxx/${xxxId}`)
        .set('Authorization', `Bearer ${otherToken}`)

      expect(res.status).toBe(403)
      expect(res.body.code).toBe(2002)
    })
  })

  describe('PUT /api/v1/xxx/:id', () => {
    beforeEach(async () => {
      const res = await request(app)
        .post('/api/v1/xxx')
        .set('Authorization', `Bearer ${token}`)
        .send({ field1: '原始数据' })

      xxxId = res.body.data.id
    })

    it('应该成功更新 XXX', async () => {
      const updateData = {
        field1: '更新后的数据',
        field2: 'updated@example.com'
      }

      const res = await request(app)
        .put(`/api/v1/xxx/${xxxId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)

      expect(res.status).toBe(200)
      expect(res.body.code).toBe(0)
      expect(res.body.data.field1).toBe(updateData.field1)
      expect(res.body.data.updated_at).toBeDefined()
    })

    it('不存在的 ID 应该返回 404', async () => {
      const res = await request(app)
        .put('/api/v1/xxx/non-existent-id')
        .set('Authorization', `Bearer ${token}`)
        .send({ field1: '更新' })

      expect(res.status).toBe(404)
      expect(res.body.code).toBe(3001)
    })

    it('无权限修改应该返回 403', async () => {
      const otherPhone = '13900139000'
      SmsCodeModel.create(otherPhone, '123456')
      const otherRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ phone: otherPhone, code: '123456' })
      const otherToken = otherRes.body.data.token

      const res = await request(app)
        .put(`/api/v1/xxx/${xxxId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ field1: '尝试修改' })

      expect(res.status).toBe(403)
      expect(res.body.code).toBe(2002)
    })
  })

  describe('DELETE /api/v1/xxx/:id', () => {
    beforeEach(async () => {
      const res = await request(app)
        .post('/api/v1/xxx')
        .set('Authorization', `Bearer ${token}`)
        .send({ field1: '待删除数据' })

      xxxId = res.body.data.id
    })

    it('应该成功删除 XXX', async () => {
      const res = await request(app)
        .delete(`/api/v1/xxx/${xxxId}`)
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(res.body.code).toBe(0)

      // 验证已删除
      const getRes = await request(app)
        .get(`/api/v1/xxx/${xxxId}`)
        .set('Authorization', `Bearer ${token}`)

      expect(getRes.status).toBe(404)
    })

    it('不存在的 ID 应该返回 404', async () => {
      const res = await request(app)
        .delete('/api/v1/xxx/non-existent-id')
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(404)
      expect(res.body.code).toBe(3001)
    })

    it('无权限删除应该返回 403', async () => {
      const otherPhone = '13900139000'
      SmsCodeModel.create(otherPhone, '123456')
      const otherRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ phone: otherPhone, code: '123456' })
      const otherToken = otherRes.body.data.token

      const res = await request(app)
        .delete(`/api/v1/xxx/${xxxId}`)
        .set('Authorization', `Bearer ${otherToken}`)

      expect(res.status).toBe(403)
      expect(res.body.code).toBe(2002)
    })
  })

  // 业务逻辑测试
  describe('业务逻辑测试', () => {
    it('应该正确处理复杂业务场景', async () => {
      // 例如:测试订单状态流转、定金尾款计算等
      // ...
    })
  })
})
```

---

### 2. 前端单元测试 (Vitest + Vue Test Utils)

#### 测试文件位置
```
codes/packages/web/src/
├── components/
│   ├── OrderCard.vue
│   ├── OrderCard.spec.js       # 组件测试
│   ├── WorkGallery.vue
│   └── WorkGallery.spec.js
└── views/
    └── client/
        ├── ReviewPage.vue
        └── ReviewPage.spec.js
```

#### 组件测试模板
```javascript
// src/components/XxxCard.spec.js
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import XxxCard from './XxxCard.vue'

describe('XxxCard 组件', () => {
  let pinia

  beforeEach(() => {
    // 创建新的 Pinia 实例
    pinia = createPinia()
    setActivePinia(pinia)
  })

  it('应该正确渲染基本信息', () => {
    const wrapper = mount(XxxCard, {
      global: {
        plugins: [pinia]
      },
      props: {
        item: {
          id: '1',
          title: '测试标题',
          field1: '字段1'
        }
      }
    })

    expect(wrapper.find('.title').text()).toBe('测试标题')
    expect(wrapper.find('.field1').text()).toBe('字段1')
  })

  it('应该响应点击事件', async () => {
    const wrapper = mount(XxxCard, {
      global: {
        plugins: [pinia]
      },
      props: {
        item: {
          id: '1',
          title: '测试'
        }
      }
    })

    await wrapper.find('.card').trigger('click')

    expect(wrapper.emitted('click')).toBeTruthy()
    expect(wrapper.emitted('click')[0][0].id).toBe('1')
  })

  it('条件渲染应该正确工作', () => {
    const wrapper = mount(XxxCard, {
      global: {
        plugins: [pinia]
      },
      props: {
        item: {
          id: '1',
          status: 'active'
        },
        showActions: true
      }
    })

    expect(wrapper.find('.actions').exists()).toBe(true)
  })

  it('计算属性应该正确计算', () => {
    // 测试组件的计算属性
  })
})
```

---

### 3. E2E 测试 (Playwright)

#### 测试文件位置
```
codes/packages/web/e2e/
├── helpers.js         # Mock API 和辅助函数
├── login.spec.js      # 登录流程测试
├── orders.spec.js     # 订单流程测试
├── review.spec.js     # 验收流程测试
└── xxx.spec.js        # 新功能 E2E 测试
```

#### E2E 测试模板
```javascript
// e2e/xxx.spec.js
import { test, expect } from '@playwright/test'
import { setupMockApi, mockData, loginAs, logout } from './helpers.js'

test.describe('XXX 功能 E2E 测试', () => {
  test.beforeEach(async ({ page }) => {
    // 设置 Mock API
    await setupMockApi(page)
  })

  test('未登录用户应该被重定向到登录页', async ({ page }) => {
    await page.goto('/admin/xxx')

    // 应该重定向到登录页
    await expect(page).toHaveURL('/login')
  })

  test('已登录用户可以查看 XXX 列表', async ({ page }) => {
    // 登录
    await loginAs(page, mockData.user)

    // 访问 XXX 列表页
    await page.goto('/admin/xxx')

    // 验证页面标题
    await expect(page.locator('.van-nav-bar__title')).toHaveText('XXX管理')

    // 验证列表渲染
    const items = page.locator('.xxx-item')
    await expect(items).toHaveCount(2) // 假设 mock 数据有 2 条
  })

  test('应该可以创建新的 XXX', async ({ page }) => {
    await loginAs(page, mockData.user)

    // 访问列表页
    await page.goto('/admin/xxx')

    // 点击创建按钮
    await page.click('text=创建XXX')

    // 填写表单
    await page.fill('[placeholder="请输入字段1"]', '测试字段1')
    await page.fill('[placeholder="请输入字段2"]', 'test@example.com')

    // 提交表单
    await page.click('button:has-text("提交")')

    // 验证成功提示
    await expect(page.locator('.van-toast')).toContainText('创建成功')

    // 应该返回列表页
    await expect(page).toHaveURL('/admin/xxx')
  })

  test('表单验证应该正确工作', async ({ page }) => {
    await loginAs(page, mockData.user)
    await page.goto('/admin/xxx/create')

    // 不填写表单直接提交
    await page.click('button:has-text("提交")')

    // 应该显示验证错误
    await expect(page.locator('.van-field__error-message')).toBeVisible()
  })

  test('应该可以编辑 XXX', async ({ page }) => {
    await loginAs(page, mockData.user)
    await page.goto('/admin/xxx')

    // 点击第一项
    await page.click('.xxx-item:first-child')

    // 进入编辑页
    await expect(page).toHaveURL(/\/admin\/xxx\/[^/]+/)

    // 点击编辑按钮
    await page.click('text=编辑')

    // 修改字段
    await page.fill('[placeholder="请输入字段1"]', '修改后的字段1')

    // 提交
    await page.click('button:has-text("保存")')

    // 验证成功提示
    await expect(page.locator('.van-toast')).toContainText('保存成功')
  })

  test('应该可以删除 XXX', async ({ page }) => {
    await loginAs(page, mockData.user)
    await page.goto('/admin/xxx')

    // 点击删除按钮
    await page.click('.xxx-item:first-child .delete-btn')

    // 确认删除
    await page.click('.van-dialog__confirm')

    // 验证成功提示
    await expect(page.locator('.van-toast')).toContainText('删除成功')
  })

  test('完整业务流程测试', async ({ page }) => {
    // 测试从创建到删除的完整流程
    await loginAs(page, mockData.user)

    // 1. 创建
    await page.goto('/admin/xxx/create')
    await page.fill('[placeholder="请输入字段1"]', '完整流程测试')
    await page.click('button:has-text("提交")')
    await expect(page.locator('.van-toast')).toContainText('创建成功')

    // 2. 查看列表
    await expect(page).toHaveURL('/admin/xxx')
    await expect(page.locator('text=完整流程测试')).toBeVisible()

    // 3. 查看详情
    await page.click('text=完整流程测试')
    await expect(page.locator('.detail-field1')).toHaveText('完整流程测试')

    // 4. 编辑
    await page.click('text=编辑')
    await page.fill('[placeholder="请输入字段1"]', '编辑后的内容')
    await page.click('button:has-text("保存")')

    // 5. 验证编辑结果
    await expect(page.locator('.detail-field1')).toHaveText('编辑后的内容')

    // 6. 删除
    await page.click('.delete-btn')
    await page.click('.van-dialog__confirm')
    await expect(page.locator('.van-toast')).toContainText('删除成功')
  })
})
```

---

## 测试运行命令

### 后端测试
```bash
cd codes

# 运行后端单元测试
pnpm test:server

# 运行后端测试并生成覆盖率
pnpm --filter @yuefa/server test:coverage

# 运行特定测试文件
pnpm --filter @yuefa/server vitest src/tests/xxx.test.js

# Watch 模式 (开发时使用)
pnpm --filter @yuefa/server vitest --watch
```

### 前端单元测试
```bash
# 运行前端单元测试
pnpm test:web

# 运行并生成覆盖率
pnpm --filter @yuefa/web test:coverage

# UI 模式 (可视化测试结果)
pnpm --filter @yuefa/web test:ui

# Watch 模式
pnpm --filter @yuefa/web vitest --watch
```

### E2E 测试
```bash
# 运行 E2E 测试
pnpm test:e2e

# UI 模式 (可视化调试)
pnpm --filter @yuefa/web test:e2e:ui

# 带浏览器界面运行
pnpm --filter @yuefa/web test:e2e:headed

# 调试模式
pnpm --filter @yuefa/web test:e2e:debug

# 运行特定测试文件
pnpm --filter @yuefa/web playwright test e2e/xxx.spec.js
```

### 运行全部测试
```bash
# 运行所有测试 (单元 + E2E)
pnpm test
```

---

## 测试编写最佳实践

### 1. 测试数据隔离
- 每个测试使用唯一的测试数据 (手机号、slug 等)
- 使用 `beforeEach` 初始化测试数据
- 测试后自动清理 (setup.js 中配置)

### 2. 测试覆盖范围
- **正常场景**: 功能正常工作
- **边界场景**: 空数据、最大值、最小值
- **异常场景**: 错误输入、权限不足、资源不存在
- **业务场景**: 复杂的业务流程

### 3. 测试命名规范
```javascript
// ✅ 好的命名: 描述清晰的行为和预期
it('应该在用户未登录时返回 401 错误', async () => {})
it('应该正确计算订单的定金和尾款', async () => {})

// ❌ 不好的命名: 过于简单
it('测试登录', async () => {})
it('测试订单', async () => {})
```

### 4. 断言充分
```javascript
// ✅ 充分的断言
expect(res.status).toBe(200)
expect(res.body.code).toBe(0)
expect(res.body.data.id).toBeDefined()
expect(res.body.data.created_at).toBeDefined()
expect(res.body.data).toMatchObject({
  field1: 'value1',
  field2: 'value2'
})

// ❌ 不充分的断言
expect(res.status).toBe(200)
```

### 5. Mock 外部依赖
- Mock 第三方服务 (OSS、短信)
- Mock 时间相关函数 (如需要)
- E2E 测试中 Mock 所有 API 请求

---

## 测试检查清单

### 单元测试检查
- [ ] 测试文件已创建 (`xxx.test.js` 或 `Xxx.spec.js`)
- [ ] 测试数据唯一 (避免冲突)
- [ ] 覆盖正常场景
- [ ] 覆盖异常场景 (400/401/403/404)
- [ ] 覆盖边界场景
- [ ] 断言充分
- [ ] 测试通过 (`pnpm test`)

### E2E 测试检查
- [ ] 关键业务流程有 E2E 测试
- [ ] Mock API 完整
- [ ] 测试用户交互 (点击、输入)
- [ ] 测试页面跳转
- [ ] 测试错误提示
- [ ] 测试成功提示
- [ ] 测试通过 (`pnpm test:e2e`)

---

## 常见问题

### Q1: 测试数据冲突怎么办？
A: 为每个测试使用唯一的数据。例如:
- 手机号: `138001380XX` (XX 为测试编号)
- Slug: `test_module_user_1`

### Q2: 如何测试需要登录的接口？
A: 在 `beforeEach` 中创建用户并登录获取 token，然后在请求中携带:
```javascript
.set('Authorization', `Bearer ${token}`)
```

### Q3: E2E 测试太慢怎么办？
A:
- 只为关键业务流程编写 E2E 测试
- 大部分逻辑用单元测试覆盖
- 使用 Mock API 加速测试

### Q4: 如何调试失败的 E2E 测试？
A: 使用以下命令:
```bash
# UI 模式: 可视化调试
pnpm test:e2e:ui

# Headed 模式: 看到浏览器操作
pnpm test:e2e:headed

# Debug 模式: 单步调试
pnpm test:e2e:debug
```

---

## 相关文档

- [测试编写规范详细文档](../../YueFa-docs/standards/testing.md)
- [代码编写规范](/code)
- [CI/CD 预检查](/ci-check)
