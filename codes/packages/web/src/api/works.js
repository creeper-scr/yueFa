import request from './request'

export const worksApi = {
  // 获取当前用户的作品列表
  getWorks() {
    return request.get('/works')
  },

  // 创建新作品
  createWork(data) {
    return request.post('/works', data)
  },

  // 更新作品
  updateWork(id, data) {
    return request.put(`/works/${id}`, data)
  },

  // 删除作品
  deleteWork(id) {
    return request.delete(`/works/${id}`)
  },

  // 获取指定毛娘的公开作品列表
  getPublicWorks(slug) {
    return request.get(`/users/${slug}/works`)
  }
}
