import axios from 'axios'

const request = axios.create({
  baseURL: '/api/v1',
  timeout: 10000
})

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    const res = response.data

    // 业务错误处理
    if (res.code !== 0) {
      // Token过期
      if (res.code === 2001) {
        localStorage.removeItem('token')
        window.location.href = '/login'
        return Promise.reject(new Error('登录已过期'))
      }

      // 创建标准错误对象,不自动显示 Toast,让调用者决定如何处理
      const error = new Error(res.message || '请求失败')
      error.code = res.code
      error.errors = res.errors || []
      return Promise.reject(error)
    }

    return res
  },
  (error) => {
    // 网络错误,返回标准错误对象
    const err = new Error(error.message || '网络错误')
    err.code = -1
    err.errors = []
    return Promise.reject(err)
  }
)

export default request
