import request from './request'

/**
 * 验收管理 API (PRD R系列)
 */
export const reviewsApi = {
  /**
   * 创建验收 (毛娘上传成品)
   * @param {Object} data - 验收数据
   * @param {string} data.order_id - 订单ID
   * @param {Array<string>} data.images - 成品图片 URL 数组
   * @param {string} [data.notes] - 备注
   * @returns {Promise<{code: number, data: Object}>}
   */
  create(data) {
    return request.post('/reviews', data)
  },

  /**
   * 获取验收详情 (毛娘端)
   * @param {string} id - 验收ID
   * @returns {Promise<{code: number, data: Object}>}
   */
  getDetail(id) {
    return request.get(`/reviews/${id}`)
  },

  /**
   * 通过 token 获取验收详情 (客户端免登录)
   * @param {string} token - 验收访问 token
   * @returns {Promise<{code: number, data: Object}>}
   */
  getByToken(token) {
    return request.get(`/reviews/token/${token}`)
  },

  /**
   * 获取订单的验收记录
   * @param {string} orderId - 订单ID
   * @returns {Promise<{code: number, data: Object}>}
   */
  getByOrderId(orderId) {
    return request.get(`/reviews/order/${orderId}`)
  },

  /**
   * 客户确认满意 (通过验收)
   * @param {string} id - 验收ID
   * @param {string} token - 验收访问 token
   * @returns {Promise<{code: number, message: string}>}
   */
  approve(id, token) {
    return request.post(`/reviews/${id}/approve`, { token })
  },

  /**
   * 客户申请修改
   * @param {string} id - 验收ID
   * @param {Object} data - 修改请求数据
   * @param {string} data.token - 验收访问 token
   * @param {string} data.content - 修改要求描述
   * @param {Array<string>} [data.images] - 参考图片 URL 数组
   * @returns {Promise<{code: number, data: Object}>}
   */
  requestRevision(id, data) {
    return request.post(`/reviews/${id}/revision`, data)
  },

  /**
   * 毛娘提交修改结果
   * @param {string} reviewId - 验收ID
   * @param {string} revisionId - 修改记录ID
   * @param {Object} data - 修改结果数据
   * @param {Array<string>} data.images - 修改后的图片 URL 数组
   * @param {string} [data.notes] - 修改说明
   * @returns {Promise<{code: number, data: Object}>}
   */
  submitRevision(reviewId, revisionId, data) {
    return request.put(`/reviews/${reviewId}/revision/${revisionId}`, data)
  }
}
