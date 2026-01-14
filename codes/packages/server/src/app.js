import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { initDb } from './models/index.js'
import authRoutes from './routes/auth.js'
import usersRoutes from './routes/users.js'
import worksRoutes from './routes/works.js'
import inquiriesRoutes from './routes/inquiries.js'
import ordersRoutes from './routes/orders.js'
import uploadRoutes from './routes/upload.js'
import { errorHandler } from './middleware/errorHandler.js'

const app = express()
const PORT = process.env.PORT || 4000

// 中间件
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API路由
app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/users', usersRoutes)
app.use('/api/v1/works', worksRoutes)
app.use('/api/v1/inquiries', inquiriesRoutes)
app.use('/api/v1/orders', ordersRoutes)
app.use('/api/v1/upload', uploadRoutes)

// 错误处理
app.use(errorHandler)

// 启动服务器
const startServer = async () => {
  try {
    // 初始化数据库
    await initDb()
    console.log('Database initialized')

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

// 导出app用于测试
export { app }

// 只有直接运行时才启动服务
const isMainModule = process.argv[1]?.includes('app.js')
if (isMainModule && process.env.NODE_ENV !== 'test') {
  startServer()
}
