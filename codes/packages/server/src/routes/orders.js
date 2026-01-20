import express from 'express'
import { body, query, validationResult } from 'express-validator'
import { OrderModel, ORDER_STATUS, ORDER_STATUS_TEXT } from '../models/Order.js'
import { auth } from '../middleware/auth.js'
import { AppError } from '../middleware/errorHandler.js'

const router = express.Router()

// PRD 2.0 订单状态 (9个状态)
const ORDER_STATUSES = Object.values(ORDER_STATUS)

// 获取订单列表 (PRD B-01 升级 - 包含死线预警)
router.get('/', auth,
  query('status').optional().isIn(ORDER_STATUSES),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  async (req, res, next) => {
    try {
      const { status, page = 1, limit = 20 } = req.query

      const orders = OrderModel.findByUserId(req.user.userId, {
        status,
        page: parseInt(page),
        limit: parseInt(limit)
      })

      const total = OrderModel.countByUserId(req.user.userId, status)
      const statusCount = OrderModel.countByStatus(req.user.userId)
      const deadlineAlerts = OrderModel.getDeadlineAlerts(req.user.userId)

      res.json({
        code: 0,
        data: {
          list: orders,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total
          },
          statusCount,
          deadlineAlerts
        }
      })
    } catch (error) {
      next(error)
    }
  }
)

// 获取订单详情
router.get('/:id', auth, async (req, res, next) => {
  try {
    const { id } = req.params
    const order = OrderModel.findById(id)

    if (!order) {
      throw new AppError(3001, '订单不存在', 404)
    }

    if (order.user_id !== req.user.userId) {
      throw new AppError(2002, '无权限查看此订单', 403)
    }

    res.json({
      code: 0,
      data: order
    })
  } catch (error) {
    next(error)
  }
})

// 更新订单信息 (PRD 2.0 升级 - 支持新字段)
router.put('/:id', auth,
  body('price').optional().isNumeric(),
  body('deadline').optional().isISO8601(),
  async (req, res, next) => {
    try {
      const { id } = req.params
      const order = OrderModel.findById(id)

      if (!order) {
        throw new AppError(3001, '订单不存在', 404)
      }

      if (order.user_id !== req.user.userId) {
        throw new AppError(2002, '无权限修改此订单', 403)
      }

      const {
        customer_name,
        customer_contact,
        character_name,
        source_work,
        head_circumference,
        head_notes,
        wig_source,
        deadline,
        price,
        reference_images,
        production_notes
      } = req.body

      const updated = OrderModel.update(id, {
        customer_name,
        customer_contact,
        character_name,
        source_work,
        head_circumference,
        head_notes,
        wig_source,
        deadline,
        price,
        reference_images,
        production_notes
      })

      res.json({
        code: 0,
        data: updated
      })
    } catch (error) {
      next(error)
    }
  }
)

// 更新订单状态
router.put('/:id/status', auth,
  body('status').isIn(ORDER_STATUSES).withMessage('无效的订单状态'),
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw new AppError(1001, errors.array()[0].msg)
      }

      const { id } = req.params
      const { status } = req.body

      const order = OrderModel.findById(id)

      if (!order) {
        throw new AppError(3001, '订单不存在', 404)
      }

      if (order.user_id !== req.user.userId) {
        throw new AppError(2002, '无权限修改此订单', 403)
      }

      // 验证状态流转是否合法
      if (!OrderModel.isValidStatusTransition(order.status, status)) {
        throw new AppError(3002, `不能从 ${ORDER_STATUS_TEXT[order.status]} 变更为 ${ORDER_STATUS_TEXT[status]}`)
      }

      const updated = OrderModel.update(id, { status })

      res.json({
        code: 0,
        data: updated
      })
    } catch (error) {
      next(error)
    }
  }
)

// 确认定金 (PRD 流程)
router.put('/:id/deposit', auth,
  body('screenshot').optional().isString(),
  async (req, res, next) => {
    try {
      const { id } = req.params
      const { screenshot } = req.body

      const order = OrderModel.findById(id)

      if (!order) {
        throw new AppError(3001, '订单不存在', 404)
      }

      if (order.user_id !== req.user.userId) {
        throw new AppError(2002, '无权限操作此订单', 403)
      }

      if (order.status !== ORDER_STATUS.PENDING_DEPOSIT) {
        throw new AppError(3002, '当前状态不能确认定金')
      }

      const updated = OrderModel.confirmDeposit(id, screenshot)

      res.json({
        code: 0,
        data: updated,
        message: `定金已确认，订单状态更新为: ${ORDER_STATUS_TEXT[updated.status]}`
      })
    } catch (error) {
      next(error)
    }
  }
)

// 确认毛坯收货 (PRD F-03)
router.put('/:id/wig-received', auth,
  body('tracking_no').optional().isString(),
  async (req, res, next) => {
    try {
      const { id } = req.params
      const { tracking_no } = req.body

      const order = OrderModel.findById(id)

      if (!order) {
        throw new AppError(3001, '订单不存在', 404)
      }

      if (order.user_id !== req.user.userId) {
        throw new AppError(2002, '无权限操作此订单', 403)
      }

      if (order.status !== ORDER_STATUS.AWAITING_WIG_BASE) {
        throw new AppError(3002, '当前状态不能确认毛坯收货')
      }

      const updated = OrderModel.confirmWigReceived(id, tracking_no)

      res.json({
        code: 0,
        data: updated,
        message: '毛坯已确认收货，订单进入排单中'
      })
    } catch (error) {
      next(error)
    }
  }
)

// 确认尾款 (PRD 流程)
router.put('/:id/balance', auth,
  body('screenshot').optional().isString(),
  async (req, res, next) => {
    try {
      const { id } = req.params
      const { screenshot } = req.body

      const order = OrderModel.findById(id)

      if (!order) {
        throw new AppError(3001, '订单不存在', 404)
      }

      if (order.user_id !== req.user.userId) {
        throw new AppError(2002, '无权限操作此订单', 403)
      }

      if (order.status !== ORDER_STATUS.PENDING_BALANCE) {
        throw new AppError(3002, '当前状态不能确认尾款')
      }

      const updated = OrderModel.confirmBalance(id, screenshot)

      res.json({
        code: 0,
        data: updated,
        message: '尾款已确认'
      })
    } catch (error) {
      next(error)
    }
  }
)

// 发货 (PRD S-01)
router.put('/:id/ship', auth,
  body('shipping_company').optional().isString(),
  body('shipping_no').optional().isString(),
  body('checklist').optional().isObject(),
  async (req, res, next) => {
    try {
      const { id } = req.params
      const { shipping_company, shipping_no, checklist } = req.body

      const order = OrderModel.findById(id)

      if (!order) {
        throw new AppError(3001, '订单不存在', 404)
      }

      if (order.user_id !== req.user.userId) {
        throw new AppError(2002, '无权限操作此订单', 403)
      }

      if (order.status !== ORDER_STATUS.PENDING_BALANCE) {
        throw new AppError(3002, '当前状态不能发货，请先确认尾款')
      }

      // 检查尾款是否已确认
      if (!order.balance_paid_at) {
        throw new AppError(3002, '请先确认尾款到账后再发货')
      }

      const updated = OrderModel.ship(id, { shipping_company, shipping_no, checklist })

      res.json({
        code: 0,
        data: updated,
        message: '已发货'
      })
    } catch (error) {
      next(error)
    }
  }
)

// 确认完成
router.put('/:id/complete', auth, async (req, res, next) => {
  try {
    const { id } = req.params

    const order = OrderModel.findById(id)

    if (!order) {
      throw new AppError(3001, '订单不存在', 404)
    }

    if (order.user_id !== req.user.userId) {
      throw new AppError(2002, '无权限操作此订单', 403)
    }

    if (order.status !== ORDER_STATUS.SHIPPED) {
      throw new AppError(3002, '当前状态不能标记完成')
    }

    const updated = OrderModel.update(id, { status: ORDER_STATUS.COMPLETED })

    res.json({
      code: 0,
      data: updated,
      message: '订单已完成'
    })
  } catch (error) {
    next(error)
  }
})

// 添加订单备注
router.post('/:id/notes', auth,
  body('content').notEmpty().withMessage('备注内容不能为空'),
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw new AppError(1001, errors.array()[0].msg)
      }

      const { id } = req.params
      const { content } = req.body

      const order = OrderModel.findById(id)

      if (!order) {
        throw new AppError(3001, '订单不存在', 404)
      }

      if (order.user_id !== req.user.userId) {
        throw new AppError(2002, '无权限操作此订单', 403)
      }

      const updated = OrderModel.addNote(id, content)

      res.json({
        code: 0,
        data: updated
      })
    } catch (error) {
      next(error)
    }
  }
)

// 获取状态列表 (给前端使用)
router.get('/meta/statuses', auth, async (req, res) => {
  res.json({
    code: 0,
    data: {
      statuses: ORDER_STATUSES,
      statusText: ORDER_STATUS_TEXT
    }
  })
})

export default router
