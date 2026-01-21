import request from './request'

/**
 * 订单管理 API
 */
export const ordersApi = {
  /**
   * 获取订单列表 (PRD B-01 包含死线预警)
   * @param {Object} params - 查询参数
   * @param {string} [params.status] - 订单状态
   * @param {number} [params.page=1] - 页码
   * @param {number} [params.limit=20] - 每页数量
   * @returns {Promise<{code: number, data: {list: Array, pagination: Object, statusCount: Object, deadlineAlerts: Array}}>}
   */
  getList(params) {
    return request.get('/orders', { params })
  },

  /**
   * 获取订单详情
   * @param {string} id - 订单ID
   * @returns {Promise<{code: number, data: Object}>}
   */
  getDetail(id) {
    return request.get(`/orders/${id}`)
  },

  /**
   * 更新订单信息
   * @param {string} id - 订单ID
   * @param {Object} data - 更新数据
   * @param {string} [data.customer_name] - 客户名称
   * @param {string} [data.customer_contact] - 客户联系方式
   * @param {string} [data.character_name] - 角色名
   * @param {string} [data.source_work] - 出处作品
   * @param {number} [data.price] - 价格
   * @param {string} [data.deadline] - 交付日期 (ISO8601)
   * @returns {Promise<{code: number, data: Object}>}
   */
  update(id, data) {
    return request.put(`/orders/${id}`, data)
  },

  /**
   * 更新订单状态
   * @param {string} id - 订单ID
   * @param {string} status - 新状态
   * @returns {Promise<{code: number, data: Object}>}
   */
  updateStatus(id, status) {
    return request.put(`/orders/${id}/status`, { status })
  },

  /**
   * 确认定金 (PRD 流程)
   * @param {string} id - 订单ID
   * @param {string} [screenshot] - 支付截图 URL
   * @returns {Promise<{code: number, data: Object, message: string}>}
   */
  confirmDeposit(id, screenshot) {
    return request.put(`/orders/${id}/deposit`, { screenshot })
  },

  /**
   * 确认毛坯收货 (PRD F-03)
   * @param {string} id - 订单ID
   * @param {string} [trackingNo] - 快递单号
   * @returns {Promise<{code: number, data: Object, message: string}>}
   */
  confirmWigReceived(id, trackingNo) {
    return request.put(`/orders/${id}/wig-received`, { tracking_no: trackingNo })
  },

  /**
   * 确认尾款
   * @param {string} id - 订单ID
   * @param {string} [screenshot] - 支付截图 URL
   * @returns {Promise<{code: number, data: Object, message: string}>}
   */
  confirmBalance(id, screenshot) {
    return request.put(`/orders/${id}/balance`, { screenshot })
  },

  /**
   * 发货 (PRD S-01)
   * @param {string} id - 订单ID
   * @param {Object} data - 发货信息
   * @param {string} [data.shipping_company] - 快递公司
   * @param {string} [data.shipping_no] - 快递单号
   * @param {Object} [data.checklist] - 发货检查清单
   * @returns {Promise<{code: number, data: Object, message: string}>}
   */
  ship(id, data) {
    return request.put(`/orders/${id}/ship`, data)
  },

  /**
   * 确认订单完成
   * @param {string} id - 订单ID
   * @returns {Promise<{code: number, data: Object, message: string}>}
   */
  complete(id) {
    return request.put(`/orders/${id}/complete`)
  },

  /**
   * 添加订单备注
   * @param {string} id - 订单ID
   * @param {string} content - 备注内容
   * @returns {Promise<{code: number, data: Object}>}
   */
  addNote(id, content) {
    return request.post(`/orders/${id}/notes`, { content })
  },

  /**
   * 获取订单状态列表 (元数据)
   * @returns {Promise<{code: number, data: {statuses: Array, statusText: Object}}>}
   */
  getStatuses() {
    return request.get('/orders/meta/statuses')
  }
}
