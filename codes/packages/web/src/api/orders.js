import request from './request'

export const ordersApi = {
  // 获取订单列表
  getList(params) {
    return request.get('/orders', { params })
  },

  // 获取订单详情
  getDetail(id) {
    return request.get(`/orders/${id}`)
  },

  // 更新订单信息
  update(id, data) {
    return request.put(`/orders/${id}`, data)
  },

  // 更新订单状态
  updateStatus(id, status) {
    return request.put(`/orders/${id}/status`, { status })
  },

  // 添加订单备注
  addNote(id, content) {
    return request.post(`/orders/${id}/notes`, { content })
  }
}
