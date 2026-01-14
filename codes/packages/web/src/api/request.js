import axios from 'axios'
import { showToast } from 'vant'

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

      showToast(res.message || '请求失败')
      return Promise.reject(new Error(res.message || '请求失败'))
    }

    return res
  },
  (error) => {
    showToast(error.message || '网络错误')
    return Promise.reject(error)
  }
)

export default request
