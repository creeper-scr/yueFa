import { test, expect } from '@playwright/test'
import { setupMockApi, loginAs, mockData } from './helpers.js'

test.describe('订单管理页面', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockApi(page)
    await loginAs(page)
  })

  test('应该正确显示订单列表页', async ({ page }) => {
    await page.goto('/admin/orders')

    // 检查页面标题
    await expect(page).toHaveTitle(/订单管理/)

    // 检查状态栏 (PRD 2.0: 9种状态 - 待报价、待定金、等毛坯、排单中、制作中、验收中、待尾款、已发货、已完成)
    await expect(page.locator('.status-bar')).toBeVisible()
    await expect(page.locator('.status-item')).toHaveCount(9)
  })

  test('应该显示订单卡片', async ({ page }) => {
    await page.goto('/admin/orders')

    // 等待订单加载 (Mock数据有3个订单)
    await expect(page.locator('.order-card')).toHaveCount(3)
  })

  test('应该能切换订单状态筛选', async ({ page }) => {
    await page.goto('/admin/orders')

    // 切换到待定金
    await page.locator('.status-item').filter({ hasText: '待定金' }).click()
    await expect(page.locator('.status-item').filter({ hasText: '待定金' })).toHaveClass(/active/)

    // 切换到制作中
    await page.locator('.status-item').filter({ hasText: '制作中' }).click()
    await expect(page.locator('.status-item').filter({ hasText: '制作中' })).toHaveClass(/active/)
  })

  test('点击订单卡片应该跳转到详情页', async ({ page }) => {
    await page.goto('/admin/orders')

    // 点击第一个订单
    await page.locator('.order-card').first().click()

    // 验证跳转到详情页
    await expect(page).toHaveURL(/\/admin\/orders\//)
  })

  test('应该显示底部导航栏', async ({ page }) => {
    await page.goto('/admin/orders')

    // 检查底部Tabbar
    await expect(page.locator('.van-tabbar')).toBeVisible()
    await expect(page.locator('.van-tabbar-item')).toHaveCount(3)
  })
})

test.describe('个人资料编辑页面', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockApi(page)
    await loginAs(page)

    // Mock 获取和更新个人资料 (PUT也是/users/profile)
    await page.route('**/api/v1/users/profile', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 0,
            data: mockData.user,
          }),
        })
      } else if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 0,
            message: '保存成功',
            data: { ...mockData.user, ...route.request().postDataJSON() },
          }),
        })
      } else {
        await route.continue()
      }
    })
  })

  test('应该正确显示个人资料表单', async ({ page }) => {
    await page.goto('/admin/profile')

    // 检查表单字段 (使用 placeholder 定位，因为 Vant 的 label 是通过 aria-labelledby 关联的)
    await expect(page.getByPlaceholder('店铺名称（如：XXX发艺工作室）')).toBeVisible()
    await expect(page.getByPlaceholder('链接后缀（如: my-shop）')).toBeVisible()
    await expect(page.getByPlaceholder('微信号/QQ（方便客户联系）')).toBeVisible()
    await expect(page.getByPlaceholder('输入店铺公告...')).toBeVisible()
  })

  test('应该预填充用户数据', async ({ page }) => {
    await page.goto('/admin/profile')

    // 等待数据加载
    await page.waitForTimeout(500)

    // 验证数据预填充 (使用 placeholder 定位)
    await expect(page.getByPlaceholder('店铺名称（如：XXX发艺工作室）')).toHaveValue('测试毛娘')
    await expect(page.getByPlaceholder('链接后缀（如: my-shop）')).toHaveValue('test-shop')
    await expect(page.getByPlaceholder('微信号/QQ（方便客户联系）')).toHaveValue('test_wechat')
  })

  test('应该能编辑并保存资料', async ({ page }) => {
    await page.goto('/admin/profile')

    // 等待数据加载
    await page.waitForTimeout(500)

    // 修改店铺名称 (使用 placeholder 定位)
    await page.getByPlaceholder('店铺名称（如：XXX发艺工作室）').clear()
    await page.getByPlaceholder('店铺名称（如：XXX发艺工作室）').fill('新店铺名称')

    // 保存
    await page.getByRole('button', { name: '保存' }).click()

    // 检查成功提示
    await expect(page.getByText('保存成功')).toBeVisible()
  })

  test('应该显示分享链接区域', async ({ page }) => {
    await page.goto('/admin/profile')

    // 等待数据加载
    await page.waitForTimeout(500)

    // 检查分享链接区域
    await expect(page.getByText('我的主页链接')).toBeVisible()
  })
})

test.describe('作品管理页面', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockApi(page)
    await loginAs(page)
  })

  test('应该正确显示作品列表', async ({ page }) => {
    await page.goto('/admin/works')

    // 检查作品列表
    await expect(page.locator('.work-item')).toHaveCount(2)
  })

  test('应该有添加作品图标', async ({ page }) => {
    await page.goto('/admin/works')

    // 检查添加图标 (在导航栏右侧)
    await expect(page.locator('.van-nav-bar__right .van-icon')).toBeVisible()
  })

  test('点击添加图标应该显示对话框', async ({ page }) => {
    await page.goto('/admin/works')

    // 点击添加图标
    await page.locator('.van-nav-bar__right .van-icon').click()

    // 应该显示对话框
    await expect(page.locator('.van-dialog')).toBeVisible()
    await expect(page.getByText('添加作品')).toBeVisible()
  })
})

test.describe('底部导航', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockApi(page)
    await loginAs(page)
  })

  test('应该能通过底部导航切换页面', async ({ page }) => {
    await page.goto('/admin/orders')

    // 点击作品Tab
    await page.locator('.van-tabbar-item').filter({ hasText: '作品' }).click()
    await expect(page).toHaveURL(/\/admin\/works/)

    // 点击主页Tab
    await page.locator('.van-tabbar-item').filter({ hasText: '主页' }).click()
    await expect(page).toHaveURL(/\/admin\/profile/)

    // 点击订单Tab
    await page.locator('.van-tabbar-item').filter({ hasText: '订单' }).click()
    await expect(page).toHaveURL(/\/admin\/orders/)
  })

  test('当前页面对应的Tab应该高亮', async ({ page }) => {
    await page.goto('/admin/orders')

    // 订单Tab应该高亮
    await expect(
      page.locator('.van-tabbar-item').filter({ hasText: '订单' })
    ).toHaveClass(/van-tabbar-item--active/)
  })
})

test.describe('订单详情页面', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockApi(page)
    await loginAs(page)

    // Mock 获取订单详情
    await page.route('**/api/v1/orders/*', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 0,
            data: {
              id: 'order-1',
              character_name: '初音未来',
              source_work: 'VOCALOID',
              customer_name: '客户A',
              customer_contact: '微信: customer123',
              status: 'pending_deposit',
              price: 500,
              deposit: 200,
              requirements: '蓝色双马尾，长度到腰部',
              reference_images: [],
              notes: [],
              created_at: new Date().toISOString(),
            },
          }),
        })
      } else {
        await route.continue()
      }
    })
  })

  test('应该正确显示订单详情', async ({ page }) => {
    await page.goto('/admin/orders/order-1')

    // 检查订单信息
    await expect(page.getByText('初音未来')).toBeVisible()
    await expect(page.getByText('VOCALOID')).toBeVisible()
    await expect(page.getByText('客户A')).toBeVisible()
  })

  test('应该显示订单状态操作按钮', async ({ page }) => {
    await page.goto('/admin/orders/order-1')

    // 检查状态操作区域 (class是action-bar)
    await expect(page.locator('.action-bar')).toBeVisible()
  })

  test('应该有返回按钮', async ({ page }) => {
    await page.goto('/admin/orders/order-1')

    // 检查返回按钮
    await expect(page.locator('.van-nav-bar__left')).toBeVisible()
  })
})
