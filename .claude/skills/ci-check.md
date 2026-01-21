# /ci-check - CI/CD 预检查

Replace with description of the skill and when Claude should use it.

在 push 代码到 GitHub 之前，使用此 Skill 在本地模拟 CI 环境，预测 CI 通过率,提前发现问题。

## 使用场景

- Git 提交后、push 前
- 准备创建 PR 时
- 想要验证 CI 是否会通过

## YueFa CI/CD 流程

GitHub Actions 自动化流程 (`.github/workflows/ci-cd.yml`):

```
1. Unit Tests (单元测试)
   ├─ 运行 pnpm test
   ├─ 测试前后端
   └─ 必须全部通过

2. E2E Tests (E2E 测试)
   ├─ 依赖单元测试通过
   ├─ 安装 Playwright
   ├─ 运行 pnpm test:e2e
   └─ 必须全部通过

3. Build (构建)
   ├─ 仅 main 分支 push 触发
   ├─ 依赖测试通过
   ├─ 运行 pnpm build:web
   └─ 上传构建产物

4. Deploy Frontend (部署前端)
   ├─ 部署到阿里云 OSS
   └─ 验证部署成功

5. Deploy Backend (部署后端)
   ├─ 部署到阿里云函数计算
   └─ 验证健康检查
```

---

## 本地 CI 预检查流程

### 1. Lint 检查

```bash
cd /Users/ygz/apps/yueFa/codes

# 运行 lint 检查
pnpm lint

# 自动修复 lint 问题 (如果可以)
pnpm lint --fix
```

**检查内容**:
- ESLint 规则检查
- 代码格式问题
- 未使用的变量
- 潜在的 Bug

**常见问题**:
- 未使用的导入
- 缺少分号
- 缩进不一致
- console.log 未删除

### 2. 单元测试

```bash
# 运行所有单元测试
pnpm test

# 或分别运行
pnpm test:web      # 前端单元测试
pnpm test:server   # 后端单元测试
```

**检查内容**:
- 所有测试用例通过
- 没有跳过的测试 (`it.skip`, `describe.skip`)
- 没有失败的断言

**失败处理**:
- 查看失败的测试用例
- 修复代码或修复测试
- 重新运行直到全部通过

### 3. E2E 测试

```bash
# 运行 E2E 测试
pnpm test:e2e

# 如果失败,使用 UI 模式调试
pnpm --filter @yuefa/web test:e2e:ui
```

**检查内容**:
- 关键业务流程测试通过
- Mock API 正确配置
- 页面跳转和交互正常

**失败处理**:
- 查看失败截图 (playwright-report/)
- 使用 UI 模式逐步调试
- 修复代码或更新测试

### 4. 构建检查

```bash
# 构建前端
pnpm build:web

# 检查构建产物
ls -lh packages/web/dist/
```

**检查内容**:
- 构建成功无错误
- 生成 dist/ 目录
- HTML、CSS、JS 文件完整
- 资源文件正确引用

**常见问题**:
- TypeScript 类型错误
- 导入路径错误
- 环境变量未配置
- 第三方依赖缺失

### 5. 环境变量检查

```bash
# 检查前端环境变量
cat packages/web/.env.production

# 检查后端环境变量 (GitHub Secrets)
# 在 GitHub 仓库设置中查看
```

**必需的环境变量**:

**前端** (`.env.production`):
- `VITE_API_BASE_URL`: 生产 API 地址

**后端** (GitHub Secrets):
- `DATABASE_URL`: PostgreSQL 连接串
- `JWT_SECRET`: JWT 签名密钥
- `ALIYUN_ACCESS_KEY_ID`: 阿里云 AccessKey
- `ALIYUN_ACCESS_KEY_SECRET`: 阿里云 Secret
- `OSS_BUCKET_PROD`: OSS 桶名
- `OSS_BUCKET_DATA`: 数据 OSS 桶
- `ALIYUN_REGION`: 阿里云区域
- `FC_ENDPOINT_PROD`: 函数计算端点

### 6. 依赖检查

```bash
# 检查依赖是否锁定
git status pnpm-lock.yaml

# 如果 pnpm-lock.yaml 有变更,应该一起提交
git add pnpm-lock.yaml
```

**注意事项**:
- CI 使用 `pnpm install --frozen-lockfile`
- 如果本地和 lock 文件不一致会失败
- 添加新依赖时务必提交 lock 文件

---

## 完整预检查脚本

创建一个本地预检查脚本 (可选):

```bash
#!/bin/bash
# scripts/ci-check.sh

set -e  # 遇到错误立即退出

echo "🔍 开始 CI 预检查..."
echo ""

# 切换到项目根目录
cd "$(dirname "$0")/.."

# 1. Lint 检查
echo "📋 Step 1/5: 运行 Lint 检查..."
pnpm lint
echo "✅ Lint 检查通过"
echo ""

# 2. 单元测试
echo "🧪 Step 2/5: 运行单元测试..."
pnpm test
echo "✅ 单元测试通过"
echo ""

# 3. E2E 测试
echo "🎭 Step 3/5: 运行 E2E 测试..."
pnpm test:e2e
echo "✅ E2E 测试通过"
echo ""

# 4. 构建检查
echo "🏗️  Step 4/5: 检查构建..."
pnpm build:web
echo "✅ 构建成功"
echo ""

# 5. 依赖检查
echo "📦 Step 5/5: 检查依赖..."
if git diff --quiet pnpm-lock.yaml; then
  echo "✅ 依赖锁文件未变更"
else
  echo "⚠️  pnpm-lock.yaml 有变更,请一起提交"
fi
echo ""

echo "✅ 所有检查通过! 可以安全地 push 了"
echo ""
echo "下一步:"
echo "  git push origin main"
```

使用方法:
```bash
# 给脚本添加执行权限
chmod +x codes/scripts/ci-check.sh

# 运行预检查
cd codes
./scripts/ci-check.sh
```

---

## 快速检查命令

### 最小检查 (快速)
```bash
cd codes

# 只运行单元测试
pnpm test
```

### 标准检查 (推荐)
```bash
cd codes

# 运行测试和构建
pnpm lint && pnpm test && pnpm build:web
```

### 完整检查 (全面)
```bash
cd codes

# 运行所有检查
pnpm lint && \
pnpm test && \
pnpm test:e2e && \
pnpm build:web
```

---

## CI 失败的常见原因

### 1. 单元测试失败
**原因**:
- 代码逻辑错误
- 测试用例过时
- 测试数据冲突

**解决**:
```bash
# 本地运行失败的测试
pnpm test:server  # 或 test:web

# 查看详细错误信息
# 修复代码或更新测试
```

### 2. E2E 测试失败
**原因**:
- UI 变更导致选择器失效
- Mock API 未更新
- 异步时序问题

**解决**:
```bash
# 使用 UI 模式调试
pnpm --filter @yuefa/web test:e2e:ui

# 查看失败截图
open packages/web/playwright-report/index.html
```

### 3. 构建失败
**原因**:
- TypeScript 类型错误
- 导入路径错误
- 环境变量缺失

**解决**:
```bash
# 本地构建查看错误
pnpm build:web

# 检查错误信息并修复
```

### 4. Lint 失败
**原因**:
- 代码格式不符合规范
- ESLint 规则违反

**解决**:
```bash
# 自动修复
pnpm lint --fix

# 手动修复无法自动处理的问题
```

### 5. 依赖问题
**原因**:
- pnpm-lock.yaml 未提交
- 依赖版本冲突

**解决**:
```bash
# 确保 lock 文件最新
pnpm install

# 提交 lock 文件
git add pnpm-lock.yaml
git commit -m "chore: update dependencies"
```

---

## 查看 CI 执行结果

### GitHub Actions 界面
1. 访问 GitHub 仓库
2. 点击 "Actions" 标签
3. 查看最新的 workflow 运行

### 检查各个 Job
- ✅ **test**: 单元测试通过
- ✅ **e2e**: E2E 测试通过
- ✅ **build**: 构建成功
- ✅ **deploy-frontend**: 前端部署成功
- ✅ **deploy-backend**: 后端部署成功

### 查看失败日志
1. 点击失败的 Job
2. 展开失败的 Step
3. 查看详细错误日志
4. 根据错误信息修复

---

## 预检查清单

在 push 之前确认:

### 代码质量
- [ ] 运行 `pnpm lint` 无错误
- [ ] 没有 TODO/FIXME 未处理
- [ ] 没有 console.log/debugger
- [ ] 没有注释掉的代码

### 测试
- [ ] 运行 `pnpm test` 全部通过
- [ ] 运行 `pnpm test:e2e` 全部通过
- [ ] 新功能有对应的测试

### 构建
- [ ] 运行 `pnpm build:web` 成功
- [ ] dist/ 目录生成正确

### Git
- [ ] 提交信息符合规范
- [ ] 提交了 pnpm-lock.yaml (如有变更)
- [ ] 没有提交敏感信息
- [ ] 没有提交 node_modules/ 等

### 文档
- [ ] 更新了相关文档 (如需要)
- [ ] 更新了 README (如需要)

---

## 优化 CI 执行时间

### 本地缓存
```bash
# CI 使用 pnpm 缓存
# 本地也应该利用缓存
pnpm install  # 会自动使用缓存
```

### 并行执行
```bash
# 本地可以并行运行多个检查
pnpm lint & \
pnpm test:web & \
pnpm test:server & \
wait

# 但 E2E 测试通常需要串行
pnpm test:e2e
```

### 跳过不必要的检查
```bash
# 如果只修改了文档
git commit -m "docs: update README"
# CI 仍会运行,但可以考虑添加条件跳过

# 如果只修改了后端
# 可以只运行后端测试验证
pnpm test:server
```

---

## 常见问题

### Q1: 本地测试通过但 CI 失败？
A: 可能原因:
- 环境差异 (Node 版本、依赖版本)
- pnpm-lock.yaml 未提交
- 环境变量配置不同
- 时区或时间相关的测试

### Q2: CI 太慢怎么办？
A:
- 确保 pnpm-lock.yaml 已提交 (避免重新解析依赖)
- 使用缓存 (GitHub Actions 已配置)
- 减少不必要的测试 (不是删除,是优化)

### Q3: 如何跳过 CI？
A: 不建议跳过。如果确实需要:
```bash
git commit -m "docs: update [skip ci]"
```

### Q4: PR 的 CI 检查和 push 到 main 有什么区别？
A: PR 只运行测试,不会部署。push 到 main 会触发部署。

---

## 相关文档

- [CI/CD 配置文件](../../.github/workflows/ci-cd.yml)
- [测试编写规范](/test)
- [提交规范](/commit)
- [开发流程总览](../../YueFa-docs/workflows/development.md)

## 下一步

CI 预检查通过后:
1. Push 代码到 GitHub: `git push origin main`
2. 访问 GitHub Actions 查看 CI 执行
3. 等待 CI 通过
4. 自动部署到生产环境
5. 验证部署结果
