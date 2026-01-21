# 约发 YueFa MVP 系统架构与开发计划

> **版本**: v2.0
> **最后更新**: 2026-01-20
> **对应PRD**: 产品需求文档 PRD 2.0 流程深度整合版

---

## 1. 项目概述

### 1.1 项目背景
约发(YueFa)是一款面向Cosplay假发造型师(毛娘)的移动端H5工具平台，帮助毛娘展示作品集、收集客户询价、管理订单全流程。

### 1.2 核心价值 
- **还原真实接单链路**：把控定金、毛坯、验收等关键节点风险
- **深刻理解行业痛点**：解决"定金付了但毛坯没寄来"、"验收没闭环"等问题
- **数字化订单管理**：从询价到交付的全链路追踪

### 1.3 目标用户
- **毛娘(造型师)**：管理订单、展示作品、接收询价
- **客户(Coser)**：浏览作品、提交定制需求、参与验收

---

## 2. 技术选型

### 2.1 整体架构

```
┌────────────────────────────────────────────────────────────┐
│                      客户端层                              │
├──────────────────────┬─────────────────────────────────────┤
│     客户端 H5        │          毛娘管理端 H5              │
│  (公开主页/验收页)    │    (登录/作品/订单/个人中心)        │
└──────────────────────┴─────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────┐
│                      服务层                                │
├────────────────────────────────────────────────────────────┤
│                   Express.js API Server                    │
│     /api/v1/auth  /api/v1/orders  /api/v1/reviews ...     │
└────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────┐
│                      数据层                                │
├──────────────────────┬─────────────────────────────────────┤
│    PostgreSQL        │              对象存储               │
│    (生产环境)         │         (图片/文件上传)             │
├──────────────────────┤                                     │
│    SQLite/sql.js     │                                     │
│    (测试环境)         │                                     │
└──────────────────────┴─────────────────────────────────────┘
```

### 2.2 前端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Vue.js | 3.5.x | 核心框架 |
| Vite | 5.x | 构建工具 |
| Vant | 4.x | 移动端UI组件库 |
| Pinia | 2.x | 状态管理 |
| Vue Router | 4.x | 路由管理 |
| Tailwind CSS | 3.x | 原子化CSS |
| Axios | 1.x | HTTP客户端 |

### 2.3 后端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Node.js | 18+ | 运行时 |
| Express.js | 4.x | Web框架 |
| PostgreSQL | 15+ | 生产数据库 |
| sql.js | 1.x | 测试数据库 (SQLite) |
| JWT | - | 身份认证 |
| bcryptjs | 2.x | 密码加密 |
| express-validator | 7.x | 请求验证 |
| multer | 1.x | 文件上传 |

### 2.4 开发与部署

| 工具 | 用途 |
|------|------|
| pnpm | 包管理(Monorepo) |
| Vitest | 单元测试 |
| Supertest | API测试 |
| Playwright | E2E测试 |
| Docker | 容器化部署 |
| Nginx | 反向代理 |

---

## 3. 数据库设计

### 3.1 ER图概览

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    users    │       │   orders    │       │   reviews   │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id (PK)     │◄──────│ user_id     │       │ id (PK)     │
│ phone       │       │ id (PK)     │◄──────│ order_id    │
│ nickname    │       │ status      │       │ images      │
│ slug        │       │ wig_source  │       │ is_approved │
│ ...         │       │ ...         │       │ ...         │
└─────────────┘       └─────────────┘       └─────────────┘
       │                     │                     │
       │                     │                     │
       ▼                     │                     ▼
┌─────────────┐              │              ┌─────────────┐
│    works    │              │              │  revisions  │
├─────────────┤              │              ├─────────────┤
│ id (PK)     │              │              │ id (PK)     │
│ user_id     │              │              │ review_id   │
│ image_url   │              │              │ request     │
│ ...         │              │              │ ...         │
└─────────────┘              │              └─────────────┘
                             │
                             ▼
                      ┌─────────────┐
                      │  inquiries  │
                      ├─────────────┤
                      │ id (PK)     │
                      │ user_id     │
                      │ wig_source  │
                      │ ...         │
                      └─────────────┘
```

### 3.2 数据表定义

#### 3.2.1 users 表 (用户/毛娘)

```sql
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone           VARCHAR(20) NOT NULL UNIQUE,
    nickname        VARCHAR(50),
    avatar_url      TEXT,
    wechat_id       VARCHAR(50),
    announcement    TEXT,
    slug            VARCHAR(50) UNIQUE,
    status          SMALLINT DEFAULT 1,  -- 1:正常 0:禁用
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_slug ON users(slug);
```

#### 3.2.2 works 表 (作品集)

```sql
CREATE TABLE works (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    image_url       TEXT NOT NULL,
    thumbnail_url   TEXT,
    title           VARCHAR(100),
    character_name  VARCHAR(50),
    source_work     VARCHAR(100),
    tags            TEXT,  -- JSON数组
    sort_order      INTEGER DEFAULT 0,
    status          SMALLINT DEFAULT 1,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_works_user_id ON works(user_id);
```

#### 3.2.3 inquiries 表 (询价单) - **PRD 2.0 升级**

```sql
CREATE TABLE inquiries (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id),

    -- 客户信息
    customer_name       VARCHAR(50),
    customer_contact    VARCHAR(100),

    -- 角色信息
    character_name      VARCHAR(100) NOT NULL,
    source_work         VARCHAR(100),
    reference_images    TEXT,  -- JSON数组

    -- 头围数据 (PRD F-01)
    head_circumference  VARCHAR(20),
    head_notes          TEXT,  -- 头围备注

    -- 毛坯来源 (PRD F-03 新增)
    wig_source          VARCHAR(20) DEFAULT 'client_sends',
                        -- client_sends: 客户寄来
                        -- stylist_buys: 毛娘代购

    -- 工期
    expected_deadline   DATE,
    budget_range        VARCHAR(50),

    -- 特殊要求
    special_requirements TEXT,  -- 发际线/炸毛/鬓角等

    -- 状态
    status              VARCHAR(20) DEFAULT 'new',
                        -- new: 新询价
                        -- quoted: 已报价
                        -- converted: 已转订单
                        -- rejected: 已拒绝

    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_inquiries_user_id ON inquiries(user_id);
CREATE INDEX idx_inquiries_status ON inquiries(status);
```

#### 3.2.4 orders 表 (订单) - **PRD 2.0 核心升级**

```sql
CREATE TABLE orders (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id),
    inquiry_id          UUID REFERENCES inquiries(id),

    -- 客户信息
    customer_name       VARCHAR(50),
    customer_contact    VARCHAR(100),

    -- 角色信息
    character_name      VARCHAR(100) NOT NULL,
    source_work         VARCHAR(100),
    reference_images    TEXT,  -- JSON数组

    -- 头围数据
    head_circumference  VARCHAR(20),
    head_notes          TEXT,

    -- 毛坯管理 (PRD F-03 核心新增)
    wig_source          VARCHAR(20) DEFAULT 'client_sends',
    wig_tracking_no     VARCHAR(50),      -- 毛坯快递单号
    wig_received_at     TIMESTAMP,        -- 毛坯确认收货时间
    wig_purchase_fee    DECIMAL(10,2),    -- 代购费用(如毛娘代购)

    -- 价格信息 (PRD F-02)
    price               DECIMAL(10,2),    -- 总价
    deposit             DECIMAL(10,2),    -- 定金 (默认总价20%)
    balance             DECIMAL(10,2),    -- 尾款 (默认总价80%)
    deposit_paid_at     TIMESTAMP,        -- 定金支付时间
    deposit_screenshot  TEXT,             -- 定金支付截图
    balance_paid_at     TIMESTAMP,        -- 尾款支付时间
    balance_screenshot  TEXT,             -- 尾款支付截图

    -- 工期管理 (PRD B-02)
    deadline            DATE,             -- 交付截止日

    -- 发货信息
    shipping_no         VARCHAR(50),      -- 发货快递单号
    shipping_company    VARCHAR(50),      -- 快递公司
    shipped_at          TIMESTAMP,        -- 发货时间

    -- 发货清单 (PRD S-01)
    shipping_checklist  TEXT,             -- JSON: {balance_confirmed, cushioned, insured}

    -- 制作笔记 (PRD B-03)
    production_notes    TEXT,

    -- 订单状态 (PRD 2.0 九状态)
    status              VARCHAR(30) DEFAULT 'pending_quote',
                        -- pending_quote:     待报价
                        -- pending_deposit:   待付定金
                        -- awaiting_wig_base: 等毛坯 (核心新增)
                        -- queued:            排单中
                        -- in_progress:       制作中
                        -- in_review:         验收中 (核心新增)
                        -- pending_balance:   待尾款
                        -- shipped:           已发货
                        -- completed:         已完成

    -- 备注
    notes               TEXT,  -- JSON数组

    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_deadline ON orders(deadline);
```

#### 3.2.5 reviews 表 (验收记录) - **PRD R-01 新增**

```sql
CREATE TABLE reviews (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id            UUID NOT NULL REFERENCES orders(id),

    -- 验收内容
    images              TEXT NOT NULL,    -- JSON数组: 成品图片
    description         TEXT,             -- 成品描述

    -- 验收链接
    review_token        VARCHAR(100) UNIQUE,  -- 唯一验收链接token
    review_url          TEXT,             -- 完整验收链接

    -- 验收结果
    is_approved         BOOLEAN,          -- 是否通过验收
    approved_at         TIMESTAMP,        -- 验收通过时间

    -- 修改次数限制 (PRD R-01)
    max_revisions       SMALLINT DEFAULT 2,
    revision_count      SMALLINT DEFAULT 0,

    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reviews_order_id ON reviews(order_id);
CREATE INDEX idx_reviews_token ON reviews(review_token);
```

#### 3.2.6 review_revisions 表 (修改记录) - **PRD R-02 新增**

```sql
CREATE TABLE review_revisions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id           UUID NOT NULL REFERENCES reviews(id),

    -- 修改请求
    revision_number     SMALLINT NOT NULL,      -- 第几次修改
    request_content     TEXT NOT NULL,          -- 修改意见
    request_images      TEXT,                   -- 参考图片
    requested_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- 修改完成
    response_images     TEXT,                   -- 修改后图片
    response_notes      TEXT,                   -- 修改说明
    completed_at        TIMESTAMP,

    -- 客户确认
    is_satisfied        BOOLEAN,                -- 是否满意
    confirmed_at        TIMESTAMP
);

CREATE INDEX idx_revisions_review_id ON review_revisions(review_id);
```

#### 3.2.7 sms_codes 表 (验证码)

```sql
CREATE TABLE sms_codes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone           VARCHAR(20) NOT NULL,
    code            VARCHAR(10) NOT NULL,
    expires_at      TIMESTAMP NOT NULL,
    used            BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sms_codes_phone ON sms_codes(phone);
```

### 3.3 订单状态流转图

```
                              ┌──────────────────┐
                              │   新询价 (NEW)    │
                              └────────┬─────────┘
                                       │ 毛娘接单
                                       ▼
                              ┌──────────────────┐
                              │ 待报价           │
                              │ PENDING_QUOTE    │
                              └────────┬─────────┘
                                       │ 提交报价
                                       ▼
                              ┌──────────────────┐
                              │ 待付定金         │
                              │ PENDING_DEPOSIT  │
                              └────────┬─────────┘
                                       │ 定金到账
                                       ▼
              ┌────────────────────────┴────────────────────────┐
              │                                                  │
              ▼                                                  ▼
    ┌──────────────────┐                              ┌──────────────────┐
    │ 等毛坯 (客户寄)   │                              │ 排单中 (毛娘代购) │
    │ AWAITING_WIG_BASE│                              │ QUEUED           │
    └────────┬─────────┘                              └────────┬─────────┘
             │ 确认收到毛坯                                     │
             └──────────────────────┬──────────────────────────┘
                                    ▼
                           ┌──────────────────┐
                           │ 排单中           │
                           │ QUEUED           │
                           └────────┬─────────┘
                                    │ 开始制作
                                    ▼
                           ┌──────────────────┐
                           │ 制作中           │
                           │ IN_PROGRESS      │
                           └────────┬─────────┘
                                    │ 上传成品图
                                    ▼
                           ┌──────────────────┐
                           │ 验收中           │◄─────┐
                           │ IN_REVIEW        │      │ 申请修改
                           └────────┬─────────┘      │ (次数≤2)
                                    │                │
                       ┌────────────┴────────────┐   │
                       │                         │   │
                       ▼                         ▼───┘
              ┌────────────────┐      ┌────────────────┐
              │ 待尾款         │      │ 修改中         │
              │ PENDING_BALANCE│      │ (IN_REVIEW)    │
              └────────┬───────┘      └────────────────┘
                       │ 尾款到账
                       ▼
              ┌──────────────────┐
              │ 已发货           │
              │ SHIPPED          │
              └────────┬─────────┘
                       │ 客户确认收货
                       ▼
              ┌──────────────────┐
              │ 已完成           │
              │ COMPLETED        │
              └──────────────────┘
```

---

## 4. API 接口设计

### 4.1 接口规范

**Base URL**: `/api/v1`

**请求格式**: JSON
**响应格式**:
```json
{
  "code": 0,           // 0=成功, 非0=错误码
  "message": "success",
  "data": {}           // 业务数据
}
```

**认证方式**: Bearer Token (JWT)
```
Authorization: Bearer <token>
```

### 4.2 认证模块 `/api/v1/auth`

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| POST | /send-code | 发送验证码 | 否 |
| POST | /login | 验证码登录 | 否 |
| GET | /me | 获取当前用户 | 是 |

#### POST /send-code
```json
// Request
{ "phone": "13800138000" }

// Response
{ "code": 0, "message": "验证码已发送" }
```

#### POST /login
```json
// Request
{ "phone": "13800138000", "code": "123456" }

// Response
{
  "code": 0,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": { "id": "...", "phone": "...", "nickname": "..." }
  }
}
```

### 4.3 用户模块 `/api/v1/users`

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| GET | /profile | 获取个人资料 | 是 |
| PUT | /profile | 更新个人资料 | 是 |
| GET | /public/:slug | 获取公开主页 | 否 |

### 4.4 作品模块 `/api/v1/works`

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| GET | / | 获取作品列表 | 是 |
| POST | / | 添加作品 | 是 |
| PUT | /:id | 更新作品 | 是 |
| DELETE | /:id | 删除作品 | 是 |
| PUT | /sort | 批量排序 | 是 |

### 4.5 询价模块 `/api/v1/inquiries`

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| POST | / | 客户提交询价 | 否 |
| GET | / | 获取询价列表 | 是 |
| GET | /:id | 获取询价详情 | 是 |
| POST | /:id/quote | 提交报价 | 是 |
| POST | /:id/convert | 转为订单 | 是 |
| PUT | /:id/reject | 拒绝询价 | 是 |

#### POST / (客户提交询价) - PRD F-01 结构化表单
```json
// Request
{
  "user_slug": "maoyi-xiaomei",
  "customer_name": "小明",
  "customer_contact": "wx: xiaoming123",
  "character_name": "初音未来",
  "source_work": "VOCALOID",
  "expected_deadline": "2026-03-01",
  "head_circumference": "56cm",
  "head_notes": "头型偏扁，后脑勺平",
  "wig_source": "client_sends",  // 新增: 毛坯来源
  "special_requirements": "需要双马尾支撑，发际线自然过渡",
  "budget_range": "400-600",
  "reference_images": ["https://..."]
}
```

#### POST /:id/quote (提交报价) - PRD F-02 自动计算
```json
// Request
{
  "price": 500,
  "deadline": "2026-03-01",
  "notes": "复杂双马尾需要额外工时"
}

// Response (系统自动计算定金/尾款)
{
  "code": 0,
  "data": {
    "price": 500,
    "deposit": 100,      // 自动计算: 500 * 20%
    "balance": 400,      // 自动计算: 500 * 80%
    "deadline": "2026-03-01"
  }
}
```

### 4.6 订单模块 `/api/v1/orders` - **PRD 2.0 核心升级**

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| GET | / | 获取订单列表 | 是 |
| GET | /:id | 获取订单详情 | 是 |
| PUT | /:id | 更新订单信息 | 是 |
| PUT | /:id/status | 更新订单状态 | 是 |
| POST | /:id/notes | 添加备注 | 是 |
| PUT | /:id/deposit | 确认定金 | 是 |
| PUT | /:id/wig-received | 确认毛坯收货 | 是 |
| PUT | /:id/balance | 确认尾款 | 是 |
| PUT | /:id/ship | 发货 | 是 |

#### GET / (订单列表 with 统计) - PRD B-01 看板数据
```json
// Response
{
  "code": 0,
  "data": {
    "list": [...],
    "pagination": { "page": 1, "limit": 20, "total": 50 },
    "statusCount": {
      "pending_quote": 2,
      "pending_deposit": 3,
      "awaiting_wig_base": 5,   // 新增
      "queued": 4,
      "in_progress": 8,
      "in_review": 2,           // 新增
      "pending_balance": 1,
      "shipped": 3,
      "completed": 22,
      "total": 50
    },
    "deadlineAlerts": [         // PRD B-02 死线预警
      { "id": "...", "character_name": "初音", "deadline": "2026-02-01", "daysLeft": 3, "level": "red" },
      { "id": "...", "character_name": "魔法少女", "deadline": "2026-02-05", "daysLeft": 7, "level": "yellow" }
    ]
  }
}
```

#### PUT /:id/deposit (确认定金) - PRD 流程
```json
// Request
{
  "screenshot": "https://..."  // 定金支付截图
}

// Response (根据wig_source决定下一状态)
{
  "code": 0,
  "data": {
    "status": "awaiting_wig_base",  // 客户寄毛坯
    // 或
    "status": "queued"              // 毛娘代购
  }
}
```

#### PUT /:id/wig-received (确认毛坯收货) - PRD F-03 新增
```json
// Request
{
  "tracking_no": "SF1234567890"  // 可选: 快递单号
}

// Response
{
  "code": 0,
  "data": {
    "status": "queued",
    "wig_received_at": "2026-01-20T10:30:00Z"
  }
}
```

#### PUT /:id/ship (发货) - PRD S-01 发货清单
```json
// Request
{
  "shipping_company": "顺丰",
  "shipping_no": "SF9876543210",
  "checklist": {
    "balance_confirmed": true,    // 已确认尾款到账
    "cushioned": true,            // 已使用防震包装
    "insured": false              // 是否保价
  }
}
```

### 4.7 验收模块 `/api/v1/reviews` - **PRD R系列 新增**

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| POST | / | 创建验收(毛娘上传成品) | 是 |
| GET | /:id | 获取验收详情 | 是 |
| GET | /token/:token | 客户访问验收页 | 否 |
| POST | /:id/approve | 客户确认满意 | 否 |
| POST | /:id/revision | 客户申请修改 | 否 |
| PUT | /:id/revision/:revisionId | 毛娘提交修改 | 是 |

#### POST / (创建验收) - PRD R-01
```json
// Request
{
  "order_id": "uuid...",
  "images": ["https://...", "https://..."],
  "description": "成品已完成，请查看360度展示图"
}

// Response
{
  "code": 0,
  "data": {
    "id": "review-uuid",
    "review_url": "https://yuefa.com/review/abc123xyz",  // 发给客户的链接
    "max_revisions": 2
  }
}
```

#### GET /token/:token (客户验收页) - PRD R-01 验收专用页
```json
// Response
{
  "code": 0,
  "data": {
    "order": {
      "character_name": "初音未来",
      "source_work": "VOCALOID"
    },
    "images": ["https://...", "https://..."],
    "description": "...",
    "revision_count": 0,
    "max_revisions": 2,
    "is_approved": null,
    "revisions": []
  }
}
```

#### POST /:id/revision (申请修改) - PRD R-02
```json
// Request (通过token验证身份)
{
  "token": "abc123xyz",
  "request_content": "刘海希望再剪短一点",
  "request_images": ["https://..."]  // 参考图
}

// Response
{
  "code": 0,
  "data": {
    "revision_number": 1,
    "remaining_revisions": 1
  }
}
```

### 4.8 上传模块 `/api/v1/upload`

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| POST | /image | 上传图片 | 否* |

*客户端上传人设图不需要认证，毛娘上传需要认证

### 4.9 报告导出模块 `/api/v1/reports` - **PRD S-02 未来**

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| GET | /order/:id/pdf | 导出订单PDF凭证 | 是 |

---

## 5. 前端页面与组件规划

### 5.1 路由结构

```
/                           # 重定向到 /login
/login                      # 毛娘登录页

# 客户端页面 (无需登录)
/s/:slug                    # 毛娘公开主页 (作品+询价表单)
/review/:token              # 验收专用页 (PRD R-01 新增)

# 毛娘管理端 (需登录)
/admin                      # 重定向到 /admin/orders
/admin/orders               # 订单管理 (看板视图)
/admin/orders/:id           # 订单详情
/admin/orders/:id/review    # 创建验收 (PRD R-01 新增)
/admin/inquiries            # 询价管理 (新增独立页)
/admin/works                # 作品管理
/admin/profile              # 个人资料
```

### 5.2 页面设计

#### 5.2.1 客户公开主页 `/s/:slug`

**功能**: PRD F-01 结构化需求表单
- 作品集展示
- 询价表单 (增强版)
  - 角色/作品
  - 期望工期 (日历选择)
  - 头围数据 + 测量示意图
  - **毛坯来源选择** (新增)
  - 特殊要求 (发际线/炸毛/鬓角)
  - 预算范围
  - 人设图上传

#### 5.2.2 验收专用页 `/review/:token` - **PRD R-01 新增**

**功能**: 数字化验收闭环
- 干净简洁的背景
- 成品图片展示 (支持放大查看)
- 订单信息摘要
- 两个大按钮:
  - ✅ 确认满意，去付尾款
  - 🛠 申请修改 (剩余次数: N)
- 修改记录历史

#### 5.2.3 订单管理看板 `/admin/orders` - **PRD B-01 升级**

**功能**: 可视化状态流转看板
- 状态筛选栏 (9个状态)
- 新询价通知
- **死线预警** (PRD B-02)
  - 7天内: 黄色提醒
  - 3天内: 红色报警
- 订单卡片
  - 毛坯状态图标 📦 (PRD UI/UX)
  - 快速状态操作
- 下拉刷新 + 无限加载

#### 5.2.4 订单详情 `/admin/orders/:id` - **PRD B-03 升级**

**功能**: 工单详情页
- 客户信息
- 角色信息 + 人设图
- 头围数据
- **毛坯状态追踪** (新增)
  - 快递单号
  - 收货确认
- 价格信息
  - 总价/定金/尾款
  - 支付截图
- **制作笔记** (新增)
- 状态操作按钮
- 验收入口

### 5.3 组件规划

#### 5.3.1 新增组件

| 组件名 | 路径 | 功能 |
|--------|------|------|
| WigSourceSelector | components/WigSourceSelector.vue | 毛坯来源选择器 |
| HeadMeasureGuide | components/HeadMeasureGuide.vue | 头围测量示意图 |
| DeadlineAlert | components/DeadlineAlert.vue | 死线预警组件 |
| WigTrackingCard | components/WigTrackingCard.vue | 毛坯物流追踪卡片 |
| ReviewCreator | components/ReviewCreator.vue | 验收创建组件 |
| ReviewViewer | components/ReviewViewer.vue | 验收查看组件 |
| RevisionHistory | components/RevisionHistory.vue | 修改记录历史 |
| ShippingChecklist | components/ShippingChecklist.vue | 发货清单组件 |
| StatusKanban | components/StatusKanban.vue | 状态看板组件 |

#### 5.3.2 现有组件升级

| 组件名 | 升级内容 |
|--------|----------|
| InquiryForm | 添加毛坯来源、头围备注、特殊要求字段 |
| OrderCard | 添加毛坯状态图标、死线预警标识 |
| AdminTabbar | 添加询价Tab |

### 5.4 状态管理

```javascript
// stores/orders.js
export const useOrderStore = defineStore('orders', {
  state: () => ({
    orders: [],
    statusCount: {},
    deadlineAlerts: [],  // 新增
    currentOrder: null
  }),

  actions: {
    // 获取死线预警订单
    async fetchDeadlineAlerts() { ... },

    // 确认毛坯收货
    async confirmWigReceived(orderId, trackingNo) { ... },

    // 创建验收
    async createReview(orderId, data) { ... }
  }
})

// stores/reviews.js (新增)
export const useReviewStore = defineStore('reviews', {
  state: () => ({
    currentReview: null,
    revisions: []
  }),

  actions: {
    async fetchByToken(token) { ... },
    async approve(reviewId, token) { ... },
    async requestRevision(reviewId, data) { ... }
  }
})
```

---

## 6. 开发优先级与里程碑

### 6.1 P0 - MVP核心 (必须有)

#### Phase 1: 询价表单升级
- [ ] 询价表单添加毛坯来源选择
- [ ] 询价表单添加头围备注字段
- [ ] 询价表单添加特殊要求字段
- [ ] 头围测量示意图组件

#### Phase 2: 订单状态扩展
- [ ] 数据库迁移: orders表新增字段
- [ ] 后端: 9个状态的流转逻辑
- [ ] 前端: 状态筛选栏更新
- [ ] 前端: 订单卡片状态显示

#### Phase 3: 毛坯管理
- [ ] 后端: 毛坯收货确认API
- [ ] 前端: 毛坯状态追踪卡片
- [ ] 前端: 订单卡片毛坯图标

#### Phase 4: 简易验收
- [ ] 数据库: reviews表
- [ ] 后端: 创建验收API
- [ ] 后端: 验收链接生成
- [ ] 前端: 验收创建页
- [ ] 前端: 验收专用页 (客户端)
- [ ] 前端: 确认满意按钮 (手动改状态)

### 6.2 P1 - 增强功能 (下一步)

#### 验收交互完善
- [ ] 验收页确认/修改按钮交互
- [ ] 修改记录功能
- [ ] 修改次数限制
- [ ] 状态自动流转

#### 自动计算
- [ ] 报价时自动计算20%/80%金额
- [ ] 价格编辑时自动更新

#### 发货功能
- [ ] 发货清单Checklist
- [ ] 快递单号录入
- [ ] 发货状态通知

#### 死线预警
- [ ] 后端: 预警计算逻辑
- [ ] 前端: 预警组件
- [ ] 前端: 预警样式 (黄/红)

### 6.3 P2 - 未来迭代

- [ ] PDF凭证导出 (维权证据)
- [ ] 物流接口对接 (自动查询快递)
- [ ] 视频验收支持
- [ ] 消息通知系统
- [ ] 数据统计分析

---

## 7. 测试方案

### 7.1 单元测试

#### 后端测试 (Vitest + Supertest)

```javascript
// tests/orders.test.js
describe('Order Status Flow', () => {
  it('should transition from pending_deposit to awaiting_wig_base when wig_source is client_sends', async () => {
    // ...
  })

  it('should transition from pending_deposit to queued when wig_source is stylist_buys', async () => {
    // ...
  })

  it('should auto-calculate deposit and balance from price', async () => {
    // price: 500 => deposit: 100, balance: 400
  })
})

// tests/reviews.test.js
describe('Review Flow', () => {
  it('should create review and generate unique token', async () => {})
  it('should limit revisions to max_revisions', async () => {})
  it('should update order status to pending_balance on approval', async () => {})
})
```

#### 前端测试 (Vitest + Vue Test Utils)

```javascript
// tests/InquiryForm.test.js
describe('InquiryForm', () => {
  it('should include wig_source field', () => {})
  it('should show head measure guide on icon click', () => {})
})

// tests/ReviewViewer.test.js
describe('ReviewViewer', () => {
  it('should show remaining revision count', () => {})
  it('should disable revision button when count is 0', () => {})
})
```

### 7.2 集成测试

```javascript
// tests/integration/order-flow.test.js
describe('Complete Order Flow', () => {
  it('should complete full flow: inquiry -> order -> review -> ship -> complete', async () => {
    // 1. 客户提交询价
    // 2. 毛娘报价
    // 3. 转为订单
    // 4. 确认定金
    // 5. 确认毛坯收货 (if client_sends)
    // 6. 开始制作
    // 7. 创建验收
    // 8. 客户确认
    // 9. 确认尾款
    // 10. 发货
    // 11. 完成
  })
})
```

### 7.3 E2E测试 (Playwright)

```javascript
// e2e/customer-journey.spec.js
test('客户可以提交询价并查看验收', async ({ page }) => {
  // 访问毛娘主页
  await page.goto('/s/maoyi-xiaomei')

  // 填写询价表单
  await page.fill('[name="character_name"]', '初音未来')
  await page.selectOption('[name="wig_source"]', 'client_sends')
  // ...

  // 提交
  await page.click('button[type="submit"]')

  // 验证成功
  await expect(page.locator('.success-message')).toBeVisible()
})

// e2e/review-flow.spec.js
test('客户可以在验收页确认满意或申请修改', async ({ page }) => {
  await page.goto('/review/abc123token')

  // 查看成品图
  await expect(page.locator('.review-images img')).toHaveCount(3)

  // 申请修改
  await page.click('button:has-text("申请修改")')
  await page.fill('[name="request_content"]', '刘海再短一点')
  await page.click('button:has-text("提交")')

  // 验证剩余次数更新
  await expect(page.locator('.remaining-revisions')).toContainText('1')
})
```

---

## 8. 部署方案

### 8.1 环境配置

#### 开发环境 (本地)
```bash
# .env.development
NODE_ENV=development
DB_TYPE=sqlite
DB_PATH=./data/yuefa.db
JWT_SECRET=dev-secret
```

#### 测试环境
```bash
# .env.test
NODE_ENV=test
DB_TYPE=sqlite
DB_PATH=:memory:
JWT_SECRET=test-secret
```

#### 生产环境
```bash
# .env.production
NODE_ENV=production
DB_TYPE=postgres
DATABASE_URL=postgresql://user:pass@host:5432/yuefa
JWT_SECRET=<strong-secret>
CORS_ORIGIN=https://yuefa.com
```

### 8.2 Docker配置

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# 安装pnpm
RUN npm install -g pnpm

# 复制依赖文件
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/server/package.json ./packages/server/
COPY packages/web/package.json ./packages/web/

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制源码
COPY . .

# 构建
RUN pnpm build

# 暴露端口
EXPOSE 4000

# 启动
CMD ["node", "packages/server/dist/index.js"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/yuefa
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=yuefa
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./dist:/usr/share/nginx/html
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
```

### 8.3 Nginx配置

```nginx
# nginx.conf
server {
    listen 80;
    server_name yuefa.com;

    # 前端静态文件
    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
    }

    # API代理
    location /api {
        proxy_pass http://app:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # 文件上传
    location /uploads {
        alias /app/uploads;
    }
}
```

### 8.4 数据库迁移

```javascript
// migrations/001_add_wig_fields.js
export async function up(db) {
  // 添加毛坯相关字段
  await db.query(`
    ALTER TABLE orders
    ADD COLUMN wig_source VARCHAR(20) DEFAULT 'client_sends',
    ADD COLUMN wig_tracking_no VARCHAR(50),
    ADD COLUMN wig_received_at TIMESTAMP,
    ADD COLUMN wig_purchase_fee DECIMAL(10,2)
  `)

  // 添加尾款字段
  await db.query(`
    ALTER TABLE orders
    ADD COLUMN balance DECIMAL(10,2),
    ADD COLUMN balance_paid_at TIMESTAMP,
    ADD COLUMN balance_screenshot TEXT
  `)
}

export async function down(db) {
  // 回滚
  await db.query(`
    ALTER TABLE orders
    DROP COLUMN wig_source,
    DROP COLUMN wig_tracking_no,
    DROP COLUMN wig_received_at,
    DROP COLUMN wig_purchase_fee,
    DROP COLUMN balance,
    DROP COLUMN balance_paid_at,
    DROP COLUMN balance_screenshot
  `)
}
```

```javascript
// migrations/002_create_reviews.js
export async function up(db) {
  await db.query(`
    CREATE TABLE reviews (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      order_id UUID NOT NULL REFERENCES orders(id),
      images TEXT NOT NULL,
      description TEXT,
      review_token VARCHAR(100) UNIQUE,
      review_url TEXT,
      is_approved BOOLEAN,
      approved_at TIMESTAMP,
      max_revisions SMALLINT DEFAULT 2,
      revision_count SMALLINT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  await db.query(`
    CREATE TABLE review_revisions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      review_id UUID NOT NULL REFERENCES reviews(id),
      revision_number SMALLINT NOT NULL,
      request_content TEXT NOT NULL,
      request_images TEXT,
      requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      response_images TEXT,
      response_notes TEXT,
      completed_at TIMESTAMP,
      is_satisfied BOOLEAN,
      confirmed_at TIMESTAMP
    )
  `)

  await db.query(`CREATE INDEX idx_reviews_order_id ON reviews(order_id)`)
  await db.query(`CREATE INDEX idx_reviews_token ON reviews(review_token)`)
  await db.query(`CREATE INDEX idx_revisions_review_id ON review_revisions(review_id)`)
}
```

---

## 9. 附录

### 9.1 订单状态中英文对照

| 状态值 | 中文 | 说明 |
|--------|------|------|
| pending_quote | 待报价 | 询价已提交，等待毛娘报价 |
| pending_deposit | 待付定金 | 已报价，等待客户付定金 |
| awaiting_wig_base | 等毛坯 | 定金已付，等待客户寄毛坯 |
| queued | 排单中 | 毛坯已到/代购，等待开始制作 |
| in_progress | 制作中 | 正在制作 |
| in_review | 验收中 | 已上传成品，等待客户验收 |
| pending_balance | 待尾款 | 验收通过，等待客户付尾款 |
| shipped | 已发货 | 已发货，等待客户确认收货 |
| completed | 已完成 | 交易完成 |

### 9.2 错误码定义

| 错误码 | 说明 |
|--------|------|
| 1001 | 参数验证失败 |
| 2001 | 认证失败 |
| 2002 | 无权限 |
| 3001 | 资源不存在 |
| 3002 | 状态流转错误 |
| 3003 | 修改次数已用完 |
| 4001 | 服务器内部错误 |

### 9.3 文件目录结构 (规划)

```
codes/
├── packages/
│   ├── web/
│   │   ├── src/
│   │   │   ├── api/
│   │   │   │   ├── reviews.js          # 新增
│   │   │   │   └── ...
│   │   │   ├── components/
│   │   │   │   ├── WigSourceSelector.vue   # 新增
│   │   │   │   ├── HeadMeasureGuide.vue    # 新增
│   │   │   │   ├── DeadlineAlert.vue       # 新增
│   │   │   │   ├── WigTrackingCard.vue     # 新增
│   │   │   │   ├── ReviewCreator.vue       # 新增
│   │   │   │   ├── ReviewViewer.vue        # 新增
│   │   │   │   ├── RevisionHistory.vue     # 新增
│   │   │   │   ├── ShippingChecklist.vue   # 新增
│   │   │   │   └── ...
│   │   │   ├── views/
│   │   │   │   ├── client/
│   │   │   │   │   ├── PublicPage.vue
│   │   │   │   │   └── ReviewPage.vue      # 新增
│   │   │   │   └── admin/
│   │   │   │       ├── Orders.vue          # 升级
│   │   │   │       ├── OrderDetail.vue     # 升级
│   │   │   │       ├── CreateReview.vue    # 新增
│   │   │   │       └── ...
│   │   │   └── stores/
│   │   │       ├── reviews.js              # 新增
│   │   │       └── ...
│   │   └── ...
│   └── server/
│       ├── src/
│       │   ├── models/
│       │   │   ├── Review.js               # 新增
│       │   │   ├── ReviewRevision.js       # 新增
│       │   │   └── ...
│       │   ├── routes/
│       │   │   ├── reviews.js              # 新增
│       │   │   └── ...
│       │   └── migrations/                 # 新增
│       │       ├── 001_add_wig_fields.js
│       │       └── 002_create_reviews.js
│       └── ...
└── ...
```

---

**文档结束**

> 本文档基于 PRD 2.0 流程深度整合版编写，详细规划了约发MVP的技术选型、数据库设计、API接口、前端组件和开发里程碑。开发过程中请持续参考本文档，并根据实际情况进行调整。
