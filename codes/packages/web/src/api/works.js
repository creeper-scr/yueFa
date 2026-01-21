import request from './request'

/**
 * 作品管理 API
 */
export const worksApi = {
  /**
   * 获取当前用户的作品列表
   * @returns {Promise<{code: number, data: Array}>}
   */
  getWorks() {
    return request.get('/works')
  },

  /**
   * 创建新作品
   * @param {Object} data - 作品数据
   * @param {string} data.character_name - 角色名
   * @param {string} [data.source_work] - 出处作品
   * @param {Array<string>} data.images - 图片 URL 数组
   * @param {string} [data.description] - 描述
   * @returns {Promise<{code: number, data: Object}>}
   */
  createWork(data) {
    return request.post('/works', data)
  },

  /**
   * 更新作品
   * @param {string} id - 作品ID
   * @param {Object} data - 更新数据
   * @returns {Promise<{code: number, data: Object}>}
   */
  updateWork(id, data) {
    return request.put(`/works/${id}`, data)
  },

  /**
   * 删除作品
   * @param {string} id - 作品ID
   * @returns {Promise<{code: number, message: string}>}
   */
  deleteWork(id) {
    return request.delete(`/works/${id}`)
  },

  /**
   * 获取指定毛娘的公开作品列表
   * @param {string} slug - 毛娘的自定义短链接
   * @returns {Promise<{code: number, data: Array}>}
   */
  getPublicWorks(slug) {
    return request.get(`/users/${slug}/works`)
  }
}
