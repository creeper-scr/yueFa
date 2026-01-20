import { test, expect } from '@playwright/test'
import { setupMockApi, mockData } from './helpers.js'

/**
 * 验收流程 E2E 测试 (PRD R-01/R-02)
 * 测试客户端验收专用页的完整流程
 */
test.describe('验收流程 (PRD R-01)', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockApi(page)
  })

  test('应该正确显示验收页面内容', async ({ page }) => {
    await page.goto('/review/test-review-token-123')

    // 检查页面标题
    await expect(page.locator('.van-nav-bar')).toContainText('验收确认')

    // 检查角色信息
    await expect(page.locator('.character-name')).toHaveText('雷姆')
    await expect(page.locator('.source-work')).toHaveText('Re:Zero')

    // 检查成品展示区域
    await expect(page.locator('.section-title')).toContainText('成品展示')
    await expect(page.locator('.images-grid .van-image')).toHaveCount(3)
  })

  test('应该显示成品描述', async ({ page }) => {
    await page.goto('/review/test-review-token-123')

    await expect(page.locator('.description')).toContainText('成品已完成，请查看360度展示图')
  })

  test('未验收时应该显示两个操作按钮', async ({ page }) => {
    await page.goto('/review/test-review-token-123')

    // 检查确认满意按钮
    await expect(page.getByRole('button', { name: /确认满意/ })).toBeVisible()

    // 检查申请修改按钮（包含剩余次数）
    await expect(page.getByRole('button', { name: /申请修改.*剩余2次/ })).toBeVisible()
  })

  test('已验收通过时应该显示成功状态', async ({ page }) => {
    await page.goto('/review/test-review-token-approved')

    // 检查成功状态
    await expect(page.locator('.approved-status')).toBeVisible()
    await expect(page.locator('.approved-status')).toContainText('验收已通过')
    await expect(page.locator('.approved-status')).toContainText('请联系毛娘支付尾款')

    // 不应该显示操作按钮
    await expect(page.locator('.action-buttons')).not.toBeVisible()
  })

  test('链接无效时应该显示错误状态', async ({ page }) => {
    await page.goto('/review/invalid-token')

    await expect(page.locator('.van-empty')).toBeVisible()
    await expect(page.locator('.van-empty')).toContainText('链接无效或已过期')
  })
})

test.describe('验收操作 (PRD R-01)', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockApi(page)
  })

  test('点击确认满意应该成功完成验收', async ({ page }) => {
    await page.goto('/review/test-review-token-123')

    // 点击确认满意
    await page.getByRole('button', { name: /确认满意/ }).click()

    // 检查成功提示
    await expect(page.getByText('感谢确认')).toBeVisible()

    // 页面状态应该更新为已通过
    await expect(page.locator('.approved-status')).toBeVisible()
  })

  test('点击申请修改应该打开弹窗', async ({ page }) => {
    await page.goto('/review/test-review-token-123')

    // 点击申请修改
    await page.getByRole('button', { name: /申请修改/ }).click()

    // 检查弹窗出现
    await expect(page.locator('.van-dialog')).toBeVisible()
    await expect(page.getByText('申请修改')).toBeVisible()
  })

  test('提交修改意见应该成功', async ({ page }) => {
    await page.goto('/review/test-review-token-123')

    // 点击申请修改
    await page.getByRole('button', { name: /申请修改/ }).click()

    // 填写修改意见
    await page.locator('.van-dialog textarea').fill('刘海希望再剪短一点')

    // 点击确认按钮
    await page.locator('.van-dialog button:has-text("确认")').click()

    // 检查成功提示
    await expect(page.getByText('修改请求已提交')).toBeVisible()
  })
})

test.describe('修改记录显示 (PRD R-02)', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockApi(page)
  })

  test('应该显示修改记录历史', async ({ page }) => {
    await page.goto('/review/test-review-token-revision')

    // 检查修改记录区域
    await expect(page.locator('.revisions-section')).toBeVisible()
    await expect(page.locator('.section-title')).toContainText('修改记录')

    // 检查修改内容
    await expect(page.locator('.revision-item')).toBeVisible()
    await expect(page.locator('.revision-num')).toContainText('第1次修改')
    await expect(page.locator('.revision-request')).toContainText('刘海希望再剪短一点')
  })

  test('已处理的修改应该显示已处理标签', async ({ page }) => {
    await page.goto('/review/test-review-token-revision')

    // 检查状态标签
    await expect(page.locator('.revision-item .van-tag')).toContainText('已处理')
  })

  test('修改后仍可继续申请修改(如果次数未用完)', async ({ page }) => {
    await page.goto('/review/test-review-token-revision')

    // 已用1次，剩余1次
    await expect(page.getByRole('button', { name: /申请修改.*剩余1次/ })).toBeVisible()
  })
})

test.describe('图片查看', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockApi(page)
  })

  test('点击图片应该可以预览', async ({ page }) => {
    await page.goto('/review/test-review-token-123')

    // 点击第一张图片
    await page.locator('.images-grid .van-image').first().click()

    // 检查预览弹窗
    await expect(page.locator('.van-image-preview')).toBeVisible()
  })
})
