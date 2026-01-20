# 提交记录

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
