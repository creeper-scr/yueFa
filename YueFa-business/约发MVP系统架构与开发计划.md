# 约发 YueFa - MVP系统架构与开发计划

## 项目概述

为Cosplay假发造型师（毛娘）设计的**"展示作品+收集询价+管理订单"**移动端H5工具。

**MVP目标：** 让毛娘能发链接，客户能填表，毛娘能管理订单全流程。

---

## 一、技术方案

### 核心选型原则
- **开发效率优先**：选择文档丰富、AI熟悉的技术栈
- **一键部署**：最少配置，快速看到效果
- **渐进式开发**：先跑通核心流程，再完善细节

### 技术栈

| 层级 | 技术 | 理由 |
|------|------|------|
| **前端框架** | Vue 3 + Vite | 简单直观，AI辅助生成效果好 |
| **UI组件** | Vant 4 | 移动端开箱即用，组件完善 |
| **后端** | Node.js + Express | 语法简单，一套语言通吃前后端 |
| **数据库** | SQLite (开发) / 阿里云RDS (生产) | 开发阶段零配置，无需云服务 |
| **部署** | 阿里云函数计算 FC | Serverless，按量付费 |
| **存储** | 阿里云 OSS | 图片上传 |
| **短信** | 阿里云 SMS | 验证码登录 |

### 开发环境要求
- Node.js 18+
- pnpm (包管理器)
- VSCode

---

## 二、系统架构图

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              客户端层                                    │
│   ┌─────────────────────┐      ┌─────────────────────┐                 │
│   │   客户浏览页 (H5)     │      │   毛娘管理端 (H5)    │                 │
│   │  - 作品集展示        │      │  - 登录/注册        │                 │
│   │  - 询价表单         │      │  - 主页编辑         │                 │
│   │  - 联系方式展示      │      │  - 订单管理         │                 │
│   └─────────────────────┘      └─────────────────────┘                 │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │ HTTPS
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              接入层                                      │
│       CDN (静态资源)  ←→  API网关 (路由/限流/鉴权)  ←→  OSS CDN (图片)    │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       服务层 (Serverless函数)                            │
│   Auth Service → User Service → Order Service → Upload Service          │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              数据层                                      │
│            云数据库 (MySQL)              对象存储 (OSS)                   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 三、项目结构

```
yuefa/
├── packages/
│   ├── web/                       # 前端应用 (Vue 3)
│   │   └── src/
│   │       ├── views/
│   │       │   ├── client/        # 客户端页面
│   │       │   │   └── PublicPage.vue    # 作品展示+询价
│   │       │   └── admin/         # 毛娘管理端
│   │       │       ├── Login.vue
│   │       │       ├── Profile.vue
│   │       │       ├── Works.vue
│   │       │       ├── Orders.vue
│   │       │       └── OrderDetail.vue
│   │       ├── components/
│   │       ├── stores/
│   │       └── api/
│   │
│   └── server/                    # 后端API (Node.js)
│       └── src/
│           ├── routes/
│           │   ├── auth.js
│           │   ├── users.js
│           │   ├── works.js
│           │   ├── inquiries.js
│           │   └── orders.js
│           ├── models/
│           ├── middleware/
│           └── app.js
│
├── package.json
└── pnpm-workspace.yaml
```

---

## 四、数据库设计

### 核心表（4张表）

#### 1. users（毛娘用户表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 主键UUID |
| phone | string | 手机号（登录凭证）|
| nickname | string | 店铺名/昵称 |
| avatar_url | string | 头像URL |
| wechat_id | string | 微信号 |
| announcement | text | 公告 |
| slug | string | 专属链接后缀 (如: maoyang001) |
| created_at | timestamp | 创建时间 |

#### 2. works（作品表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 主键UUID |
| user_id | string | 关联毛娘 |
| image_url | string | 作品图片 |
| title | string | 角色名 |
| source_work | string | 作品出处 |
| tags | json | 标签数组 |
| sort_order | int | 排序 |

#### 3. inquiries（询价表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 主键UUID |
| user_id | string | 目标毛娘 |
| customer_name | string | 客户称呼 |
| customer_contact | string | 联系方式 |
| character_name | string | 角色名 |
| source_work | string | 作品名 |
| expected_deadline | date | 期望工期 |
| head_circumference | string | 头围 |
| budget_range | string | 预算范围 |
| reference_images | json | 人设图URL数组 |
| requirements | text | 其他要求 |
| status | string | new/converted/rejected |
| created_at | timestamp | 提交时间 |

#### 4. orders（订单表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 主键UUID |
| user_id | string | 毛娘ID |
| inquiry_id | string | 关联询价 |
| customer_name | string | 客户 |
| customer_contact | string | 联系方式 |
| character_name | string | 角色名 |
| deadline | date | 交付日期 |
| price | decimal | 成交价 |
| deposit | decimal | 定金 |
| reference_images | json | 人设图 |
| requirements | text | 制作要求 |
| status | string | 状态 |
| notes | json | 备注数组 |
| created_at | timestamp | 创建时间 |

### 订单状态流转
```
pending_deposit (待定金) → in_production (制作中) → pending_ship (待发货) → completed (已完成)
```

### SQL建表语句

```sql
-- 用户表
CREATE TABLE users (
    id              VARCHAR(36) PRIMARY KEY,
    phone           VARCHAR(20) NOT NULL UNIQUE,
    nickname        VARCHAR(50),
    avatar_url      VARCHAR(500),
    wechat_id       VARCHAR(50),
    announcement    TEXT,
    slug            VARCHAR(50) UNIQUE,
    status          TINYINT DEFAULT 1,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_phone (phone),
    INDEX idx_slug (slug)
);

-- 作品表
CREATE TABLE works (
    id              VARCHAR(36) PRIMARY KEY,
    user_id         VARCHAR(36) NOT NULL,
    image_url       VARCHAR(500) NOT NULL,
    thumbnail_url   VARCHAR(500),
    title           VARCHAR(100),
    source_work     VARCHAR(100),
    tags            JSON,
    sort_order      INT DEFAULT 0,
    status          TINYINT DEFAULT 1,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 询价表
CREATE TABLE inquiries (
    id                  VARCHAR(36) PRIMARY KEY,
    user_id             VARCHAR(36) NOT NULL,
    customer_name       VARCHAR(50),
    customer_contact    VARCHAR(100),
    character_name      VARCHAR(100) NOT NULL,
    source_work         VARCHAR(100),
    expected_deadline   DATE,
    head_circumference  VARCHAR(20),
    budget_range        VARCHAR(50),
    reference_images    JSON,
    requirements        TEXT,
    status              VARCHAR(20) DEFAULT 'new',
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 订单表
CREATE TABLE orders (
    id                  VARCHAR(36) PRIMARY KEY,
    user_id             VARCHAR(36) NOT NULL,
    inquiry_id          VARCHAR(36),
    customer_name       VARCHAR(50),
    customer_contact    VARCHAR(100),
    character_name      VARCHAR(100) NOT NULL,
    source_work         VARCHAR(100),
    deadline            DATE,
    head_circumference  VARCHAR(20),
    price               DECIMAL(10,2),
    deposit             DECIMAL(10,2),
    reference_images    JSON,
    requirements        TEXT,
    status              VARCHAR(20) DEFAULT 'pending_deposit',
    notes               JSON,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (inquiry_id) REFERENCES inquiries(id)
);
```

---

## 五、API设计

### 5.1 API规范

- **基础URL**: `https://api.yuefa.app/v1`
- **认证方式**: Bearer Token (JWT)
- **响应格式**: JSON

### 5.2 核心接口列表

#### 认证模块 (Auth)

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| POST | `/auth/sms/send` | 发送短信验证码 | 否 |
| POST | `/auth/login` | 手机号验证码登录 | 否 |
| GET | `/auth/me` | 获取当前用户信息 | 是 |

**发送验证码请求:**
```json
POST /auth/sms/send
{
    "phone": "13800138000"
}
```

**登录请求:**
```json
POST /auth/login
{
    "phone": "13800138000",
    "code": "123456"
}
```

**登录响应:**
```json
{
    "code": 0,
    "data": {
        "token": "eyJhbGciOiJIUzI1NiIs...",
        "user": {
            "id": "uuid",
            "phone": "138****8000",
            "nickname": "毛娘小店",
            "slug": "shop001"
        }
    }
}
```

#### 用户/店铺模块 (User)

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| GET | `/users/profile` | 获取当前用户完整信息 | 是 |
| PUT | `/users/profile` | 更新用户信息 | 是 |
| GET | `/users/:slug` | 根据slug获取毛娘公开主页 | 否 |

**更新用户信息:**
```json
PUT /users/profile
{
    "nickname": "毛娘小店",
    "avatar_url": "https://oss.yuefa.app/avatars/xxx.jpg",
    "wechat_id": "maoyang_wx",
    "announcement": "档期排至2月底，急单请私聊~",
    "slug": "maoyang001"
}
```

#### 作品模块 (Works)

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| GET | `/works` | 获取当前用户的作品列表 | 是 |
| POST | `/works` | 上传新作品 | 是 |
| PUT | `/works/:id` | 更新作品信息 | 是 |
| DELETE | `/works/:id` | 删除作品 | 是 |
| GET | `/users/:slug/works` | 获取指定毛娘的公开作品列表 | 否 |

**创建作品:**
```json
POST /works
{
    "image_url": "https://oss.yuefa.app/works/xxx.jpg",
    "title": "雷电将军",
    "source_work": "原神",
    "tags": ["长发", "渐变紫", "编发"]
}
```

#### 询价模块 (Inquiries)

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| POST | `/inquiries` | 客户提交询价 | 否 |
| GET | `/inquiries` | 获取询价列表 (毛娘端) | 是 |
| GET | `/inquiries/:id` | 获取询价详情 | 是 |
| POST | `/inquiries/:id/convert` | 将询价转为订单 | 是 |
| PUT | `/inquiries/:id/reject` | 拒绝询价 | 是 |

**客户提交询价:**
```json
POST /inquiries
{
    "user_slug": "maoyang001",
    "customer_name": "小明",
    "customer_contact": "wx: xiaoming",
    "character_name": "胡桃",
    "source_work": "原神",
    "expected_deadline": "2026-03-01",
    "head_circumference": "56cm",
    "budget_range": "400-600",
    "reference_images": ["https://xxx/ref1.jpg"],
    "requirements": "希望刘海可以做成M字型"
}
```

#### 订单模块 (Orders)

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| GET | `/orders` | 获取订单列表 | 是 |
| GET | `/orders/:id` | 获取订单详情 | 是 |
| PUT | `/orders/:id` | 更新订单信息 | 是 |
| PUT | `/orders/:id/status` | 更新订单状态 | 是 |
| POST | `/orders/:id/notes` | 添加订单备注 | 是 |

**获取订单列表 (支持状态筛选):**
```
GET /orders?status=in_production&page=1&limit=20
```

**更新订单状态:**
```json
PUT /orders/xxx/status
{
    "status": "in_production"
}
```

**添加备注:**
```json
POST /orders/xxx/notes
{
    "content": "客户确认修改发色为深紫色"
}
```

#### 上传模块 (Upload)

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| POST | `/upload/presign` | 获取OSS预签名上传URL | 是 |

**获取预签名URL:**
```json
POST /upload/presign
{
    "type": "work",
    "filename": "photo.jpg",
    "content_type": "image/jpeg"
}
```

**响应:**
```json
{
    "code": 0,
    "data": {
        "upload_url": "https://yuefa-bucket.oss.aliyuncs.com/...",
        "file_url": "https://cdn.yuefa.app/works/xxx.jpg",
        "expires_in": 3600
    }
}
```

### 5.3 错误码定义

| 错误码 | 含义 |
|--------|------|
| 0 | 成功 |
| 1001 | 参数错误 |
| 1002 | 验证码错误或过期 |
| 1003 | 手机号格式错误 |
| 2001 | 未登录或Token过期 |
| 2002 | 无权限访问 |
| 3001 | 资源不存在 |
| 3002 | slug已被占用 |
| 5001 | 服务器内部错误 |

---

## 六、页面清单

| 页面 | 路由 | 功能 | 优先级 |
|------|------|------|--------|
| 登录页 | /login | 手机号+验证码登录 | P0 |
| 毛娘主页编辑 | /admin/profile | 设置头像、微信号、公告 | P0 |
| 作品管理 | /admin/works | 上传/管理作品图片 | P1 |
| 订单列表 | /admin/orders | 查看询价，管理订单状态 | P0 |
| 订单详情 | /admin/orders/:id | 查看详情，添加备注 | P0 |
| 客户浏览页 | /s/:slug | 作品展示+询价表单 | P0 |

---

## 七、开发计划

### 第一阶段：快速原型（立即可见效果）

#### Step 1: 项目初始化
- 创建monorepo项目结构
- 安装Vue 3 + Vant + TailwindCSS
- 配置开发环境

#### Step 2: 客户浏览页（静态版）
- 创建 PublicPage.vue
- 实现瀑布流作品展示（mock数据）
- 实现询价表单UI
- 实现一键复制微信号

#### Step 3: 毛娘管理端（静态版）
- 创建登录页UI
- 创建订单列表页UI
- 创建订单详情页UI
- 全部使用mock数据

**产出：** 可以在本地运行，看到完整的UI效果

---

### 第二阶段：接入后端

#### Step 4: 后端API搭建
- Express应用初始化
- SQLite数据库配置（本地开发）
- 创建数据表
- 实现CRUD API

#### Step 5: 前后端联调
- 前端对接真实API
- 实现数据增删改查

**产出：** 完整功能可本地运行

---

### 第三阶段：部署上线

#### Step 6: 云服务配置
- 阿里云函数计算FC
- 阿里云OSS图片存储
- 阿里云RDS MySQL
- 阿里云SMS短信

#### Step 7: 部署上线
- 前端部署到OSS + CDN
- 后端部署到函数计算
- 配置域名

**产出：** 正式上线可访问

---

## 八、关键文件清单

### 前端（packages/web/src/）
```
views/
├── client/PublicPage.vue      # 客户浏览页（作品+询价）
└── admin/
    ├── Login.vue              # 登录页
    ├── Profile.vue            # 主页编辑
    ├── Works.vue              # 作品管理
    ├── Orders.vue             # 订单列表
    └── OrderDetail.vue        # 订单详情

components/
├── WorkGallery.vue            # 瀑布流组件
├── InquiryForm.vue            # 询价表单
├── ImageUploader.vue          # 图片上传
└── OrderCard.vue              # 订单卡片

api/
├── auth.js                    # 认证API
├── user.js                    # 用户API
├── works.js                   # 作品API
└── orders.js                  # 订单API
```

### 后端（packages/server/src/）
```
routes/
├── auth.js                    # 登录/验证码
├── users.js                   # 用户CRUD
├── works.js                   # 作品CRUD
├── inquiries.js               # 询价CRUD
└── orders.js                  # 订单CRUD

models/
├── User.js
├── Work.js
├── Inquiry.js
└── Order.js

middleware/
├── auth.js                    # JWT验证
└── upload.js                  # 文件上传
```

---

## 九、部署架构

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              阿里云部署架构                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │                        DNS (阿里云DNS)                                │  │
│   │   yuefa.app -> CDN                                                  │  │
│   │   api.yuefa.app -> API网关                                          │  │
│   │   cdn.yuefa.app -> OSS CDN                                          │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│                    ┌───────────────┼───────────────┐                       │
│                    ▼               ▼               ▼                       │
│   ┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐ │
│   │    CDN (前端静态)    │ │    API网关          │ │    OSS CDN (图片)   │ │
│   │   - web/dist       │ │   - 路由分发         │ │   - 作品图          │ │
│   └─────────────────────┘ │   - 限流            │ │   - 头像            │ │
│                          └──────────┬──────────┘ └─────────────────────┘ │
│                                     │                                      │
│                                     ▼                                      │
│   ┌─────────────────────────────────────────────────────────────────────┐ │
│   │                     函数计算 FC (Serverless)                          │ │
│   │   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐              │ │
│   │   │ auth-fn  │ │ user-fn  │ │ work-fn  │ │ order-fn │              │ │
│   │   └──────────┘ └──────────┘ └──────────┘ └──────────┘              │ │
│   └─────────────────────────────────────────────────────────────────────┘ │
│                                     │                                      │
│                    ┌────────────────┼────────────────┐                    │
│                    ▼                ▼                ▼                    │
│   ┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐│
│   │    RDS MySQL        │ │    OSS (存储)        │ │    SMS (短信)       ││
│   └─────────────────────┘ └─────────────────────┘ └─────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 十、成本预估

| 服务 | 规格 | 月费用 |
|------|------|--------|
| 函数计算 | 免费额度内 | 0元 |
| RDS MySQL | 1核1G | ~30元 |
| OSS | 50GB | ~5元 |
| CDN | 100GB | ~20元 |
| 短信 | 1000条 | ~40元 |
| **合计** | | **~100元/月** |

---

## 十一、验证方案

### 核心流程测试

1. **客户询价流程**
   - 访问 `/s/maoyang001` 查看毛娘主页
   - 浏览作品瀑布流
   - 点击"我要询价"填写表单
   - 上传人设图
   - 提交成功

2. **毛娘管理流程**
   - 登录管理后台
   - 查看新询价通知
   - 将询价转为订单
   - 更新订单状态
   - 添加制作备注

3. **完整链路**
   - 毛娘编辑主页 → 获取分享链接
   - 客户打开链接 → 提交询价
   - 毛娘收到 → 转为订单 → 状态流转至完成

---

## 十二、技术风险与应对

| 风险 | 影响 | 应对措施 |
|------|------|----------|
| 域名被微信封禁 | 链接无法打开 | MVP先用单域名测试，后期准备域名池 |
| 短信接口被刷 | 成本飙升 | 限制IP发送频率，加图形验证码 |
| 图片过大加载慢 | 用户体验差 | 前端压缩 + OSS图片处理 + CDN |
| 数据库连接数限制 | 请求失败 | 使用连接池，Serverless自动伸缩 |
| JWT被盗用 | 安全问题 | 设置较短过期时间，支持刷新Token |

---

## 十三、后续迭代规划

**MVP上线后可快速迭代的功能:**

1. **微信消息推送** - 新询价提醒 (使用微信公众号模板消息)
2. **数据统计面板** - 询价量、转化率、订单量趋势
3. **批量导入作品** - 从相册批量选择上传
4. **协议签署** - 客户勾选阅读协议
5. **档期状态** - 首页显示当前排单状态
6. **看板视图** - Trello风格拖拽管理订单
7. **智能日历** - 显示每日任务，临近发货提醒
