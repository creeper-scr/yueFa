# Changelog

本文件记录项目的所有重要更改，格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)。

## [Unreleased]

## [0.2.0] - 2026-01-21

### 新增

#### 配置文件
- 创建 ESLint 9 flat config 配置（前端 + 后端）
- 创建 Prettier 配置（.prettierrc.json、.prettierignore）
- 添加 lint/format npm scripts

#### 前端组件
- `OrderFilters.vue` - 订单状态筛选栏组件
- `OrderInquiryPopup.vue` - 询价弹窗组件
- `OrderConvertDialog.vue` - 转换订单对话框组件
- `OrderActionDialogs.vue` - 确认对话框集合组件

#### 文档
- 为所有 7 个 API 文件添加完整 JSDoc 注释
  - auth.js、orders.js、inquiries.js
  - user.js、works.js、reviews.js、upload.js

### 变更

#### 后端
- `AppError` 类支持 `errors` 数组参数，便于传递详细验证错误
- 为 orders、inquiries 路由补充 `validationResult` 验证检查
- 移除所有 `console.log`/`console.error` 语句

#### 前端
- 重构 `Orders.vue`（654 行 → 328 行），拆分为 5 个子组件
- 优化 API 请求拦截器，返回标准错误对象而非强制显示 Toast
- 统一未使用变量命名（添加 `_` 前缀）

### 修复
- 修复未使用变量导致的 ESLint 警告
- 修复 `camelcase` 规则与数据库字段命名冲突

### 技术债务
- 从 ESLint 旧配置（.eslintrc.cjs）迁移到 ESLint 9 flat config
- 统一代码风格（无分号、单引号、2 空格缩进）

---

## [0.1.0] - 2026-01-20

### 新增
- 项目标准化开发流程规则体系文档
  - 后端编码规范 (backend.md)
  - 前端编码规范 (frontend.md)
  - Git 提交规范 (commit.md)
  - 测试编写规范 (testing.md)
  - 开发工作流程 (development.md)

---

[Unreleased]: https://github.com/creeper-scr/yueFa/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/creeper-scr/yueFa/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/creeper-scr/yueFa/releases/tag/v0.1.0
