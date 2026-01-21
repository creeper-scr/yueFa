# YueFa 项目 Claude Skills 使用指南

这个目录包含了 YueFa 项目的 8 个 Claude Skills，用于标准化开发流程。

## 📋 Skills 总览

| Skill | 用途 | 使用时机 |
|-------|------|----------|
| [/feature](feature.md) | 新功能开发规划 | 开始开发新功能前 |
| [/code](code.md) | 代码编写规范检查 | 编写代码时 |
| [/test](test.md) | 测试编写与运行 | 完成代码编写后 |
| [/commit](commit.md) | 智能 Git 提交 | 提交代码时 |
| [/ci-check](ci-check.md) | CI/CD 预检查 | Push 到 GitHub 前 |
| [/fix](fix.md) | 问题修复流程 | 发现 Bug 时 |
| [/review](review.md) | 代码审查流程 | 审查 PR 时 |
| [/refactor](refactor.md) | 代码重构流程 | 改进代码结构时 |

## 🚀 快速开始

### 1. 使用 Skills 的两种方式

#### 方式一: 通过命令调用 (推荐)
```bash
# 在 Claude Code 中输入
/feature   # 开始功能规划
/code      # 检查编码规范
/test      # 编写和运行测试
```

#### 方式二: 直接阅读
每个 Skill 文件都是独立的 Markdown 文档，可以直接阅读参考。

### 2. 标准开发流程

```
新功能开发:
/feature → /code → /test → /commit → /ci-check → push

Bug 修复:
/fix → /code → /test → /commit → /ci-check → push

代码重构:
/refactor → /test → /commit → /ci-check → push
```

## 📖 详细说明

### /feature - 新功能开发规划

**何时使用**: 开发任何新功能前

**输出**:
- 需求分析文档
- 技术方案设计
- API 接口设计
- 数据库设计
- 任务分解清单

**示例**:
```
需求: 添加订单批量导出功能

使用 /feature 后会生成:
1. 功能设计文档
2. 前端组件设计
3. 后端 API 设计
4. 数据库表结构
5. 实施步骤
```

---

### /code - 代码编写规范

**何时使用**: 编写代码时随时参考

**涵盖内容**:
- Vue 3 Composition API 规范
- Express 路由设计模式
- 数据验证规范
- 错误处理规范
- 安全编码规范
- 性能优化建议

**快速检查**:
- ✅ 使用参数化查询 (防 SQL 注入)
- ✅ 添加权限检查
- ✅ 错误都有 try-catch
- ✅ 输入都有验证
- ✅ 敏感数据已加密/过滤

---

### /test - 测试编写与运行

**何时使用**: 完成代码编写后

**涵盖内容**:
- 后端单元测试 (Vitest + Supertest)
- 前端单元测试 (Vitest + Vue Test Utils)
- E2E 测试 (Playwright)
- 测试命令和最佳实践

**测试清单**:
- ✅ 正常场景测试
- ✅ 边界场景测试 (空值、最大值、最小值)
- ✅ 异常场景测试 (400/401/403/404)
- ✅ 权限场景测试

---

### /commit - 智能 Git 提交

**何时使用**: 提交代码时

**提供**:
- 约定式提交规范
- 提交信息模板
- 提交前检查清单
- 常见场景示例

**提交格式**:
```
feat(orders): 添加订单导出功能

- 支持 CSV 和 Excel 格式
- 支持状态筛选
- 添加权限控制

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

---

### /ci-check - CI/CD 预检查

**何时使用**: Push 到 GitHub 前

**检查项目**:
1. Lint 检查 (`pnpm lint`)
2. 单元测试 (`pnpm test`)
3. E2E 测试 (`pnpm test:e2e`)
4. 构建检查 (`pnpm build`)
5. 依赖检查 (pnpm-lock.yaml)

**快速命令**:
```bash
# 完整检查
pnpm lint && pnpm test && pnpm test:e2e && pnpm build:web
```

---

### /fix - 问题修复流程

**何时使用**: 发现 Bug 或问题时

**流程**:
1. 问题复现
2. 根因分析
3. 修复方案设计
4. 编写回归测试
5. 本地验证
6. 提交和部署

**修复原则**:
- 先写测试,再修复代码
- 修复根本原因,不是表面现象
- 添加回归测试防止复发

---

### /review - 代码审查流程

**何时使用**: 审查 PR 或自我检查时

**审查维度**:
1. 功能正确性
2. 代码质量
3. 架构设计
4. 测试覆盖
5. 安全性
6. 性能
7. 错误处理
8. 可维护性

**审查级别**:
- 🔴 Blocker: 必须修改
- 🟡 Major: 建议修改
- 🟢 Minor: 可选修改
- 💬 Question: 疑问讨论

---

### /refactor - 代码重构流程

**何时使用**: 改进代码结构时

**重构原则**:
1. 小步重构,频繁提交
2. 测试先行,确保覆盖
3. 行为不变,外部可观察行为保持一致
4. 独立进行,与功能开发分离

**重构技巧**:
- 提取函数
- 提取变量
- 简化条件
- 使用对象参数
- 早返回 (Guard Clauses)
- 消除重复代码

---

## 🎯 使用最佳实践

### 1. 按流程使用
不要跳过步骤,按照标准流程使用 Skills,确保质量。

### 2. 及时参考
遇到疑问时随时查看对应的 Skill 文档。

### 3. 持续改进
根据实际使用情况,不断完善和更新 Skills。

### 4. 团队共享
确保团队成员都了解并使用这些 Skills。

## 📚 相关文档

- [开发流程总览](../../YueFa-docs/workflows/development.md)
- [前端编码规范](../../YueFa-docs/standards/frontend.md)
- [后端编码规范](../../YueFa-docs/standards/backend.md)
- [测试编写规范](../../YueFa-docs/standards/testing.md)
- [Git 提交规范](../../YueFa-docs/standards/commit.md)

## 🆘 常见问题

### Q1: 如何开始使用这些 Skills?
A: 在 Claude Code 中直接输入 `/skill-name` (如 `/feature`) 即可调用。

### Q2: 这些 Skills 是必须遵守的吗?
A: 是的。这些 Skills 定义了项目的标准流程,确保代码质量和团队协作效率。

### Q3: 如何更新这些 Skills?
A: 直接编辑对应的 Markdown 文件即可。建议通过 PR 流程更新。

### Q4: 遇到 Skills 中没有覆盖的场景怎么办?
A: 可以参考最接近的 Skill,或者提出新的 Skill 需求。

---

**创建时间**: 2026-01-21
**维护者**: YueFa 开发团队
