import express from 'express'
import { body, validationResult } from 'express-validator'
import { ReviewModel, ReviewRevisionModel } from '../models/Review.js'
import { OrderModel, ORDER_STATUS } from '../models/Order.js'
import { auth } from '../middleware/auth.js'
import { AppError } from '../middleware/errorHandler.js'

const router = express.Router()

// 创建验收记录 (毛娘上传成品图 PRD R-01)
router.post('/', auth,
  body('order_id').notEmpty().withMessage('订单ID不能为空'),
  body('images').isArray({ min: 1 }).withMessage('至少需要上传一张成品图'),
  body('description').optional().isString(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw new AppError(1001, errors.array()[0].msg)
      }

      const { order_id, images, description } = req.body

      // 检查订单
      const order = OrderModel.findById(order_id)
      if (!order) {
        throw new AppError(3001, '订单不存在', 404)
      }

      if (order.user_id !== req.user.userId) {
        throw new AppError(2002, '无权限操作此订单', 403)
      }

      if (order.status !== ORDER_STATUS.IN_PROGRESS) {
        throw new AppError(3002, '当前订单状态不能创建验收')
      }

      // 检查是否已有验收记录
      const existingReview = ReviewModel.findByOrderId(order_id)
      if (existingReview) {
        throw new AppError(3002, '该订单已存在验收记录')
      }

      // 创建验收记录
      const review = ReviewModel.create({
        order_id,
        images,
        description
      })

      // 更新订单状态为验收中
      OrderModel.update(order_id, { status: ORDER_STATUS.IN_REVIEW })

      res.json({
        code: 0,
        data: {
          id: review.id,
          review_url: review.review_url,
          review_token: review.review_token,
          max_revisions: review.max_revisions
        },
        message: '验收已创建，请将链接发送给客户'
      })
    } catch (error) {
      next(error)
    }
  }
)

// 获取验收详情 (毛娘端)
router.get('/:id', auth, async (req, res, next) => {
  try {
    const { id } = req.params
    const review = ReviewModel.findById(id)

    if (!review) {
      throw new AppError(3001, '验收记录不存在', 404)
    }

    // 验证权限
    const order = OrderModel.findById(review.order_id)
    if (!order || order.user_id !== req.user.userId) {
      throw new AppError(2002, '无权限查看此验收', 403)
    }

    // 获取修改记录
    const revisions = ReviewRevisionModel.findByReviewId(id)

    res.json({
      code: 0,
      data: {
        ...review,
        order: {
          id: order.id,
          character_name: order.character_name,
          source_work: order.source_work,
          customer_name: order.customer_name
        },
        revisions
      }
    })
  } catch (error) {
    next(error)
  }
})

// 客户访问验收页 (无需认证 PRD R-01)
router.get('/token/:token', async (req, res, next) => {
  try {
    const { token } = req.params
    const review = ReviewModel.findByToken(token)

    if (!review) {
      throw new AppError(3001, '验收链接无效或已过期', 404)
    }

    // 获取订单信息 (脱敏)
    const order = OrderModel.findById(review.order_id)

    // 获取修改记录
    const revisions = ReviewRevisionModel.findByReviewId(review.id)

    res.json({
      code: 0,
      data: {
        order: {
          character_name: order?.character_name,
          source_work: order?.source_work
        },
        images: review.images,
        description: review.description,
        revision_count: review.revision_count,
        max_revisions: review.max_revisions,
        is_approved: review.is_approved,
        approved_at: review.approved_at,
        revisions: revisions.map(r => ({
          revision_number: r.revision_number,
          request_content: r.request_content,
          request_images: r.request_images,
          requested_at: r.requested_at,
          response_images: r.response_images,
          response_notes: r.response_notes,
          completed_at: r.completed_at,
          is_satisfied: r.is_satisfied
        }))
      }
    })
  } catch (error) {
    next(error)
  }
})

// 客户确认满意 (PRD R-01)
router.post('/:id/approve',
  body('token').notEmpty().withMessage('验证token不能为空'),
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw new AppError(1001, errors.array()[0].msg)
      }

      const { id } = req.params
      const { token } = req.body

      // 验证token
      const review = ReviewModel.findById(id)
      if (!review) {
        throw new AppError(3001, '验收记录不存在', 404)
      }

      if (review.review_token !== token) {
        throw new AppError(2001, '验证失败')
      }

      if (review.is_approved === true) {
        throw new AppError(3002, '已确认满意，无需重复操作')
      }

      // 确认满意
      const updated = ReviewModel.approve(id)

      // 更新订单状态为待尾款
      OrderModel.update(review.order_id, { status: ORDER_STATUS.PENDING_BALANCE })

      res.json({
        code: 0,
        data: {
          is_approved: updated.is_approved,
          approved_at: updated.approved_at
        },
        message: '感谢您的确认！请联系毛娘支付尾款'
      })
    } catch (error) {
      next(error)
    }
  }
)

// 客户申请修改 (PRD R-02)
router.post('/:id/revision',
  body('token').notEmpty().withMessage('验证token不能为空'),
  body('request_content').notEmpty().withMessage('修改意见不能为空'),
  body('request_images').optional().isArray(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw new AppError(1001, errors.array()[0].msg)
      }

      const { id } = req.params
      const { token, request_content, request_images } = req.body

      // 验证token
      const review = ReviewModel.findById(id)
      if (!review) {
        throw new AppError(3001, '验收记录不存在', 404)
      }

      if (review.review_token !== token) {
        throw new AppError(2001, '验证失败')
      }

      if (review.is_approved === true) {
        throw new AppError(3002, '已确认满意，不能再申请修改')
      }

      // 检查修改次数
      if (!ReviewModel.canRequestRevision(id)) {
        throw new AppError(3003, `修改次数已用完 (最多${review.max_revisions}次)`)
      }

      // 检查是否有未完成的修改
      const pendingRevision = ReviewRevisionModel.getPendingByReviewId(id)
      if (pendingRevision) {
        throw new AppError(3002, '上一次修改请求还未处理完成')
      }

      // 创建修改请求
      const revisionNumber = review.revision_count + 1
      const revision = ReviewRevisionModel.create({
        review_id: id,
        revision_number: revisionNumber,
        request_content,
        request_images
      })

      // 更新验收记录的修改次数
      ReviewModel.incrementRevisionCount(id)

      res.json({
        code: 0,
        data: {
          revision_number: revision.revision_number,
          remaining_revisions: review.max_revisions - revisionNumber
        },
        message: `修改请求已提交，剩余修改次数: ${review.max_revisions - revisionNumber}`
      })
    } catch (error) {
      next(error)
    }
  }
)

// 毛娘提交修改结果
router.put('/:id/revision/:revisionId', auth,
  body('response_images').isArray({ min: 1 }).withMessage('请上传修改后的图片'),
  body('response_notes').optional().isString(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw new AppError(1001, errors.array()[0].msg)
      }

      const { id, revisionId } = req.params
      const { response_images, response_notes } = req.body

      // 验证权限
      const review = ReviewModel.findById(id)
      if (!review) {
        throw new AppError(3001, '验收记录不存在', 404)
      }

      const order = OrderModel.findById(review.order_id)
      if (!order || order.user_id !== req.user.userId) {
        throw new AppError(2002, '无权限操作此验收', 403)
      }

      // 验证修改记录
      const revision = ReviewRevisionModel.findById(revisionId)
      if (!revision || revision.review_id !== id) {
        throw new AppError(3001, '修改记录不存在', 404)
      }

      if (revision.completed_at) {
        throw new AppError(3002, '该修改请求已处理完成')
      }

      // 提交修改结果
      const updated = ReviewRevisionModel.submitResponse(revisionId, {
        response_images,
        response_notes
      })

      // 同时更新验收记录的图片 (用最新的修改结果更新)
      ReviewModel.update(id, { images: response_images })

      res.json({
        code: 0,
        data: updated,
        message: '修改已提交，等待客户确认'
      })
    } catch (error) {
      next(error)
    }
  }
)

// 获取订单的验收记录 (毛娘端)
router.get('/order/:orderId', auth, async (req, res, next) => {
  try {
    const { orderId } = req.params

    // 验证权限
    const order = OrderModel.findById(orderId)
    if (!order) {
      throw new AppError(3001, '订单不存在', 404)
    }

    if (order.user_id !== req.user.userId) {
      throw new AppError(2002, '无权限查看', 403)
    }

    const review = ReviewModel.findByOrderId(orderId)
    if (!review) {
      res.json({
        code: 0,
        data: null
      })
      return
    }

    const revisions = ReviewRevisionModel.findByReviewId(review.id)

    res.json({
      code: 0,
      data: {
        ...review,
        revisions
      }
    })
  } catch (error) {
    next(error)
  }
})

export default router
