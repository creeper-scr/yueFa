# 前端编码规范

本文档定义了 YueFa 项目前端代码的编写规范和最佳实践。

## 快速参考

更详细的规范请查看 [/code Skill](../../.claude/skills/code.md)。

## 技术栈

- **框架**: Vue 3.4+ (Composition API)
- **构建**: Vite 5
- **UI 库**: Vant 4 (Mobile-first)
- **状态管理**: Pinia 2
- **路由**: Vue Router 4
- **HTTP 客户端**: Axios 1.6
- **样式**: TailwindCSS 3
- **测试**: Vitest + Playwright

## 核心规范

### 1. Vue 组件规范

#### 使用 Composition API
```vue
<script setup>
import { ref, computed, onMounted } from 'vue'

// 推荐使用 <script setup> 语法
const count = ref(0)
const doubled = computed(() => count.value * 2)
</script>
```

#### 组件文件结构
```vue
<script setup>
// 1. 导入
// 2. Props 定义
// 3. Emits 定义
// 4. 响应式数据
// 5. 计算属性
// 6. 方法
// 7. 生命周期钩子
</script>

<template>
  <!-- 模板 -->
</template>

<style scoped>
/* 样式 */
</style>
```

### 2. API 调用规范

#### API 封装位置
```
src/api/
├── request.js      # axios 实例配置
├── auth.js         # 认证相关 API
├── users.js        # 用户相关 API
├── orders.js       # 订单相关 API
└── index.js        # 统一导出
```

#### API 函数格式
```javascript
/**
 * 获取订单列表
 * @param {Object} params - 查询参数
 * @returns {Promise}
 */
export function getOrderList(params) {
  return request.get('/api/v1/orders', { params })
}
```

#### 错误处理
```javascript
try {
  const res = await getOrderList()
  list.value = res.data
} catch (error) {
  showFailToast(error.message || '加载失败')
}
```

### 3. 状态管理规范

```javascript
// src/stores/orders.js
import { defineStore } from 'pinia'

export const useOrderStore = defineStore('orders', {
  state: () => ({
    list: [],
    current: null
  }),

  getters: {
    activeOrders: (state) => state.list.filter(o => o.status === 'active')
  },

  actions: {
    async fetchList(params) {
      const res = await getOrderList(params)
      this.list = res.data
    }
  }
})
```

### 4. 路由配置规范

```javascript
const routes = [
  {
    path: '/admin/orders',
    name: 'AdminOrders',
    component: () => import('@/views/admin/Orders.vue'),
    meta: {
      requiresAuth: true,
      title: '订单管理'
    }
  }
]
```

### 5. 命名规范

#### 文件命名
- **组件**: PascalCase - `OrderCard.vue`
- **工具/hooks**: camelCase - `useOrders.js`
- **样式**: kebab-case - `order-card.css`

#### 代码命名
- **组件名**: PascalCase - `OrderCard`
- **变量/函数**: camelCase - `userName`, `fetchData()`
- **常量**: UPPER_SNAKE_CASE - `API_BASE_URL`
- **Props**: camelCase - `customerId`
- **Events**: kebab-case - `update-order`

### 6. 样式规范

#### 优先使用 TailwindCSS
```vue
<template>
  <div class="flex items-center justify-between px-4 py-2">
    <span class="text-lg font-bold">标题</span>
    <button class="px-3 py-1 bg-blue-500 text-white rounded">
      按钮
    </button>
  </div>
</template>
```

#### Scoped 样式
```vue
<style scoped>
/* 组件特定样式使用 scoped */
.custom-style {
  /* ... */
}
</style>
```

### 7. 安全规范

#### 防止 XSS
```vue
<!-- ✅ 使用文本插值 -->
<div>{{ userInput }}</div>

<!-- ❌ 避免 v-html -->
<div v-html="userInput"></div>
```

#### 敏感数据
```javascript
// ✅ 只存储 token
localStorage.setItem('token', token)

// ❌ 不存储密码
localStorage.setItem('password', password)
```

## 代码质量要求

### 必须遵守
- [ ] ESLint 检查通过
- [ ] 没有 console.log/debugger
- [ ] 没有未使用的变量/导入
- [ ] 错误都有处理
- [ ] 组件有合理的拆分

### 建议遵守
- [ ] 复杂逻辑有注释
- [ ] 公共函数有 JSDoc
- [ ] 组件不超过 200 行
- [ ] 函数不超过 50 行

## 工具配置

### ESLint
```bash
# 运行 lint 检查
pnpm --filter @yuefa/web lint

# 自动修复
pnpm --filter @yuefa/web lint --fix
```

### Vite 配置
```javascript
// vite.config.js
{
  resolve: {
    alias: {
      '@': './src'  // 路径别名
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:4000'  // API 代理
    }
  }
}
```

## 相关资源

- [/code Skill](../../.claude/skills/code.md) - 详细的编码规范
- [/feature Skill](../../.claude/skills/feature.md) - 功能开发流程
- [/test Skill](../../.claude/skills/test.md) - 测试编写规范
- [Vue 3 官方文档](https://cn.vuejs.org/)
- [Vant 4 文档](https://vant-ui.github.io/vant/)
- [TailwindCSS 文档](https://tailwindcss.com/)
