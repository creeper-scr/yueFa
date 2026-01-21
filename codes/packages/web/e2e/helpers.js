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
    accepting_orders: true
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
      display_order: 1
    },
    {
      id: 'work-2',
      title: '测试作品2',
      character_name: '洛天依',
      source_work: 'VOCALOID',
      cover_url: 'https://via.placeholder.com/300x400/6B8EFF/ffffff?text=Work2',
      images: ['https://via.placeholder.com/600x800/6B8EFF/ffffff?text=Work2-1'],
      is_pinned: false,
      display_order: 2
    }
  ],

  // 订单数据 (PRD 2.0 九状态)
  orders: [
    {
      id: 'order-1',
      customer_name: '测试客户1',
      character_name: '初音未来',
      source_work: 'VOCALOID',
      status: 'pending_deposit',
      price: 500,
      deposit: 100,
      balance: 400,
      wig_source: 'client_sends',
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      created_at: new Date().toISOString()
    },
    {
      id: 'order-2',
      customer_name: '测试客户2',
      character_name: '洛天依',
      source_work: 'VOCALOID',
      status: 'in_progress',
      price: 600,
      deposit: 120,
      balance: 480,
      wig_source: 'stylist_buys',
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      created_at: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: 'order-3',
      customer_name: '测试客户3',
      character_name: '雷姆',
      source_work: 'Re:Zero',
      status: 'in_review',
      price: 450,
      deposit: 90,
      balance: 360,
      wig_source: 'client_sends',
      deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      created_at: new Date(Date.now() - 86400000 * 3).toISOString()
    }
  ],

  // 订单统计 (PRD B-01)
  orderStats: {
    pending_quote: 0,
    pending_deposit: 1,
    awaiting_wig_base: 0,
    queued: 0,
    in_progress: 1,
    in_review: 1,
    pending_balance: 0,
    shipped: 0,
    completed: 0,
    total: 3
  },

  // 死线预警 (PRD B-02)
  deadlineAlerts: [
    {
      id: 'order-3',
      character_name: '雷姆',
      deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      daysLeft: 3,
      level: 'red'
    }
  ],

  // 验收数据 (PRD R-01/R-02)
  reviews: {
    pending: {
      id: 'review-1',
      order_id: 'order-3',
      order: {
        character_name: '雷姆',
        source_work: 'Re:Zero'
      },
      images: [
        'https://via.placeholder.com/600x800/FF6B6B/ffffff?text=Review1',
        'https://via.placeholder.com/600x800/6B8EFF/ffffff?text=Review2',
        'https://via.placeholder.com/600x800/6BFF8E/ffffff?text=Review3'
      ],
      description: '成品已完成，请查看360度展示图',
      review_token: 'test-review-token-123',
      review_url: 'http://localhost:3000/review/test-review-token-123',
      is_approved: false,
      max_revisions: 2,
      revision_count: 0,
      revisions: [],
      created_at: new Date().toISOString()
    },
    approved: {
      id: 'review-2',
      order_id: 'order-2',
      order: {
        character_name: '洛天依',
        source_work: 'VOCALOID'
      },
      images: ['https://via.placeholder.com/600x800/FF6B6B/ffffff?text=Approved1'],
      description: '制作完成',
      review_token: 'test-review-token-approved',
      is_approved: true,
      approved_at: new Date().toISOString(),
      max_revisions: 2,
      revision_count: 0,
      revisions: []
    },
    withRevisions: {
      id: 'review-3',
      order_id: 'order-4',
      order: {
        character_name: '蕾姆',
        source_work: 'Re:Zero'
      },
      images: ['https://via.placeholder.com/600x800/FF6B6B/ffffff?text=Revision1'],
      description: '修改后的成品',
      review_token: 'test-review-token-revision',
      is_approved: false,
      max_revisions: 2,
      revision_count: 1,
      revisions: [
        {
          revision_number: 1,
          request_content: '刘海希望再剪短一点',
          request_images: [],
          requested_at: new Date(Date.now() - 86400000).toISOString(),
          response_images: [],
          response_notes: '已按要求修改刘海',
          completed_at: new Date().toISOString(),
          is_satisfied: null
        }
      ]
    }
  },

  // 询价数据
  inquiries: [
    {
      id: 'inquiry-1',
      customer_name: '询价客户1',
      customer_contact: 'wx: customer1',
      character_name: '初音未来',
      source_work: 'VOCALOID',
      wig_source: 'client_sends',
      head_circumference: '56cm',
      head_notes: '头型正常',
      special_requirements: '需要双马尾支撑',
      budget_range: '400-600',
      status: 'new',
      created_at: new Date().toISOString()
    }
  ]
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
        data: { code: '123456' } // 开发环境返回验证码
      })
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
            user: mockData.user
          }
        })
      })
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 1002,
          message: '验证码错误'
        })
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
        data: mockData.user
      })
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
          data: mockData.user
        })
      })
    } else if (route.request().method() === 'PUT') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 0,
          message: '保存成功',
          data: mockData.user
        })
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
        data: mockData.user
      })
    })
  })

  // Mock 获取公开作品
  await page.route('**/api/v1/users/test-shop/works', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 0,
        data: mockData.works
      })
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
          data: mockData.works
        })
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
            total: mockData.orders.length
          },
          statusCount: mockData.orderStats,
          deadlineAlerts: mockData.deadlineAlerts
        }
      })
    })
  })

  // Mock 获取订单统计
  await page.route('**/api/v1/orders/stats', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 0,
        data: mockData.orderStats
      })
    })
  })

  // Mock 订单状态更新操作
  await page.route('**/api/v1/orders/*/status', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 0,
        message: '状态已更新'
      })
    })
  })

  // Mock 确认定金
  await page.route('**/api/v1/orders/*/deposit', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 0,
        message: '定金已确认',
        data: { status: 'awaiting_wig_base' }
      })
    })
  })

  // Mock 确认毛坯收货
  await page.route('**/api/v1/orders/*/wig-received', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 0,
        message: '毛坯已确认收货',
        data: { status: 'queued' }
      })
    })
  })

  // Mock 发货
  await page.route('**/api/v1/orders/*/ship', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 0,
        message: '已发货',
        data: { status: 'shipped' }
      })
    })
  })

  // PRD R-01/R-02 验收相关 API
  // Mock 根据 token 获取验收详情 (客户端)
  await page.route('**/api/v1/reviews/token/*', async (route) => {
    const url = route.request().url()
    if (url.includes('test-review-token-123')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 0,
          data: mockData.reviews.pending
        })
      })
    } else if (url.includes('test-review-token-approved')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 0,
          data: mockData.reviews.approved
        })
      })
    } else if (url.includes('test-review-token-revision')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 0,
          data: mockData.reviews.withRevisions
        })
      })
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 1,
          message: '链接无效'
        })
      })
    }
  })

  // Mock 客户确认满意
  await page.route('**/api/v1/reviews/*/approve', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 0,
        message: '验收已确认',
        data: { is_approved: true }
      })
    })
  })

  // Mock 客户申请修改
  await page.route('**/api/v1/reviews/*/revision', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 0,
          message: '修改请求已提交',
          data: {
            revision_number: 1,
            remaining_revisions: 1
          }
        })
      })
    } else {
      await route.continue()
    }
  })

  // Mock 创建验收 (毛娘端)
  await page.route('**/api/v1/reviews', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 0,
          message: '验收创建成功',
          data: {
            id: 'new-review-id',
            review_url: 'http://localhost:3000/review/new-token',
            max_revisions: 2
          }
        })
      })
    } else {
      await route.continue()
    }
  })

  // Mock 获取订单的验收记录
  await page.route('**/api/v1/reviews/order/*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 0,
        data: mockData.reviews.pending
      })
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
          data: { id: 'inquiry-1' }
        })
      })
    } else if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 0,
          data: {
            list: [],
            pagination: { page: 1, limit: 20, total: 0 }
          }
        })
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
