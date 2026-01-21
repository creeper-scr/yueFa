# ==================== 构建阶段 ====================
FROM node:18-alpine AS builder

WORKDIR /app

# 安装 pnpm
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

# 复制 package 文件
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/server/package.json ./packages/server/
COPY packages/web/package.json ./packages/web/

# 安装所有依赖
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY packages/server ./packages/server
COPY packages/web ./packages/web

# 构建前端
RUN pnpm --filter @yuefa/web build

# ==================== 生产阶段 ====================
FROM node:18-alpine AS production

WORKDIR /app

# 安装 pnpm
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

# 复制 package 文件
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/server/package.json ./packages/server/

# 只安装生产依赖
RUN pnpm install --frozen-lockfile --prod --filter @yuefa/server

# 复制后端源码
COPY packages/server/src ./packages/server/src
COPY packages/server/index.js ./packages/server/

# 从构建阶段复制前端构建产物 (可选，如果需要静态文件服务)
COPY --from=builder /app/packages/web/dist ./packages/web/dist

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# 设置文件权限
RUN chown -R nodejs:nodejs /app

USER nodejs

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=9000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:9000/api/health || exit 1

# 暴露端口
EXPOSE 9000

# 启动命令
CMD ["node", "packages/server/src/app.js"]
