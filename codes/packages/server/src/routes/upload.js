import express from 'express'
import { body, validationResult } from 'express-validator'
import { auth } from '../middleware/auth.js'
import { AppError } from '../middleware/errorHandler.js'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const router = express.Router()
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// 获取预签名上传URL
router.post('/presign', auth,
  body('type').isIn(['work', 'avatar', 'reference']).withMessage('无效的上传类型'),
  body('filename').notEmpty().withMessage('文件名不能为空'),
  body('content_type').notEmpty().withMessage('文件类型不能为空'),
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw new AppError(1001, errors.array()[0].msg)
      }

      const { type, filename, content_type } = req.body

      // 生成唯一文件名
      const ext = path.extname(filename)
      const uniqueName = `${uuidv4()}${ext}`

      // 开发环境使用本地存储
      if (process.env.NODE_ENV === 'development') {
        // 确保上传目录存在
        const uploadDir = path.resolve(__dirname, '../../uploads', type)
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true })
        }

        const fileUrl = `/uploads/${type}/${uniqueName}`

        return res.json({
          code: 0,
          data: {
            upload_url: `/api/v1/upload/local?path=${encodeURIComponent(fileUrl)}`,
            file_url: fileUrl,
            expires_in: 3600
          }
        })
      }

      // TODO: 生产环境使用阿里云OSS预签名URL
      // const ossClient = new OSS({...})
      // const presignUrl = ossClient.signatureUrl(`${type}/${uniqueName}`, { method: 'PUT' })

      res.json({
        code: 0,
        data: {
          upload_url: '',
          file_url: '',
          expires_in: 3600
        }
      })
    } catch (error) {
      next(error)
    }
  }
)

// 本地文件上传（开发环境）
router.put('/local', auth, express.raw({ type: '*/*', limit: '10mb' }), async (req, res, next) => {
  try {
    const filePath = req.query.path
    if (!filePath) {
      throw new AppError(1001, '缺少文件路径')
    }

    const absolutePath = path.resolve(__dirname, '../../', filePath.slice(1))
    const dir = path.dirname(absolutePath)

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    fs.writeFileSync(absolutePath, req.body)

    res.json({
      code: 0,
      message: '上传成功'
    })
  } catch (error) {
    next(error)
  }
})

// 静态文件服务（开发环境）
router.use('/files', express.static(path.resolve(__dirname, '../../uploads')))

export default router
