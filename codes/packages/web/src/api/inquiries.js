import request from './request'

/**
 * 询价管理 API
 */
export const inquiriesApi = {
  /**
   * 客户提交询价 (PRD F-01 结构化表单)
   * @param {Object} data - 询价数据
   * @param {string} data.user_slug - 目标毛娘的 slug
   * @param {string} data.character_name - 角色名
   * @param {string} [data.customer_name] - 客户名称
   * @param {string} [data.customer_contact] - 客户联系方式
   * @param {string} [data.source_work] - 出处作品
   * @param {string} [data.expected_deadline] - 期望交付日期
   * @param {string} [data.wig_source] - 毛坯来源 ('client_sends'|'stylist_buys')
   * @param {string} [data.budget_range] - 预算范围
   * @param {Array<string>} [data.reference_images] - 参考图片 URL 数组
   * @param {string} [data.special_requirements] - 特殊要求
   * @returns {Promise<{code: number, message: string, data: {id: string}}>}
   */
  submit(data) {
    return request.post('/inquiries', data)
  },

  /**
   * 获取询价列表 (毛娘端)
   * @param {Object} params - 查询参数
   * @param {string} [params.status] - 询价状态 ('new'|'quoted'|'converted'|'rejected')
   * @param {number} [params.page=1] - 页码
   * @param {number} [params.limit=20] - 每页数量
   * @returns {Promise<{code: number, data: {list: Array, pagination: Object, statusCount: Object}}>}
   */
  getList(params) {
    return request.get('/inquiries', { params })
  },

  /**
   * 获取询价详情
   * @param {string} id - 询价ID
   * @returns {Promise<{code: number, data: Object}>}
   */
  getDetail(id) {
    return request.get(`/inquiries/${id}`)
  },

  /**
   * 将询价转为订单 (PRD 2.0)
   * @param {string} id - 询价ID
   * @param {Object} data - 订单数据
   * @param {number} data.price - 成交价格
   * @param {string} [data.deadline] - 交付日期 (ISO8601)
   * @returns {Promise<{code: number, message: string, data: Object}>}
   */
  convert(id, data) {
    return request.post(`/inquiries/${id}/convert`, data)
  },

  /**
   * 拒绝询价
   * @param {string} id - 询价ID
   * @param {string} [reason] - 拒绝原因
   * @returns {Promise<{code: number, message: string}>}
   */
  reject(id, reason) {
    return request.put(`/inquiries/${id}/reject`, { reason })
  }
}
