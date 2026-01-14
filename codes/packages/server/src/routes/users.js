import express from 'express'
import { body, validationResult } from 'express-validator'
import { UserModel } from '../models/User.js'
import { WorkModel } from '../models/Work.js'
import { auth } from '../middleware/auth.js'
import { AppError } from '../middleware/errorHandler.js'

const router = express.Router()

// 获取当前用户完整信息
router.get('/profile', auth, async (req, res, next) => {
  try {
    const user = UserModel.findById(req.user.userId)
    if (!user) {
      throw new AppError(3001, '用户不存在', 404)
    }

    res.json({
      code: 0,
      data: {
        id: user.id,
        phone: user.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'),
        nickname: user.nickname,
        avatar_url: user.avatar_url,
        wechat_id: user.wechat_id,
        announcement: user.announcement,
        slug: user.slug,
        created_at: user.created_at
      }
    })
  } catch (error) {
    next(error)
  }
})

// 更新用户信息
router.put('/profile', auth,
  body('slug').optional().isLength({ min: 3, max: 50 }).matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('专属链接只能包含字母、数字、下划线和横线，长度3-50'),
  body('nickname').optional().isLength({ max: 50 }).withMessage('昵称长度不能超过50'),
  body('wechat_id').optional().isLength({ max: 50 }).withMessage('微信号长度不能超过50'),
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw new AppError(1001, errors.array()[0].msg)
      }

      const { nickname, avatar_url, wechat_id, announcement, slug } = req.body

      // 检查slug是否可用
      if (slug) {
        const isAvailable = UserModel.isSlugAvailable(slug, req.user.userId)
        if (!isAvailable) {
          throw new AppError(3002, '该专属链接已被占用')
        }
      }

      const user = UserModel.update(req.user.userId, {
        nickname,
        avatar_url,
        wechat_id,
        announcement,
        slug
      })

      res.json({
        code: 0,
        data: {
          id: user.id,
          phone: user.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'),
          nickname: user.nickname,
          avatar_url: user.avatar_url,
          wechat_id: user.wechat_id,
          announcement: user.announcement,
          slug: user.slug
        }
      })
    } catch (error) {
      next(error)
    }
  }
)

// 根据slug获取毛娘公开主页
router.get('/:slug', async (req, res, next) => {
  try {
    const { slug } = req.params
    const user = UserModel.findBySlug(slug)

    if (!user) {
      throw new AppError(3001, '页面不存在', 404)
    }

    res.json({
      code: 0,
      data: {
        id: user.id,
        nickname: user.nickname,
        avatar_url: user.avatar_url,
        wechat_id: user.wechat_id,
        announcement: user.announcement,
        slug: user.slug
      }
    })
  } catch (error) {
    next(error)
  }
})

// 获取指定毛娘的公开作品列表
router.get('/:slug/works', async (req, res, next) => {
  try {
    const { slug } = req.params
    const user = UserModel.findBySlug(slug)

    if (!user) {
      throw new AppError(3001, '页面不存在', 404)
    }

    const works = WorkModel.findByUserId(user.id)

    res.json({
      code: 0,
      data: works
    })
  } catch (error) {
    next(error)
  }
})

export default router
