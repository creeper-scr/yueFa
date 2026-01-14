import request from './request'

export const authApi = {
  // 发送验证码
  sendSms(phone) {
    return request.post('/auth/sms/send', { phone })
  },

  // 登录
  login(phone, code) {
    return request.post('/auth/login', { phone, code })
  },

  // 获取当前用户信息
  getMe() {
    return request.get('/auth/me')
  }
}
