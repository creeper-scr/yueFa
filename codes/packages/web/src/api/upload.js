import request from './request'

export const uploadApi = {
  // 获取预签名上传URL
  getPresignUrl(type, filename, contentType) {
    return request.post('/upload/presign', {
      type,
      filename,
      content_type: contentType
    })
  },

  // 上传文件到OSS (使用预签名URL)
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
