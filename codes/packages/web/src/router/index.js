import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  // 客户端页面
  {
    path: '/s/:slug',
    name: 'PublicPage',
    component: () => import('@/views/client/PublicPage.vue'),
    meta: { title: '毛娘主页' }
  },
  // 客户端验收页面 (PRD R-01)
  {
    path: '/review/:token',
    name: 'ReviewPage',
    component: () => import('@/views/client/ReviewPage.vue'),
    meta: { title: '验收确认' }
  },

  // 管理端页面
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/admin/Login.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/admin',
    redirect: '/admin/orders'
  },
  {
    path: '/admin/profile',
    name: 'Profile',
    component: () => import('@/views/admin/Profile.vue'),
    meta: { title: '主页编辑', requiresAuth: true }
  },
  {
    path: '/admin/works',
    name: 'Works',
    component: () => import('@/views/admin/Works.vue'),
    meta: { title: '作品管理', requiresAuth: true }
  },
  {
    path: '/admin/orders',
    name: 'Orders',
    component: () => import('@/views/admin/Orders.vue'),
    meta: { title: '订单管理', requiresAuth: true }
  },
  {
    path: '/admin/orders/:id',
    name: 'OrderDetail',
    component: () => import('@/views/admin/OrderDetail.vue'),
    meta: { title: '订单详情', requiresAuth: true }
  },
  // 创建验收页面 (毛娘端 PRD R-01)
  {
    path: '/admin/orders/:id/review',
    name: 'CreateReview',
    component: () => import('@/views/admin/CreateReview.vue'),
    meta: { title: '创建验收', requiresAuth: true }
  },

  // 默认重定向
  {
    path: '/',
    redirect: '/login'
  },

  // 404
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  document.title = to.meta.title ? `${to.meta.title} - 约发` : '约发 YueFa'

  // 检查是否需要认证
  if (to.meta.requiresAuth) {
    const token = localStorage.getItem('token')
    if (!token) {
      next({ name: 'Login', query: { redirect: to.fullPath } })
      return
    }
  }

  next()
})

export default router
