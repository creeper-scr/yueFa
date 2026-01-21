import request from './request'

/**
 * 用户管理 API
 */
export const userApi = {
  /**
   * 获取当前用户完整信息
   * @returns {Promise<{code: number, data: Object}>}
   */
  getProfile() {
    return request.get('/users/profile')
  },

  /**
   * 更新用户信息
   * @param {Object} data - 用户数据
   * @param {string} [data.nickname] - 昵称
   * @param {string} [data.avatar_url] - 头像 URL
   * @param {string} [data.wechat_id] - 微信号
   * @param {string} [data.announcement] - 公告
   * @param {string} [data.slug] - 自定义短链接
   * @returns {Promise<{code: number, data: Object}>}
   */
  updateProfile(data) {
    return request.put('/users/profile', data)
  },

  /**
   * 根据 slug 获取毛娘公开主页信息
   * @param {string} slug - 毛娘的自定义短链接
   * @returns {Promise<{code: number, data: Object}>}
   */
  getPublicProfile(slug) {
    return request.get(`/users/${slug}`)
  }
}
