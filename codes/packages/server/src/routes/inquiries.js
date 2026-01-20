import express from 'express'
import { body, query, validationResult } from 'express-validator'
import { InquiryModel } from '../models/Inquiry.js'
import { OrderModel, ORDER_STATUS } from '../models/Order.js'
import { UserModel } from '../models/User.js'
import { auth } from '../middleware/auth.js'
import { AppError } from '../middleware/errorHandler.js'

const router = express.Router()

// 毛坯来源选项
const WIG_SOURCES = ['client_sends', 'stylist_buys']

// 客户提交询价 (PRD F-01 结构化表单)
router.post('/',
  body('user_slug').notEmpty().withMessage('目标毛娘不能为空'),
  body('character_name').notEmpty().withMessage('角色名不能为空'),
  body('wig_source').optional().isIn(WIG_SOURCES).withMessage('无效的毛坯来源'),
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw new AppError(1001, errors.array()[0].msg)
      }

      const {
        user_slug,
        customer_name,
        customer_contact,
        character_name,
        source_work,
        expected_deadline,
        head_circumference,
        head_notes,
        wig_source,
        budget_range,
        reference_images,
        special_requirements
      } = req.body

      // 查找目标毛娘
      const user = UserModel.findBySlug(user_slug)
      if (!user) {
        throw new AppError(3001, '该毛娘不存在', 404)
      }

      const inquiry = InquiryModel.create({
        user_id: user.id,
        customer_name,
        customer_contact,
        character_name,
        source_work,
        expected_deadline,
        head_circumference,
        head_notes,
        wig_source: wig_source || 'client_sends',
        budget_range,
        reference_images,
        special_requirements
      })

      res.json({
        code: 0,
        message: '询价提交成功',
        data: { id: inquiry.id }
      })
    } catch (error) {
      next(error)
    }
  }
)

// 获取询价列表 (毛娘端)
router.get('/', auth,
  query('status').optional().isIn(['new', 'quoted', 'converted', 'rejected']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  async (req, res, next) => {
    try {
      const { status, page = 1, limit = 20 } = req.query

      const inquiries = InquiryModel.findByUserId(req.user.userId, {
        status,
        page: parseInt(page),
        limit: parseInt(limit)
      })

      const total = InquiryModel.countByUserId(req.user.userId, status)
      const statusCount = InquiryModel.countByStatus(req.user.userId)

      res.json({
        code: 0,
        data: {
          list: inquiries,
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

// 获取询价详情
router.get('/:id', auth, async (req, res, next) => {
  try {
    const { id } = req.params
    const inquiry = InquiryModel.findById(id)

    if (!inquiry) {
      throw new AppError(3001, '询价不存在', 404)
    }

    if (inquiry.user_id !== req.user.userId) {
      throw new AppError(2002, '无权限查看此询价', 403)
    }

    res.json({
      code: 0,
      data: inquiry
    })
  } catch (error) {
    next(error)
  }
})

// 提交报价 (PRD F-02)
router.post('/:id/quote', auth,
  body('price').isNumeric().withMessage('价格不能为空'),
  body('deadline').optional().isISO8601(),
  body('notes').optional().isString(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw new AppError(1001, errors.array()[0].msg)
      }

      const { id } = req.params
      const inquiry = InquiryModel.findById(id)

      if (!inquiry) {
        throw new AppError(3001, '询价不存在', 404)
      }

      if (inquiry.user_id !== req.user.userId) {
        throw new AppError(2002, '无权限操作此询价', 403)
      }

      if (inquiry.status !== 'new') {
        throw new AppError(1001, '该询价已处理')
      }

      const { price, deadline, notes } = req.body

      // 自动计算定金和尾款 (PRD F-02: 20%/80%)
      const deposit = Math.round(price * 0.2 * 100) / 100
      const balance = Math.round(price * 0.8 * 100) / 100

      // 更新询价状态为已报价
      InquiryModel.updateStatus(id, 'quoted')

      res.json({
        code: 0,
        message: '报价已提交',
        data: {
          inquiry_id: id,
          price: parseFloat(price),
          deposit,
          balance,
          deadline: deadline || inquiry.expected_deadline,
          notes
        }
      })
    } catch (error) {
      next(error)
    }
  }
)

// 将询价转为订单 (PRD 2.0 升级)
router.post('/:id/convert', auth,
  body('price').isNumeric().withMessage('价格不能为空'),
  body('deadline').optional().isISO8601(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw new AppError(1001, errors.array()[0].msg)
      }

      const { id } = req.params
      const inquiry = InquiryModel.findById(id)

      if (!inquiry) {
        throw new AppError(3001, '询价不存在', 404)
      }

      if (inquiry.user_id !== req.user.userId) {
        throw new AppError(2002, '无权限操作此询价', 403)
      }

      if (inquiry.status === 'converted') {
        throw new AppError(1001, '该询价已转为订单')
      }

      if (inquiry.status === 'rejected') {
        throw new AppError(1001, '该询价已拒绝')
      }

      const { price, deadline } = req.body

      // 创建订单 (PRD 2.0 - 包含新字段)
      const order = OrderModel.create({
        user_id: req.user.userId,
        inquiry_id: inquiry.id,
        customer_name: inquiry.customer_name,
        customer_contact: inquiry.customer_contact,
        character_name: inquiry.character_name,
        source_work: inquiry.source_work,
        head_circumference: inquiry.head_circumference,
        head_notes: inquiry.head_notes,
        wig_source: inquiry.wig_source,
        reference_images: inquiry.reference_images,
        deadline: deadline || inquiry.expected_deadline,
        price,
        status: ORDER_STATUS.PENDING_DEPOSIT
      })

      // 更新询价状态
      InquiryModel.updateStatus(id, 'converted')

      res.json({
        code: 0,
        message: '订单创建成功',
        data: order
      })
    } catch (error) {
      next(error)
    }
  }
)

// 拒绝询价
router.put('/:id/reject', auth, async (req, res, next) => {
  try {
    const { id } = req.params
    const inquiry = InquiryModel.findById(id)

    if (!inquiry) {
      throw new AppError(3001, '询价不存在', 404)
    }

    if (inquiry.user_id !== req.user.userId) {
      throw new AppError(2002, '无权限操作此询价', 403)
    }

    if (inquiry.status === 'converted') {
      throw new AppError(1001, '该询价已转为订单，不能拒绝')
    }

    if (inquiry.status === 'rejected') {
      throw new AppError(1001, '该询价已拒绝')
    }

    InquiryModel.updateStatus(id, 'rejected')

    res.json({
      code: 0,
      message: '询价已拒绝'
    })
  } catch (error) {
    next(error)
  }
})

export default router
