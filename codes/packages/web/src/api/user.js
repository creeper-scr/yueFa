import request from './request'

export const userApi = {
  // 获取当前用户完整信息
  getProfile() {
    return request.get('/users/profile')
  },

  // 更新用户信息
  updateProfile(data) {
    return request.put('/users/profile', data)
  },

  // 根据slug获取毛娘公开主页
  getPublicProfile(slug) {
    return request.get(`/users/${slug}`)
  }
}
