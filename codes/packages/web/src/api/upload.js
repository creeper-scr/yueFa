import request from './request'

/**
 * 文件上传 API
 */
export const uploadApi = {
  /**
   * 获取预签名上传 URL
   * @param {string} type - 文件类型 ('avatar'|'work'|'reference'|'review')
   * @param {string} filename - 文件名
   * @param {string} contentType - MIME 类型 (如 'image/jpeg')
   * @returns {Promise<{code: number, data: {presign_url: string, file_url: string}}>}
   */
  getPresignUrl(type, filename, contentType) {
    return request.post('/upload/presign', {
      type,
      filename,
      content_type: contentType
    })
  },

  /**
   * 上传文件到 OSS (使用预签名 URL)
   * @param {string} presignUrl - 预签名上传 URL
   * @param {File} file - 文件对象
   * @returns {Promise<boolean>} 上传是否成功
   */
  async uploadToOss(presignUrl, file) {
    const response = await fetch(presignUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type
      }
    })
    return response.ok
  }
}
