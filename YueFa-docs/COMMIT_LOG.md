# 提交记录

## 2026-01-21 | 16c8f66

**提交信息:** feat: 完成阿里云生产环境部署 - OSS/FC/RDS 全链路配置

### 变更概要

本次提交完成了 YueFa 项目的阿里云生产环境部署，新增 **18 个文件**，实现前后端分离的 Serverless 架构部署。

### 主要内容

#### 1. 部署配置

**新增文件:**
- `codes/s.yaml` - Serverless Devs FC3 部署配置
- `codes/Dockerfile` - Docker 多阶段构建配置
- `codes/docker-compose.yml` - 本地开发容器编排
- `codes/packages/server/index.js` - FC3 HTTP 触发器适配器
- `codes/packages/web/.env.production` - 前端生产环境变量
- `codes/packages/web/.env.staging` - 前端预发布环境变量
- `.github/workflows/ci-cd.yml` - GitHub Actions CI/CD 流水线

**修改文件:**
- `codes/packages/server/src/models/index.js` - 添加 PostgreSQL 支持
- `codes/packages/server/.env.example` - 更新环境变量示例

#### 2. 数据库迁移

**新增文件:**
- `codes/packages/server/src/db/postgres.js` - PostgreSQL 数据库驱动
- `codes/packages/server/src/db/sqlite.js` - SQLite 数据库驱动
- `codes/packages/server/src/db/migrations/001_init.sql` - 数据库初始化脚本
- `codes/packages/server/run-migration.cjs` - 迁移运行脚本

#### 3. 文档

**新增文件:**
- `DEPLOYMENT.md` - 生产环境部署信息（含敏感信息，已加入 .gitignore）

### 部署架构

```
┌─────────────┐     ┌─────────────┐     ┌─────────────────────┐
│   浏览器     │────▶│  阿里云 OSS  │     │  前端静态资源        │
└─────────────┘     └─────────────┘     │  yuefa-web-prod     │
       │                                └─────────────────────┘
       │ API
       ▼
┌─────────────┐     ┌─────────────────────┐
│  阿里云 FC   │────▶│  RDS PostgreSQL     │
│  函数计算    │     │  Serverless         │
└─────────────┘     └─────────────────────┘
```

### 访问地址

| 服务 | 地址 |
|-----|------|
| 前端 | https://yuefa-web-prod.oss-cn-hangzhou.aliyuncs.com |
| 后端 | https://yuefa-api-prod-oxdypoddpn.cn-hangzhou.fcapp.run |

### 技术亮点

1. **Serverless 架构**: FC + RDS Serverless，按量付费，成本低
2. **双数据库支持**: 开发用 SQLite，生产用 PostgreSQL
3. **FC3 适配器**: 自定义 HTTP 事件到 Express 的适配层
4. **CI/CD 流水线**: GitHub Actions 自动测试和部署

### 下一步

- 配置自定义域名 + HTTPS
- 启用 CDN 加速
- 完善监控告警

---

## 2026-01-14 | e06e6d5

**提交信息:** feat: 初始化约发MVP项目代码与架构文档

### 变更概要

本次提交初始化了约发(YueFa)项目的完整代码骨架和技术文档，共计 **76 个文件**，新增 **11,106 行代码**。

### 主要内容

#### 1. 项目代码 (`codes/`)
- **Monorepo架构**: 使用pnpm workspace管理前后端代码
- **前端 (packages/web)**:
  - Vue 3 + Vite 构建
  - Vant 4 移动端组件库
  - Tailwind CSS 样式
  - Pinia 状态管理
  - 6个页面视图 (登录/主页编辑/作品管理/订单管理/订单详情/客户浏览页)
  - 5个可复用组件 (ImageUploader/InquiryForm/OrderCard/WorkGallery/AdminTabbar)
  - 完整的API层封装
  - Vitest 单元测试 + Playwright E2E测试
- **后端 (packages/server)**:
  - Express.js API服务
  - sql.js (SQLite内存数据库)
  - JWT + bcryptjs 认证
  - 5个数据模型 (User/Work/Order/Inquiry/SmsCode)
  - 6个路由模块 (auth/users/works/orders/inquiries/upload)
  - Vitest 单元测试

#### 2. 文档
- **CLAUDE.md**: Claude Code项目配置与开发指南
- **约发MVP系统架构与开发计划.md**: 详细的技术方案、API设计、数据库设计、部署架构

#### 3. 配置
- **.claude/**: Claude Code本地配置
- 各类工具配置 (vite/vitest/tailwind/playwright等)

### 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | Vue 3 + Vite |
| UI组件 | Vant 4 |
| 样式 | Tailwind CSS |
| 状态管理 | Pinia |
| 后端 | Express.js |
| 数据库 | sql.js (SQLite) |
| 认证 | JWT + bcryptjs |
| 测试 | Vitest + Playwright |

### 下一步

- 运行 `cd codes && pnpm install && pnpm dev` 启动开发环境
- 前端访问 http://localhost:3000
- 后端API http://localhost:4000

---

## 2026-01-20 | 9700e05

**提交信息:** feat: 实现PRD 2.0完整功能 - 9状态订单流程与数字验收系统

### 变更概要

本次提交实现了PRD 2.0的全部核心功能，共计 **32 个文件**，新增 **6,630 行代码**，删除 **677 行**。

### 主要内容

#### 1. 后端升级 (`packages/server`)

**新增文件:**
- `models/Review.js` - 验收数据模型，支持修改请求与响应追踪
- `routes/reviews.js` - 验收API路由 (创建/查询/确认/修改)
- `tests/reviews.test.js` - 验收模块单元测试

**修改文件:**
- `models/Order.js` - 新增9状态流转、毛坯追踪、定金尾款计算
- `models/Inquiry.js` - 新增PRD 2.0字段 (毛坯来源、头型备注、特殊需求)
- `routes/orders.js` - 新增状态操作API (确认定金/毛坯/尾款/发货/完成)
- `routes/inquiries.js` - 支持PRD 2.0字段转换为订单

#### 2. 前端升级 (`packages/web`)

**新增文件:**
- `views/admin/CreateReview.vue` - 毛娘端验收创建页面
- `views/client/ReviewPage.vue` - 客户端验收确认页面
- `api/reviews.js` - 验收API客户端
- `e2e/orders.spec.js` - 订单流程E2E测试
- `e2e/review.spec.js` - 验收流程E2E测试

**修改文件:**
- `views/admin/OrderDetail.vue` - 9状态显示、死线预警、验收信息
- `views/admin/Orders.vue` - 订单列表支持9状态筛选
- `components/OrderCard.vue` - 状态徽章、死线预警样式
- `components/InquiryForm.vue` - 毛坯来源选择、头型备注、特殊需求
- `router/index.js` - 新增验收页面路由

#### 3. 文档更新

- `约发MVP系统架构与开发计划.md` - 更新开发进度与技术细节
- `产品需求文档 PRD 2.0 流程深度整合版.md` - 新增完整PRD文档

### 核心功能

#### 9状态订单流程
```
pending_deposit → awaiting_wig_base/queued → in_progress → in_review → pending_balance → shipped → completed
   (待定金)        (等毛坯/排单中)          (制作中)      (验收中)      (待尾款)        (已发货)   (已完成)
```

#### 死线预警系统
| 剩余天数 | 显示 |
|---------|------|
| ≤ 3天 | 红色警告 |
| ≤ 7天 | 黄色警告 |
| > 7天 | 正常显示 |

#### 数字验收系统
- Token链接验收 (客户无需登录)
- 最多2次修改请求
- 修改请求与响应追踪
- 验收通过自动流转状态

#### 自动价格计算
- 定金 = 成交价 × 20%
- 尾款 = 成交价 × 80%

### 技术亮点

1. **状态机设计**: 订单状态流转逻辑清晰，支持条件分支
2. **Token验收**: 基于nanoid生成唯一Token，客户无需注册
3. **修改限制**: 防止无限修改，保护毛娘权益
4. **死线预警**: 智能提醒，避免逾期

### 下一步

MVP核心功能已完成，可进行:
- 真机测试与体验优化
- 根据用户反馈迭代
- P1/P2功能按需开发
