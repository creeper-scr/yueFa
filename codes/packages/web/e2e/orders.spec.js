import { test, expect } from '@playwright/test'
import { setupMockApi, loginAs, mockData } from './helpers.js'

/**
 * 订单状态流转 E2E 测试 (PRD 2.0 九状态)
 * 测试毛娘管理端的订单状态流转功能
 */
test.describe('订单列表与状态统计 (PRD B-01)', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockApi(page)
    await loginAs(page)
  })

  test('应该显示订单列表页面', async ({ page }) => {
    await page.goto('/admin/orders')

    // 检查页面标题
    await expect(page.locator('.van-nav-bar')).toContainText('订单管理')

    // 检查订单卡片存在
    await expect(page.locator('.order-card')).toHaveCount(3)
  })

  test('应该显示状态统计栏 (PRD B-01 九状态)', async ({ page }) => {
    await page.goto('/admin/orders')

    // 检查状态栏存在
    await expect(page.locator('.status-bar')).toBeVisible()

    // 检查各状态项
    await expect(page.locator('.status-item')).toHaveCount(9) // 全部 + 8个状态
  })

  test('点击状态应该筛选订单', async ({ page }) => {
    await page.goto('/admin/orders')

    // 点击"制作中"状态
    await page.locator('.status-item:has-text("制作中")').click()

    // 验证状态被选中
    await expect(page.locator('.status-item:has-text("制作中")')).toHaveClass(/active/)
  })
})

test.describe('死线预警 (PRD B-02)', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockApi(page)
    await loginAs(page)
  })

  test('应该显示死线预警通知', async ({ page }) => {
    await page.goto('/admin/orders')

    // 检查预警通知栏
    await expect(page.locator('.van-notice-bar:has-text("即将到期")')).toBeVisible()
  })

  test('点击预警应该显示详情', async ({ page }) => {
    await page.goto('/admin/orders')

    // 点击预警通知
    await page.locator('.van-notice-bar:has-text("即将到期")').click()

    // 检查弹窗显示
    await expect(page.locator('.van-dialog')).toBeVisible()
    await expect(page.locator('.van-dialog')).toContainText('死线预警')
  })
})

test.describe('订单状态操作', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockApi(page)
    await loginAs(page)
  })

  test('待定金状态应该显示确认定金按钮', async ({ page }) => {
    await page.goto('/admin/orders')

    // 找到待定金的订单卡片
    const orderCard = page.locator('.order-card:has-text("待定金")').first()
    await expect(orderCard).toBeVisible()

    // 检查确认定金按钮
    await expect(orderCard.getByRole('button', { name: '确认定金' })).toBeVisible()
  })

  test('点击确认定金应该打开弹窗', async ({ page }) => {
    await page.goto('/admin/orders')

    // 找到待定金订单并点击确认定金
    const orderCard = page.locator('.order-card:has-text("待定金")').first()
    await orderCard.getByRole('button', { name: '确认定金' }).click()

    // 检查弹窗出现
    await expect(page.locator('.van-dialog:has-text("确认定金")')).toBeVisible()
  })

  test('制作中状态应该显示提交验收按钮', async ({ page }) => {
    await page.goto('/admin/orders')

    // 找到制作中的订单卡片
    const orderCard = page.locator('.order-card:has-text("制作中")').first()
    await expect(orderCard).toBeVisible()

    // 检查提交验收按钮
    await expect(orderCard.getByRole('button', { name: '提交验收' })).toBeVisible()
  })

  test('验收中状态应该显示查看验收按钮', async ({ page }) => {
    await page.goto('/admin/orders')

    // 找到验收中的订单卡片
    const orderCard = page.locator('.order-card:has-text("验收中")').first()
    await expect(orderCard).toBeVisible()

    // 检查查看验收按钮
    await expect(orderCard.getByRole('button', { name: '查看验收' })).toBeVisible()
  })
})

test.describe('订单卡片显示 (PRD UI/UX)', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockApi(page)
    await loginAs(page)
  })

  test('应该显示毛坯来源信息', async ({ page }) => {
    await page.goto('/admin/orders')

    // 检查客户寄毛坯
    await expect(page.locator('.order-card').first()).toContainText('客户寄')

    // 检查代购
    await expect(page.locator('.order-card:has-text("洛天依")')).toContainText('代购')
  })

  test('应该显示订单价格', async ({ page }) => {
    await page.goto('/admin/orders')

    await expect(page.locator('.order-card').first()).toContainText('¥500')
  })

  test('应该显示截止日期', async ({ page }) => {
    await page.goto('/admin/orders')

    // 日期应该以 月/日 格式显示
    const datePattern = /\d{1,2}\/\d{1,2}/
    await expect(page.locator('.order-card .meta-item').first()).toContainText(datePattern)
  })

  test('点击订单卡片应该跳转到详情页', async ({ page }) => {
    await page.goto('/admin/orders')

    // 点击第一个订单卡片
    await page.locator('.order-card').first().click()

    // 检查 URL 变化
    await expect(page).toHaveURL(/\/admin\/orders\/order-1/)
  })
})

test.describe('询价管理', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockApi(page)
    await loginAs(page)
  })

  test('新询价应该显示通知', async ({ page }) => {
    // 修改 mock 让询价返回数据
    await page.route('**/api/v1/inquiries**', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 0,
            data: {
              list: mockData.inquiries,
              pagination: { page: 1, limit: 20, total: 1 }
            }
          })
        })
      } else {
        await route.continue()
      }
    })

    await page.goto('/admin/orders')

    // 检查询价通知
    await expect(page.locator('.van-notice-bar:has-text("新询价")')).toBeVisible()
    await expect(page.locator('.van-notice-bar:has-text("新询价")')).toContainText('1 条')
  })

  test('点击询价通知应该打开弹窗', async ({ page }) => {
    // 修改 mock
    await page.route('**/api/v1/inquiries**', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 0,
            data: {
              list: mockData.inquiries,
              pagination: { page: 1, limit: 20, total: 1 }
            }
          })
        })
      } else {
        await route.continue()
      }
    })

    await page.goto('/admin/orders')

    // 点击询价通知
    await page.locator('.van-notice-bar:has-text("新询价")').click()

    // 检查弹窗出现
    await expect(page.locator('.van-popup:has-text("新询价")')).toBeVisible()
  })
})
