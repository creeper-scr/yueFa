import request from './request'

export const ordersApi = {
  // 获取订单列表 (PRD B-01 包含死线预警)
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

  // 确认定金 (PRD 流程)
  confirmDeposit(id, screenshot) {
    return request.put(`/orders/${id}/deposit`, { screenshot })
  },

  // 确认毛坯收货 (PRD F-03)
  confirmWigReceived(id, trackingNo) {
    return request.put(`/orders/${id}/wig-received`, { tracking_no: trackingNo })
  },

  // 确认尾款
  confirmBalance(id, screenshot) {
    return request.put(`/orders/${id}/balance`, { screenshot })
  },

  // 发货 (PRD S-01)
  ship(id, data) {
    return request.put(`/orders/${id}/ship`, data)
  },

  // 确认完成
  complete(id) {
    return request.put(`/orders/${id}/complete`)
  },

  // 添加订单备注
  addNote(id, content) {
    return request.post(`/orders/${id}/notes`, { content })
  },

  // 获取状态列表
  getStatuses() {
    return request.get('/orders/meta/statuses')
  }
}
