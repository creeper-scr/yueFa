/**
 * E2E 测试辅助工具
 */

/**
 * Mock API 响应数据
 */
export const mockData = {
  // 用户数据
  user: {
    id: 'test-user-id',
    phone: '138****0000',
    nickname: '测试毛娘',
    slug: 'test-shop',
    avatar_url: null,
    wechat_id: 'test_wechat',
    announcement: '欢迎来到测试店铺',
    accepting_orders: true,
  },

  // 作品数据
  works: [
    {
      id: 'work-1',
      title: '测试作品1',
      character_name: '初音未来',
      source_work: 'VOCALOID',
      cover_url: 'https://via.placeholder.com/300x400/FF6B6B/ffffff?text=Work1',
      images: ['https://via.placeholder.com/600x800/FF6B6B/ffffff?text=Work1-1'],
      is_pinned: true,
      display_order: 1,
    },
    {
      id: 'work-2',
      title: '测试作品2',
      character_name: '洛天依',
      source_work: 'VOCALOID',
      cover_url: 'https://via.placeholder.com/300x400/6B8EFF/ffffff?text=Work2',
      images: ['https://via.placeholder.com/600x800/6B8EFF/ffffff?text=Work2-1'],
      is_pinned: false,
      display_order: 2,
    },
  ],

  // 订单数据
  orders: [
    {
      id: 'order-1',
      character_name: '初音未来',
      source_work: 'VOCALOID',
      status: 'pending_deposit',
      price: 500,
      deposit: 200,
      created_at: new Date().toISOString(),
    },
    {
      id: 'order-2',
      character_name: '洛天依',
      source_work: 'VOCALOID',
      status: 'in_production',
      price: 600,
      deposit: 300,
      created_at: new Date(Date.now() - 86400000).toISOString(),
    },
  ],

  // 订单统计
  orderStats: {
    pending_deposit: 1,
    in_production: 1,
    pending_ship: 0,
    completed: 0,
    total: 2,
  },
}

/**
 * 设置 Mock API 响应
 */
export async function setupMockApi(page) {
  // Mock 发送验证码
  await page.route('**/api/v1/auth/sms/send', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 0,
        message: 'success',
        data: { code: '123456' }, // 开发环境返回验证码
      }),
    })
  })

  // Mock 登录
  await page.route('**/api/v1/auth/login', async (route) => {
    const body = route.request().postDataJSON()
    if (body.code === '123456') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 0,
          message: 'success',
          data: {
            token: 'test-jwt-token',
            user: mockData.user,
          },
        }),
      })
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 1002,
          message: '验证码错误',
        }),
      })
    }
  })

  // Mock 获取当前用户
  await page.route('**/api/v1/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 0,
        data: mockData.user,
      }),
    })
  })

  // Mock 获取用户 profile
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
          data: mockData.user,
        }),
      })
    } else {
      await route.continue()
    }
  })

  // Mock 获取公开用户信息 (根据 slug)
  await page.route('**/api/v1/users/test-shop', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 0,
        data: mockData.user,
      }),
    })
  })

  // Mock 获取公开作品
  await page.route('**/api/v1/users/test-shop/works', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 0,
        data: mockData.works,
      }),
    })
  })

  // Mock 获取我的作品
  await page.route('**/api/v1/works', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 0,
          data: mockData.works,
        }),
      })
    } else {
      await route.continue()
    }
  })

  // Mock 获取订单列表 (需要匹配带查询参数的请求)
  await page.route('**/api/v1/orders?**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 0,
        data: {
          list: mockData.orders,
          pagination: {
            page: 1,
            limit: 20,
            total: mockData.orders.length,
          },
          statusCount: mockData.orderStats,
        },
      }),
    })
  })

  // Mock 获取订单统计
  await page.route('**/api/v1/orders/stats', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 0,
        data: mockData.orderStats,
      }),
    })
  })

  // Mock 提交询价和获取询价列表 (需要匹配带查询参数的请求)
  await page.route('**/api/v1/inquiries**', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 0,
          message: '询价提交成功',
          data: { id: 'inquiry-1' },
        }),
      })
    } else if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 0,
          data: {
            list: [],
            pagination: { page: 1, limit: 20, total: 0 },
          },
        }),
      })
    } else {
      await route.continue()
    }
  })
}

/**
 * 模拟已登录状态
 * 需要先导航到一个页面后才能使用 localStorage
 */
export async function loginAs(page, user = mockData.user) {
  // 先导航到登录页面以获取同源上下文
  await page.goto('/login')
  // 然后设置 localStorage
  await page.evaluate((userData) => {
    localStorage.setItem('token', 'test-jwt-token')
    localStorage.setItem('user', JSON.stringify(userData))
  }, user)
}

/**
 * 清除登录状态
 */
export async function logout(page) {
  await page.evaluate(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  })
}
