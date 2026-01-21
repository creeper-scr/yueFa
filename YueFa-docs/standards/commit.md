# Git 提交规范

本文档定义了 YueFa 项目的 Git 提交规范。

## 快速参考

更详细的提交规范请查看 [/commit Skill](../../.claude/skills/commit.md)。

## 约定式提交 (Conventional Commits)

### 提交格式
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type (类型)
- `feat`: 新功能
- `fix`: Bug 修复
- `refactor`: 重构
- `test`: 测试相关
- `docs`: 文档更新
- `style`: 代码格式
- `chore`: 构建/工具变动
- `perf`: 性能优化
- `ci`: CI/CD 配置

### Scope (范围)
- `web`: 前端
- `server`: 后端
- `ci`: CI/CD
- `e2e`: E2E 测试
- 具体模块名: `orders`, `reviews`, `auth`

### Subject (主题)
- 简短描述 (不超过 50 字符)
- 使用祈使句
- 不要以句号结尾
- 中文或英文均可

## 提交示例

### 新功能
```
feat(orders): 添加订单批量导出功能

- 支持导出为 CSV 和 Excel 格式
- 支持筛选状态和日期范围
- 添加导出权限控制

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

### Bug 修复
```
fix(web): 修复订单列表状态筛选失败的问题

订单列表的状态筛选参数未正确传递给 API，
导致筛选功能失效。已修复参数传递逻辑。

Closes #123

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

### 代码重构
```
refactor(server): 重构订单模型查询方法

- 抽取公共的查询逻辑
- 优化 SQL 查询性能
- 统一错误处理

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

### 测试
```
test(server): 添加询价转订单的集成测试

- 测试正常转换流程
- 测试定金尾款计算
- 测试权限控制

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

## 提交原则

### 1. 原子提交
- 每个提交只做一件事
- 一个功能一个提交
- 一个 Bug 一个提交

### 2. 提交频率
- 完成一个逻辑单元就提交
- 不要等到一天结束才提交
- 测试通过后再提交

### 3. 提交信息质量
- 标题简洁明了
- Body 详细说明 (如需要)
- 关联相关 Issue

## 不应该提交的内容

### 文件
- ❌ `.env`, `.env.local`
- ❌ `*.log`
- ❌ `.DS_Store`, `Thumbs.db`
- ❌ `node_modules/`
- ❌ `dist/`, `build/`

### 代码
- ❌ 未解决的 TODO/FIXME
- ❌ 调试代码: `console.log()`, `debugger`
- ❌ 注释掉的代码
- ❌ 敏感信息: API keys, passwords

## 提交前检查清单

- [ ] 代码已格式化 (`pnpm lint`)
- [ ] 测试通过 (`pnpm test`)
- [ ] 没有 console.log/debugger
- [ ] 没有 TODO/FIXME 未处理
- [ ] 提交信息符合规范
- [ ] 不包含敏感信息

## Git 工作流程

```bash
# 1. 拉取最新代码
git pull origin main

# 2. 开发功能
# ...

# 3. 查看变更
git status
git diff

# 4. 添加变更
git add .

# 5. 提交 (使用规范的提交信息)
git commit -m "feat(orders): 添加订单导出功能"

# 6. 推送
git push origin main
```

## 相关资源

- [/commit Skill](../../.claude/skills/commit.md) - 详细的提交规范
- [Conventional Commits 规范](https://www.conventionalcommits.org/)
