import request from './request'

export const inquiriesApi = {
  // 客户提交询价
  submit(data) {
    return request.post('/inquiries', data)
  },

  // 获取询价列表(毛娘端)
  getList(params) {
    return request.get('/inquiries', { params })
  },

  // 获取询价详情
  getDetail(id) {
    return request.get(`/inquiries/${id}`)
  },

  // 将询价转为订单
  convert(id, data) {
    return request.post(`/inquiries/${id}/convert`, data)
  },

  // 拒绝询价
  reject(id, reason) {
    return request.put(`/inquiries/${id}/reject`, { reason })
  }
}
