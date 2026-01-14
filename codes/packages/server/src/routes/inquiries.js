import express from 'express'
import { body, query, validationResult } from 'express-validator'
import { InquiryModel } from '../models/Inquiry.js'
import { OrderModel } from '../models/Order.js'
import { UserModel } from '../models/User.js'
import { auth } from '../middleware/auth.js'
import { AppError } from '../middleware/errorHandler.js'

const router = express.Router()

// 客户提交询价（无需认证）
router.post('/',
  body('user_slug').notEmpty().withMessage('目标毛娘不能为空'),
  body('character_name').notEmpty().withMessage('角色名不能为空'),
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
        budget_range,
        reference_images,
        requirements
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
        budget_range,
        reference_images,
        requirements
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

// 获取询价列表（毛娘端）
router.get('/', auth,
  query('status').optional().isIn(['new', 'converted', 'rejected']),
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

      res.json({
        code: 0,
        data: {
          list: inquiries,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total
          }
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

// 将询价转为订单
router.post('/:id/convert', auth,
  body('price').optional().isNumeric(),
  body('deposit').optional().isNumeric(),
  body('deadline').optional().isISO8601(),
  async (req, res, next) => {
    try {
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

      const { price, deposit, deadline } = req.body

      // 创建订单
      const order = OrderModel.create({
        user_id: req.user.userId,
        inquiry_id: inquiry.id,
        customer_name: inquiry.customer_name,
        customer_contact: inquiry.customer_contact,
        character_name: inquiry.character_name,
        source_work: inquiry.source_work,
        head_circumference: inquiry.head_circumference,
        reference_images: inquiry.reference_images,
        requirements: inquiry.requirements,
        deadline: deadline || inquiry.expected_deadline,
        price,
        deposit
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

    if (inquiry.status !== 'new') {
      throw new AppError(1001, '该询价已处理')
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
