/**
 * 阿里云函数计算 FC3 入口适配器
 * 将 FC HTTP 事件转换为 Express 格式
 */

import 'dotenv/config'
import { app } from './src/app.js'
import { initDb } from './src/models/index.js'

// 初始化标志
let initialized = false

/**
 * FC3 HTTP 触发器处理函数
 * event 可能是 Buffer、string 或已解析的对象
 */
export const handler = async (event, context) => {
  // 调试日志
  console.log('Event type:', typeof event)
  console.log('Event is Buffer:', Buffer.isBuffer(event))

  // 解析事件 - 处理 Buffer、string 和 object
  let eventObj
  try {
    if (Buffer.isBuffer(event)) {
      eventObj = JSON.parse(event.toString('utf-8'))
    } else if (typeof event === 'string') {
      eventObj = JSON.parse(event)
    } else {
      eventObj = event
    }
  } catch (e) {
    console.error('Failed to parse event:', e.message)
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: -1, message: 'Invalid event format', error: e.message })
    }
  }

  console.log('Parsed event keys:', Object.keys(eventObj))
  console.log('Request path:', eventObj.path || eventObj.rawPath)
  console.log('Request method:', eventObj.httpMethod || eventObj.requestContext?.http?.method)

  // 懒初始化数据库
  if (!initialized) {
    try {
      await initDb()
      initialized = true
      console.log('Database initialized in FC environment')
    } catch (error) {
      console.error('Failed to initialize database:', error)
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: -1,
          message: 'Database initialization failed',
          error: error.message
        })
      }
    }
  }

  // 从事件中提取 HTTP 请求信息
  const method = eventObj.httpMethod || eventObj.requestContext?.http?.method || 'GET'
  const path = eventObj.path || eventObj.rawPath || '/'
  const queryParams = eventObj.queryParameters || eventObj.queryStringParameters || {}
  const headers = lowerCaseHeaders(eventObj.headers || {})

  // 解析请求体
  let body = eventObj.body || ''
  if (eventObj.isBase64Encoded && body) {
    body = Buffer.from(body, 'base64').toString('utf-8')
  }
  if (typeof body === 'string' && body) {
    try {
      body = JSON.parse(body)
    } catch (e) {
      // 保持原始字符串
    }
  }

  // 构建查询字符串
  const queryString = Object.keys(queryParams).length > 0
    ? '?' + new URLSearchParams(queryParams).toString()
    : ''

  // 构造 Express 格式的请求对象
  const expressReq = {
    method,
    url: path + queryString,
    path,
    originalUrl: path + queryString,
    query: queryParams,
    headers,
    body: body || {},
    params: {},
    get: function(name) {
      return this.headers[name.toLowerCase()]
    }
  }

  // 处理 CORS 预检请求
  if (method === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      },
      body: ''
    }
  }

  // 使用 Promise 包装 Express 处理
  return new Promise((resolve) => {
    const responseHeaders = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
    let statusCode = 200
    let responseBody = ''

    // 构造 Express 格式的响应对象
    const expressRes = {
      statusCode: 200,

      status(code) {
        statusCode = code
        this.statusCode = code
        return this
      },

      set(key, value) {
        if (typeof key === 'object') {
          Object.assign(responseHeaders, key)
        } else {
          responseHeaders[key] = value
        }
        return this
      },

      setHeader(key, value) {
        responseHeaders[key] = value
        return this
      },

      getHeader(key) {
        return responseHeaders[key]
      },

      json(data) {
        responseHeaders['Content-Type'] = 'application/json'
        responseBody = JSON.stringify(data)
        console.log('Response body:', responseBody)
        this.end()
      },

      send(data) {
        if (typeof data === 'object') {
          responseHeaders['Content-Type'] = 'application/json'
          responseBody = JSON.stringify(data)
        } else {
          responseBody = data || ''
        }
        console.log('Response body:', responseBody)
        this.end()
      },

      end(data) {
        if (data) {
          responseBody = data
        }
        console.log('Resolving with status:', statusCode, 'body length:', responseBody.length)
        resolve({
          statusCode,
          headers: responseHeaders,
          body: responseBody
        })
      }
    }

    // 调用 Express app
    try {
      app(expressReq, expressRes, (err) => {
        if (err) {
          console.error('Express error:', err)
          resolve({
            statusCode: 500,
            headers: responseHeaders,
            body: JSON.stringify({
              code: -1,
              message: 'Internal server error',
              error: err.message
            })
          })
        }
      })
    } catch (error) {
      console.error('Handler error:', error)
      resolve({
        statusCode: 500,
        headers: responseHeaders,
        body: JSON.stringify({
          code: -1,
          message: 'Handler error',
          error: error.message
        })
      })
    }
  })
}

/**
 * 将请求头转换为小写键名
 */
function lowerCaseHeaders(headers) {
  const result = {}
  for (const [key, value] of Object.entries(headers)) {
    result[key.toLowerCase()] = value
  }
  return result
}
