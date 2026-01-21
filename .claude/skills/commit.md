# /commit - 智能 Git 提交

Replace with description of the skill and when Claude should use it.

当代码编写和测试完成后，使用此 Skill 进行规范化的 Git 提交。自动生成符合约定式提交规范的提交信息。

## 使用场景

- 完成新功能开发
- 完成 Bug 修复
- 完成代码重构
- 完成测试编写
- 完成文档更新

## 约定式提交规范 (Conventional Commits)

### 提交格式
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type (必填)
- `feat`: 新功能
- `fix`: Bug 修复
- `refactor`: 重构 (不改变功能的代码重构)
- `test`: 测试相关 (添加/修改测试)
- `docs`: 文档更新
- `style`: 代码格式 (不影响功能的格式调整)
- `chore`: 构建/工具变动 (package.json、配置文件等)
- `perf`: 性能优化
- `ci`: CI/CD 配置修改

### Scope (可选但推荐)
- `web`: 前端相关
- `server`: 后端相关
- `ci`: CI/CD 相关
- `e2e`: E2E 测试相关
- `具体模块名`: 如 `orders`, `reviews`, `auth` 等

### Subject (必填)
- 简短描述 (不超过 50 字符)
- 使用祈使句 (如 "添加" 而不是 "添加了")
- 不要以句号结尾
- 中文或英文均可

### Body (可选)
- 详细描述变更原因
- 说明与之前版本的差异
- 多行描述用空行分隔

### Footer (可选)
- 关联 Issue: `Closes #123`
- Breaking Change: `BREAKING CHANGE: xxx`
- Co-authored-by: 协作者信息

---

## 提交流程

### 1. 查看变更
```bash
# 查看所有变更
git status

# 查看详细差异
git diff

# 查看已暂存的差异
git diff --cached
```

### 2. 分析变更内容
- 识别变更类型 (新功能/修复/重构等)
- 识别影响范围 (前端/后端/CI等)
- 总结变更的核心内容

### 3. 生成提交信息
基于变更内容生成符合规范的提交信息。

### 4. 添加文件并提交
```bash
# 添加所有变更
git add .

# 或选择性添加
git add path/to/file

# 提交 (使用 heredoc 确保格式正确)
git commit -m "$(cat <<'EOF'
feat(orders): 添加订单批量导出功能

- 支持导出为 CSV 和 Excel 格式
- 支持筛选状态和日期范围
- 添加导出权限控制

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## 提交示例

### 新功能
```
feat(server): 添加订单批量删除 API

- 新增 DELETE /api/v1/orders/batch 端点
- 支持批量删除多个订单
- 添加权限验证
- 添加单元测试

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

```
feat(web): 实现验收页面修改申请功能

- 添加验收修改申请表单
- 支持上传修改说明图片
- 集成后端 API
- 添加 E2E 测试

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

### Bug 修复
```
fix(web): 修复订单列表状态筛选失败的问题

订单列表的状态筛选参数未正确传递给 API，
导致筛选功能失效。已修复参数传递逻辑。

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

```
fix(server): 修复订单状态流转权限检查缺失

在订单状态更新时未检查用户权限，导致
非 owner 可以修改他人订单。已添加权限检查。

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

### 代码重构
```
refactor(server): 重构订单模型查询方法

- 抽取公共的查询逻辑
- 优化 SQL 查询性能
- 统一错误处理
- 不改变外部 API 行为

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

### 测试
```
test(server): 添加询价转订单的集成测试

- 测试正常转换流程
- 测试定金尾款计算
- 测试毛坯来源配置
- 测试权限控制

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

### 文档
```
docs: 更新开发流程文档

- 添加测试编写指南
- 更新 CI/CD 流程说明
- 补充代码规范示例

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

### CI/CD
```
ci: 优化 GitHub Actions 工作流

- 添加并行测试执行
- 缓存 node_modules
- 优化构建时间

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

---

## 提交最佳实践

### 1. 原子提交
每个提交只做一件事:
- ✅ 一个功能一个提交
- ✅ 一个 Bug 一个提交
- ❌ 一个提交包含多个不相关的变更

### 2. 提交频率
- 完成一个逻辑单元就提交
- 不要等到一天结束才提交
- 测试通过后再提交

### 3. 提交信息质量
- 标题简洁明了 (50 字符内)
- Body 详细说明 (如需要)
- 关联相关 Issue/PR

### 4. 代码审查友好
- 每个提交都应该是可审查的
- 提交应该是可回滚的
- 避免巨大的提交

---

## 不应该提交的内容

### 文件类型
- ❌ 环境文件: `.env`, `.env.local`
- ❌ 日志文件: `*.log`
- ❌ 系统文件: `.DS_Store`, `Thumbs.db`
- ❌ IDE 配置: `.vscode/`, `.idea/` (除非团队共享)
- ❌ 依赖目录: `node_modules/`
- ❌ 构建产物: `dist/`, `build/`
- ❌ 临时文件: `*.tmp`, `*.swp`

### 代码内容
- ❌ 未解决的 TODO/FIXME
- ❌ 调试代码: `console.log()`, `debugger`
- ❌ 注释掉的大块代码
- ❌ 敏感信息: API keys, passwords
- ❌ 测试失败的代码

---

## 提交前检查清单

### 代码质量
- [ ] 代码已格式化 (`pnpm lint`)
- [ ] 没有 TypeScript 错误
- [ ] 没有 console.log/debugger
- [ ] 没有 TODO/FIXME 未处理
- [ ] 没有注释掉的代码
- [ ] 没有敏感信息

### 测试
- [ ] 单元测试通过 (`pnpm test`)
- [ ] E2E 测试通过 (如修改了关键流程)
- [ ] 本地手动测试通过

### Git
- [ ] `.gitignore` 配置正确
- [ ] 不包含 `node_modules/` 等
- [ ] 提交信息符合规范
- [ ] 提交的文件都是必要的

---

## Git 工作流程

### 日常开发流程
```bash
# 1. 拉取最新代码
git pull origin main

# 2. 创建功能分支 (可选)
git checkout -b feature/xxx-feature

# 3. 开发功能
# ...

# 4. 查看变更
git status
git diff

# 5. 添加变更
git add .

# 6. 提交 (使用规范的提交信息)
git commit -m "$(cat <<'EOF'
feat(orders): 添加订单导出功能

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"

# 7. 推送到远程 (main 分支或功能分支)
git push origin main
# 或
git push origin feature/xxx-feature
```

### 修改上一次提交 (慎用)
```bash
# 修改提交信息
git commit --amend -m "新的提交信息"

# 添加遗漏的文件
git add forgotten-file.js
git commit --amend --no-edit

# ⚠️ 注意: 如果已经 push,需要 force push (谨慎使用)
git push origin main --force
```

---

## 常见场景

### 场景 1: 新功能开发完成
```bash
# 查看变更
git status
git diff

# 确认包含:
# - 前端页面组件
# - API 调用封装
# - 后端路由和模型
# - 单元测试
# - E2E 测试

# 提交
git add .
git commit -m "$(cat <<'EOF'
feat(xxx): 添加 XXX 功能

- 前端实现 XXX 页面
- 后端实现 XXX API
- 添加完整测试覆盖

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"
```

### 场景 2: Bug 修复
```bash
# 修复 Bug 后
git add .
git commit -m "$(cat <<'EOF'
fix(orders): 修复订单状态更新失败的问题

订单状态更新时未正确处理时间戳，
导致更新失败。已修复并添加测试。

Closes #123

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"
```

### 场景 3: 代码重构
```bash
git add .
git commit -m "$(cat <<'EOF'
refactor(server): 重构数据库查询抽象层

- 统一占位符转换逻辑
- 优化错误处理
- 不改变现有 API 行为

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## 常见问题

### Q1: 什么时候应该提交？
A: 完成一个逻辑单元且测试通过后立即提交。不要等到一天结束。

### Q2: 提交信息写中文还是英文？
A: 两者都可以。本项目示例使用中文，保持团队统一即可。

### Q3: 一定要写 Body 吗？
A: 不是必须。简单的变更只需要标题。复杂的变更建议写 Body 说明原因。

### Q4: 如何处理多个相关的变更？
A: 如果逻辑相关，可以放在一个提交中。如果不相关，应该分多个提交。

### Q5: 提交后发现有问题怎么办？
A: 如果还没有 push,可以用 `git commit --amend`。如果已经 push,创建新的提交修复。

---

## 相关文档

- [提交规范详细文档](../../YueFa-docs/standards/commit.md)
- [代码编写规范](/code)
- [测试编写规范](/test)
- [CI/CD 预检查](/ci-check)

## 下一步

提交完成后:
1. 使用 `/ci-check` 进行 CI 预检查
2. Push 到 GitHub 触发 CI/CD
3. 查看 GitHub Actions 执行结果
