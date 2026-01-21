-- YueFa 数据库初始化迁移脚本
-- PostgreSQL 版本

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    phone VARCHAR(20) NOT NULL UNIQUE,
    nickname VARCHAR(100),
    avatar_url TEXT,
    wechat_id VARCHAR(100),
    announcement TEXT,
    slug VARCHAR(100) UNIQUE,
    status INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 作品表
CREATE TABLE IF NOT EXISTS works (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    thumbnail_url TEXT,
    title VARCHAR(200),
    source_work VARCHAR(200),
    tags TEXT,
    sort_order INTEGER DEFAULT 0,
    status INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 询价表
CREATE TABLE IF NOT EXISTS inquiries (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    customer_name VARCHAR(100),
    customer_contact VARCHAR(200),
    character_name VARCHAR(200) NOT NULL,
    source_work VARCHAR(200),
    expected_deadline DATE,
    head_circumference VARCHAR(50),
    head_notes TEXT,
    wig_source VARCHAR(50) DEFAULT 'client_sends',
    budget_range VARCHAR(100),
    reference_images TEXT,
    special_requirements TEXT,
    status VARCHAR(50) DEFAULT 'new',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 订单表 (9状态流转: pending_quote, quoted, waiting_wig, wig_received, production, ready_shipping, shipped, delivered, completed)
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    inquiry_id VARCHAR(36) REFERENCES inquiries(id) ON DELETE SET NULL,
    customer_name VARCHAR(100),
    customer_contact VARCHAR(200),
    character_name VARCHAR(200) NOT NULL,
    source_work VARCHAR(200),
    reference_images TEXT,
    head_circumference VARCHAR(50),
    head_notes TEXT,

    -- 毛坯管理
    wig_source VARCHAR(50) DEFAULT 'client_sends',
    wig_tracking_no VARCHAR(100),
    wig_received_at TIMESTAMP,
    wig_purchase_fee DECIMAL(10,2),

    -- 价格信息
    price DECIMAL(10,2),
    deposit DECIMAL(10,2),
    balance DECIMAL(10,2),
    deposit_paid_at TIMESTAMP,
    deposit_screenshot TEXT,
    balance_paid_at TIMESTAMP,
    balance_screenshot TEXT,

    -- 工期管理
    deadline DATE,

    -- 发货信息
    shipping_no VARCHAR(100),
    shipping_company VARCHAR(100),
    shipped_at TIMESTAMP,
    shipping_checklist TEXT,

    -- 制作笔记
    production_notes TEXT,
    notes TEXT,

    -- 订单状态
    status VARCHAR(50) DEFAULT 'pending_quote',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 验收记录表
CREATE TABLE IF NOT EXISTS reviews (
    id VARCHAR(36) PRIMARY KEY,
    order_id VARCHAR(36) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    images TEXT NOT NULL,
    description TEXT,
    review_token VARCHAR(100) UNIQUE,
    review_url TEXT,
    is_approved BOOLEAN,
    approved_at TIMESTAMP,
    max_revisions INTEGER DEFAULT 2,
    revision_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 修改记录表
CREATE TABLE IF NOT EXISTS review_revisions (
    id VARCHAR(36) PRIMARY KEY,
    review_id VARCHAR(36) NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    revision_number INTEGER NOT NULL,
    request_content TEXT NOT NULL,
    request_images TEXT,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    response_images TEXT,
    response_notes TEXT,
    completed_at TIMESTAMP,
    is_satisfied BOOLEAN,
    confirmed_at TIMESTAMP
);

-- 验证码表
CREATE TABLE IF NOT EXISTS sms_codes (
    id VARCHAR(36) PRIMARY KEY,
    phone VARCHAR(20) NOT NULL,
    code VARCHAR(10) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_slug ON users(slug);
CREATE INDEX IF NOT EXISTS idx_works_user_id ON works(user_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_user_id ON inquiries(user_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_deadline ON orders(deadline);
CREATE INDEX IF NOT EXISTS idx_sms_codes_phone ON sms_codes(phone);
CREATE INDEX IF NOT EXISTS idx_reviews_order_id ON reviews(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_token ON reviews(review_token);
CREATE INDEX IF NOT EXISTS idx_revisions_review_id ON review_revisions(review_id);

-- 创建 updated_at 自动更新触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为需要的表创建触发器
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;
CREATE TRIGGER update_reviews_updated_at
    BEFORE UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
