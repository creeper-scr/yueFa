import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright 配置
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  // 测试超时时间
  timeout: 30 * 1000,
  // expect 超时时间
  expect: {
    timeout: 5000
  },
  // 完整并行
  fullyParallel: true,
  // 禁止 test.only 在 CI 中运行
  forbidOnly: !!process.env.CI,
  // 失败重试次数
  retries: process.env.CI ? 2 : 0,
  // 并发数
  workers: process.env.CI ? 1 : undefined,
  // 报告器
  reporter: 'html',
  // 全局设置
  use: {
    // 基础 URL
    baseURL: 'http://localhost:3000',
    // 收集失败测试的追踪
    trace: 'on-first-retry',
    // 截图
    screenshot: 'only-on-failure',
    // 视频
    video: 'retain-on-failure',
  },

  // 配置项目 - 只使用 Chromium
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Mobile Chrome
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  // 启动开发服务器（前端和后端）
  webServer: [
    {
      command: 'pnpm --filter @yuefa/server dev',
      url: 'http://localhost:4000/api/health',
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
      cwd: '../..',
    },
    {
      command: 'pnpm dev',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
  ],
})
