import request from './request'

/**
 * 认证相关 API
 */
export const authApi = {
  /**
   * 发送短信验证码
   * @param {string} phone - 手机号 (格式: 1开头11位)
   * @returns {Promise<{code: number, message: string, data?: {code: string}}>} 开发环境返回验证码
   */
  sendSms(phone) {
    return request.post('/auth/sms/send', { phone })
  },

  /**
   * 登录/注册 (手机号+验证码)
   * @param {string} phone - 手机号
   * @param {string} code - 6位验证码
   * @returns {Promise<{code: number, data: {token: string, user: Object}}>}
   */
  login(phone, code) {
    return request.post('/auth/login', { phone, code })
  },

  /**
   * 获取当前登录用户信息
   * @returns {Promise<{code: number, data: Object}>}
   */
  getMe() {
    return request.get('/auth/me')
  }
}
