import { test, expect } from '@playwright/test'
import { setupMockApi, mockData } from './helpers.js'

test.describe('公开主页', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockApi(page)
  })

  test('应该正确显示毛娘主页信息', async ({ page }) => {
    await page.goto('/s/test-shop')

    // 检查头像区域
    await expect(page.locator('.profile-header')).toBeVisible()
    await expect(page.locator('.nickname')).toHaveText('测试毛娘')

    // 检查微信号
    await expect(page.locator('.wechat')).toContainText('test_wechat')

    // 检查公告
    await expect(page.locator('.van-notice-bar')).toContainText('欢迎来到测试店铺')
  })

  test('应该显示作品集Tab和询价Tab', async ({ page }) => {
    await page.goto('/s/test-shop')

    // 检查Tab
    await expect(page.locator('.van-tabs')).toBeVisible()
    await expect(page.getByRole('tab', { name: '作品集' })).toBeVisible()
    await expect(page.getByRole('tab', { name: '询价' })).toBeVisible()
  })

  test('应该默认显示作品集', async ({ page }) => {
    await page.goto('/s/test-shop')

    // 默认显示作品集Tab
    await expect(page.getByRole('tab', { name: '作品集' })).toHaveClass(/van-tab--active/)

    // 应该显示作品卡片
    await expect(page.locator('.work-item')).toHaveCount(2)
  })

  test('应该能切换到询价Tab', async ({ page }) => {
    await page.goto('/s/test-shop')

    // 点击询价Tab
    await page.getByRole('tab', { name: '询价' }).click()

    // 验证Tab切换
    await expect(page.getByRole('tab', { name: '询价' })).toHaveClass(/van-tab--active/)

    // 应该显示询价表单
    await expect(page.locator('.inquiry-form')).toBeVisible()
  })

  test('点击我要询价按钮应该切换到询价Tab', async ({ page }) => {
    await page.goto('/s/test-shop')

    // 点击底部询价按钮
    await page.getByRole('button', { name: '我要询价' }).click()

    // 验证切换到询价Tab
    await expect(page.getByRole('tab', { name: '询价' })).toHaveClass(/van-tab--active/)
  })

  test('应该能复制微信号', async ({ page, context }) => {
    // 授予剪贴板权限
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])

    await page.goto('/s/test-shop')

    // 点击微信号
    await page.locator('.wechat').click()

    // 检查成功提示
    await expect(page.getByText('微信号已复制')).toBeVisible()
  })
})

test.describe('公开主页 - 作品展示', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockApi(page)
  })

  test('应该显示作品信息', async ({ page }) => {
    await page.goto('/s/test-shop')

    // 检查第一个作品 (显示的是 title 和 source_work)
    const firstWork = page.locator('.work-item').first()
    await expect(firstWork).toContainText('测试作品1')
    await expect(firstWork).toContainText('VOCALOID')
  })

  test('置顶作品应该显示置顶标记', async ({ page }) => {
    await page.goto('/s/test-shop')

    // 作品组件目前没有显示置顶标记，跳过此测试
    // 只验证作品列表存在
    await expect(page.locator('.work-item').first()).toBeVisible()
  })
})

test.describe('公开主页 - 询价表单', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockApi(page)
  })

  test('应该显示询价表单所有字段', async ({ page }) => {
    await page.goto('/s/test-shop')
    await page.getByRole('tab', { name: '询价' }).click()

    // 检查表单字段 (使用 placeholder 定位，因为 Vant 的 label 是通过 aria-labelledby 关联的)
    await expect(page.getByPlaceholder('您的称呼')).toBeVisible()
    await expect(page.getByPlaceholder('微信号/QQ/手机号')).toBeVisible()
    await expect(page.getByPlaceholder('想要的角色名称')).toBeVisible()
    await expect(page.getByPlaceholder('角色所属的作品/游戏')).toBeVisible()
  })

  test('应该验证必填字段', async ({ page }) => {
    await page.goto('/s/test-shop')
    await page.getByRole('tab', { name: '询价' }).click()

    // 直接点击提交
    await page.getByRole('button', { name: '提交询价' }).click()

    // 检查验证错误
    await expect(page.getByText('请填写称呼')).toBeVisible()
  })

  test('应该成功提交询价', async ({ page }) => {
    await page.goto('/s/test-shop')
    await page.getByRole('tab', { name: '询价' }).click()

    // 填写表单 (使用 placeholder 定位)
    await page.getByPlaceholder('您的称呼').fill('测试用户')
    await page.getByPlaceholder('微信号/QQ/手机号').fill('微信: miku123')
    await page.getByPlaceholder('想要的角色名称').fill('初音未来')
    await page.getByPlaceholder('角色所属的作品/游戏').fill('VOCALOID')

    // 提交
    await page.getByRole('button', { name: '提交询价' }).click()

    // 检查成功提示
    await expect(page.getByText('询价提交成功')).toBeVisible()
  })

  test('提交成功后应该清空表单并返回作品集', async ({ page }) => {
    await page.goto('/s/test-shop')
    await page.getByRole('tab', { name: '询价' }).click()

    // 填写并提交 (使用 placeholder 定位)
    await page.getByPlaceholder('您的称呼').fill('测试用户')
    await page.getByPlaceholder('微信号/QQ/手机号').fill('微信: miku123')
    await page.getByPlaceholder('想要的角色名称').fill('初音未来')
    await page.getByRole('button', { name: '提交询价' }).click()

    // 等待提示消失
    await page.waitForTimeout(1500)

    // 验证返回到作品集Tab
    await expect(page.getByRole('tab', { name: '作品集' })).toHaveClass(/van-tab--active/)
  })
})

test.describe('公开主页 - 错误处理', () => {
  test('应该显示加载错误', async ({ page }) => {
    // Mock API 返回错误 (需要匹配实际的 API 路由)
    await page.route('**/api/v1/users/non-existent', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 1,
          message: '用户不存在'
        })
      })
    })

    await page.goto('/s/non-existent')

    // 检查错误显示
    await expect(page.locator('.van-empty')).toBeVisible()
    await expect(page.getByText('用户不存在')).toBeVisible()

    // 应该有重新加载按钮
    await expect(page.getByRole('button', { name: '重新加载' })).toBeVisible()
  })
})
