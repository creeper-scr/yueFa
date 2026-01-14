import { test, expect } from '@playwright/test'
import { setupMockApi, loginAs } from './helpers.js'

test.describe('登录页面', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockApi(page)
  })

  test('应该正确显示登录页面元素', async ({ page }) => {
    await page.goto('/login')

    // 检查页面标题
    await expect(page.locator('.title')).toHaveText('约发')
    await expect(page.locator('.subtitle')).toHaveText('Cosplay假发造型师专属工具')

    // 检查表单元素
    await expect(page.getByLabel('手机号')).toBeVisible()
    await expect(page.getByLabel('验证码')).toBeVisible()
    await expect(page.getByRole('button', { name: '获取验证码' })).toBeVisible()
    await expect(page.getByRole('button', { name: '登录' })).toBeVisible()

    // 检查提示文字
    await expect(page.locator('.login-tip')).toHaveText('未注册的手机号将自动创建账号')
  })

  test('应该验证手机号格式', async ({ page }) => {
    await page.goto('/login')

    // 输入无效手机号
    await page.getByLabel('手机号').fill('12345')
    await page.getByRole('button', { name: '获取验证码' }).click()

    // 检查错误提示 (Vant表单验证显示的消息)
    await expect(page.getByText('手机号格式不正确')).toBeVisible()
  })

  test('应该成功发送验证码', async ({ page }) => {
    await page.goto('/login')

    // 输入有效手机号
    await page.getByLabel('手机号').fill('13800138000')
    await page.getByRole('button', { name: '获取验证码' }).click()

    // 检查成功提示
    await expect(page.getByText('验证码已发送')).toBeVisible()

    // 检查倒计时开始
    await expect(page.getByRole('button', { name: /\d+s/ })).toBeVisible()
  })

  test('应该成功登录并跳转', async ({ page }) => {
    await page.goto('/login')

    // 输入手机号
    await page.getByLabel('手机号').fill('13800138000')

    // 发送验证码（Mock会自动填充验证码到输入框）
    await page.getByRole('button', { name: '获取验证码' }).click()

    // 等待验证码自动填充 (检查输入框有值)
    await expect(page.getByLabel('验证码')).toHaveValue('123456', { timeout: 3000 })

    // 点击登录
    await page.getByRole('button', { name: '登录' }).click()

    // 检查跳转到订单页面 (Toast可能已消失，所以只检查URL)
    await expect(page).toHaveURL(/\/admin\/orders/, { timeout: 10000 })
  })

  test('应该提示验证码错误', async ({ page }) => {
    await page.goto('/login')

    // 输入手机号和错误验证码
    await page.getByLabel('手机号').fill('13800138000')
    await page.getByLabel('验证码').fill('999999')

    // 点击登录
    await page.getByRole('button', { name: '登录' }).click()

    // 检查错误提示
    await expect(page.getByText('验证码错误')).toBeVisible()
  })

  test('已登录用户访问登录页应该不受影响', async ({ page }) => {
    // 设置已登录状态
    await loginAs(page)
    await page.goto('/login')

    // 应该仍然可以访问登录页（可以切换账号）
    await expect(page.locator('.title')).toHaveText('约发')
  })

  test('登录后应该能访问需要认证的页面', async ({ page }) => {
    await page.goto('/login')

    // 执行登录流程
    await page.getByLabel('手机号').fill('13800138000')
    await page.getByRole('button', { name: '获取验证码' }).click()
    await expect(page.getByLabel('验证码')).toHaveValue('123456', { timeout: 3000 })
    await page.getByRole('button', { name: '登录' }).click()

    // 等待跳转
    await page.waitForURL(/\/admin\/orders/, { timeout: 10000 })

    // 验证可以访问订单页面 (使用状态栏作为验证)
    await expect(page.locator('.status-bar')).toBeVisible()
  })
})

test.describe('登录页面 - 路由守卫', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockApi(page)
  })

  test('未登录访问管理页面应该重定向到登录页', async ({ page }) => {
    await page.goto('/admin/orders')

    // 应该被重定向到登录页
    await expect(page).toHaveURL(/\/login/)
  })

  test('未登录访问个人资料页应该重定向到登录页', async ({ page }) => {
    await page.goto('/admin/profile')

    // 应该被重定向到登录页
    await expect(page).toHaveURL(/\/login/)
  })
})
