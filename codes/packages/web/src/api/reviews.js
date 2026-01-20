import request from './request'

export const reviewsApi = {
  // 创建验收 (毛娘上传成品)
  create(data) {
    return request.post('/reviews', data)
  },

  // 获取验收详情 (毛娘端)
  getDetail(id) {
    return request.get(`/reviews/${id}`)
  },

  // 通过token获取验收详情 (客户端)
  getByToken(token) {
    return request.get(`/reviews/token/${token}`)
  },

  // 获取订单的验收记录
  getByOrderId(orderId) {
    return request.get(`/reviews/order/${orderId}`)
  },

  // 客户确认满意
  approve(id, token) {
    return request.post(`/reviews/${id}/approve`, { token })
  },

  // 客户申请修改
  requestRevision(id, data) {
    return request.post(`/reviews/${id}/revision`, data)
  },

  // 毛娘提交修改结果
  submitRevision(reviewId, revisionId, data) {
    return request.put(`/reviews/${reviewId}/revision/${revisionId}`, data)
  }
}
