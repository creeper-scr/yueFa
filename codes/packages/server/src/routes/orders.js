import express from 'express'
import { body, query, validationResult } from 'express-validator'
import { OrderModel } from '../models/Order.js'
import { auth } from '../middleware/auth.js'
import { AppError } from '../middleware/errorHandler.js'

const router = express.Router()

// 订单状态
const ORDER_STATUSES = ['pending_deposit', 'in_production', 'pending_ship', 'completed']

// 获取订单列表
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

      res.json({
        code: 0,
        data: {
          list: orders,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total
          },
          statusCount
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

// 更新订单信息
router.put('/:id', auth,
  body('price').optional().isNumeric(),
  body('deposit').optional().isNumeric(),
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
        deadline,
        price,
        deposit,
        reference_images,
        requirements
      } = req.body

      const updated = OrderModel.update(id, {
        customer_name,
        customer_contact,
        character_name,
        source_work,
        head_circumference,
        deadline,
        price,
        deposit,
        reference_images,
        requirements
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

export default router
