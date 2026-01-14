import express from 'express'
import { body, validationResult } from 'express-validator'
import { WorkModel } from '../models/Work.js'
import { auth } from '../middleware/auth.js'
import { AppError } from '../middleware/errorHandler.js'

const router = express.Router()

// 获取当前用户的作品列表
router.get('/', auth, async (req, res, next) => {
  try {
    const works = WorkModel.findByUserId(req.user.userId)
    res.json({
      code: 0,
      data: works
    })
  } catch (error) {
    next(error)
  }
})

// 创建新作品
router.post('/', auth,
  body('image_url').notEmpty().withMessage('作品图片不能为空'),
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw new AppError(1001, errors.array()[0].msg)
      }

      const { image_url, thumbnail_url, title, source_work, tags, sort_order } = req.body

      const work = WorkModel.create({
        user_id: req.user.userId,
        image_url,
        thumbnail_url,
        title,
        source_work,
        tags,
        sort_order
      })

      res.json({
        code: 0,
        data: work
      })
    } catch (error) {
      next(error)
    }
  }
)

// 更新作品
router.put('/:id', auth, async (req, res, next) => {
  try {
    const { id } = req.params
    const work = WorkModel.findById(id)

    if (!work) {
      throw new AppError(3001, '作品不存在', 404)
    }

    if (work.user_id !== req.user.userId) {
      throw new AppError(2002, '无权限修改此作品', 403)
    }

    const { image_url, thumbnail_url, title, source_work, tags, sort_order } = req.body

    const updated = WorkModel.update(id, {
      image_url,
      thumbnail_url,
      title,
      source_work,
      tags,
      sort_order
    })

    res.json({
      code: 0,
      data: updated
    })
  } catch (error) {
    next(error)
  }
})

// 删除作品
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const { id } = req.params
    const work = WorkModel.findById(id)

    if (!work) {
      throw new AppError(3001, '作品不存在', 404)
    }

    if (work.user_id !== req.user.userId) {
      throw new AppError(2002, '无权限删除此作品', 403)
    }

    WorkModel.delete(id)

    res.json({
      code: 0,
      message: '删除成功'
    })
  } catch (error) {
    next(error)
  }
})

// 批量更新排序
router.put('/batch/sort', auth, async (req, res, next) => {
  try {
    const { orders } = req.body

    if (!Array.isArray(orders)) {
      throw new AppError(1001, '参数格式错误')
    }

    WorkModel.updateSortOrder(req.user.userId, orders)

    res.json({
      code: 0,
      message: '排序更新成功'
    })
  } catch (error) {
    next(error)
  }
})

export default router
