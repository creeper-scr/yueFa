import { selectOne, selectQuery, runQuery } from './index.js'
import { v4 as uuidv4 } from 'uuid'

// PRD 2.0 订单状态常量 (9个状态)
export const ORDER_STATUS = {
  PENDING_QUOTE: 'pending_quote', // 待报价
  PENDING_DEPOSIT: 'pending_deposit', // 待付定金
  AWAITING_WIG_BASE: 'awaiting_wig_base', // 等毛坯 (客户寄)
  QUEUED: 'queued', // 排单中
  IN_PROGRESS: 'in_progress', // 制作中
  IN_REVIEW: 'in_review', // 验收中
  PENDING_BALANCE: 'pending_balance', // 待尾款
  SHIPPED: 'shipped', // 已发货
  COMPLETED: 'completed' // 已完成
}

// 状态中文映射
export const ORDER_STATUS_TEXT = {
  pending_quote: '待报价',
  pending_deposit: '待付定金',
  awaiting_wig_base: '等毛坯',
  queued: '排单中',
  in_progress: '制作中',
  in_review: '验收中',
  pending_balance: '待尾款',
  shipped: '已发货',
  completed: '已完成'
}

// 有效的状态流转规则
export const VALID_STATUS_TRANSITIONS = {
  pending_quote: ['pending_deposit'],
  pending_deposit: ['awaiting_wig_base', 'queued'], // 根据wig_source决定
  awaiting_wig_base: ['queued'],
  queued: ['in_progress'],
  in_progress: ['in_review'],
  in_review: ['pending_balance', 'in_review'], // 修改后仍在验收中
  pending_balance: ['shipped'],
  shipped: ['completed'],
  completed: []
}

export const OrderModel = {
  // 根据ID查找订单
  findById(id) {
    const row = selectOne('SELECT * FROM orders WHERE id = ?', [id])
    if (!row) return null

    return this._parseOrder(row)
  },

  // 解析订单数据
  _parseOrder(row) {
    return {
      ...row,
      reference_images: row.reference_images ? JSON.parse(row.reference_images) : [],
      notes: row.notes ? JSON.parse(row.notes) : [],
      shipping_checklist: row.shipping_checklist ? JSON.parse(row.shipping_checklist) : null
    }
  },

  // 获取用户的订单列表
  findByUserId(userId, { status, page = 1, limit = 20 } = {}) {
    let sql = 'SELECT * FROM orders WHERE user_id = ?'
    const params = [userId]

    if (status) {
      sql += ' AND status = ?'
      params.push(status)
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    params.push(limit, (page - 1) * limit)

    const rows = selectQuery(sql, params)
    return rows.map((row) => this._parseOrder(row))
  },

  // 获取订单总数
  countByUserId(userId, status) {
    let sql = 'SELECT COUNT(*) as count FROM orders WHERE user_id = ?'
    const params = [userId]

    if (status) {
      sql += ' AND status = ?'
      params.push(status)
    }

    const result = selectOne(sql, params)
    return result ? result.count : 0
  },

  // 按状态统计订单数 (PRD 2.0 升级为9状态)
  countByStatus(userId) {
    const rows = selectQuery(
      `
      SELECT status, COUNT(*) as count
      FROM orders
      WHERE user_id = ?
      GROUP BY status
    `,
      [userId]
    )

    const result = {
      pending_quote: 0,
      pending_deposit: 0,
      awaiting_wig_base: 0,
      queued: 0,
      in_progress: 0,
      in_review: 0,
      pending_balance: 0,
      shipped: 0,
      completed: 0,
      total: 0
    }

    for (const row of rows) {
      if (result.hasOwnProperty(row.status)) {
        result[row.status] = row.count
      }
      result.total += row.count
    }

    return result
  },

  // 获取死线预警订单 (PRD B-02)
  getDeadlineAlerts(userId) {
    const now = new Date()
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    const rows = selectQuery(
      `
      SELECT id, character_name, source_work, deadline, status
      FROM orders
      WHERE user_id = ?
        AND deadline IS NOT NULL
        AND deadline <= ?
        AND status NOT IN ('shipped', 'completed')
      ORDER BY deadline ASC
    `,
      [userId, sevenDaysLater.toISOString().split('T')[0]]
    )

    return rows.map((row) => {
      const deadline = new Date(row.deadline)
      const daysLeft = Math.ceil((deadline - now) / (24 * 60 * 60 * 1000))

      return {
        id: row.id,
        character_name: row.character_name,
        source_work: row.source_work,
        deadline: row.deadline,
        status: row.status,
        daysLeft: daysLeft,
        level: daysLeft <= 3 ? 'red' : 'yellow'
      }
    })
  },

  // 创建订单 (PRD 2.0 升级)
  create(data) {
    const id = uuidv4()
    const referenceImages = data.reference_images ? JSON.stringify(data.reference_images) : null
    const notes = data.notes ? JSON.stringify(data.notes) : '[]'
    const now = new Date().toISOString()

    // 自动计算定金和尾款 (PRD F-02)
    let deposit = data.deposit
    let balance = data.balance
    if (data.price && !deposit) {
      deposit = Math.round(data.price * 0.2 * 100) / 100 // 20%
      balance = Math.round(data.price * 0.8 * 100) / 100 // 80%
    }

    runQuery(
      `
      INSERT INTO orders (
        id, user_id, inquiry_id, customer_name, customer_contact,
        character_name, source_work, reference_images, head_circumference, head_notes,
        wig_source, price, deposit, balance, deadline,
        production_notes, status, notes, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        id,
        data.user_id,
        data.inquiry_id || null,
        data.customer_name || null,
        data.customer_contact || null,
        data.character_name,
        data.source_work || null,
        referenceImages,
        data.head_circumference || null,
        data.head_notes || null,
        data.wig_source || 'client_sends',
        data.price || null,
        deposit || null,
        balance || null,
        data.deadline || null,
        data.production_notes || null,
        data.status || 'pending_quote',
        notes,
        now,
        now
      ]
    )

    return this.findById(id)
  },

  // 更新订单
  update(id, data) {
    const fields = []
    const values = []

    // 如果更新价格，自动重新计算定金和尾款
    if (data.price !== undefined && data.deposit === undefined) {
      data.deposit = Math.round(data.price * 0.2 * 100) / 100
      data.balance = Math.round(data.price * 0.8 * 100) / 100
    }

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && key !== 'id' && key !== 'user_id') {
        if (key === 'reference_images' || key === 'notes' || key === 'shipping_checklist') {
          fields.push(`${key} = ?`)
          values.push(JSON.stringify(value))
        } else {
          fields.push(`${key} = ?`)
          values.push(value)
        }
      }
    }

    if (fields.length === 0) return this.findById(id)

    fields.push('updated_at = ?')
    values.push(new Date().toISOString())
    values.push(id)

    const sql = `UPDATE orders SET ${fields.join(', ')} WHERE id = ?`
    runQuery(sql, values)

    return this.findById(id)
  },

  // 确认定金 (PRD 流程)
  confirmDeposit(id, screenshot) {
    const order = this.findById(id)
    if (!order) return null

    const now = new Date().toISOString()

    // 根据wig_source决定下一状态
    let nextStatus =
      order.wig_source === 'client_sends' ? ORDER_STATUS.AWAITING_WIG_BASE : ORDER_STATUS.QUEUED

    runQuery(
      `
      UPDATE orders
      SET deposit_paid_at = ?, deposit_screenshot = ?, status = ?, updated_at = ?
      WHERE id = ?
    `,
      [now, screenshot || null, nextStatus, now, id]
    )

    return this.findById(id)
  },

  // 确认毛坯收货 (PRD F-03)
  confirmWigReceived(id, trackingNo) {
    const now = new Date().toISOString()

    runQuery(
      `
      UPDATE orders
      SET wig_received_at = ?, wig_tracking_no = ?, status = ?, updated_at = ?
      WHERE id = ?
    `,
      [now, trackingNo || null, ORDER_STATUS.QUEUED, now, id]
    )

    return this.findById(id)
  },

  // 确认尾款 (PRD 流程)
  confirmBalance(id, screenshot) {
    const now = new Date().toISOString()

    runQuery(
      `
      UPDATE orders
      SET balance_paid_at = ?, balance_screenshot = ?, updated_at = ?
      WHERE id = ?
    `,
      [now, screenshot || null, now, id]
    )

    return this.findById(id)
  },

  // 发货 (PRD S-01)
  ship(id, data) {
    const now = new Date().toISOString()
    const checklist = data.checklist ? JSON.stringify(data.checklist) : null

    runQuery(
      `
      UPDATE orders
      SET shipping_company = ?, shipping_no = ?, shipped_at = ?,
          shipping_checklist = ?, status = ?, updated_at = ?
      WHERE id = ?
    `,
      [
        data.shipping_company || null,
        data.shipping_no || null,
        now,
        checklist,
        ORDER_STATUS.SHIPPED,
        now,
        id
      ]
    )

    return this.findById(id)
  },

  // 添加备注
  addNote(id, content) {
    const order = this.findById(id)
    if (!order) return null

    const notes = order.notes || []
    notes.push({
      id: uuidv4(),
      content,
      created_at: new Date().toISOString()
    })

    runQuery('UPDATE orders SET notes = ?, updated_at = ? WHERE id = ?', [
      JSON.stringify(notes),
      new Date().toISOString(),
      id
    ])

    return this.findById(id)
  },

  // 验证状态流转是否合法
  isValidStatusTransition(currentStatus, newStatus) {
    const validNextStatuses = VALID_STATUS_TRANSITIONS[currentStatus] || []
    return validNextStatuses.includes(newStatus)
  }
}
