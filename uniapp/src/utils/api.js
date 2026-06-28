// API 基础配置
// 小程序必须使用完整URL（包括 http://）
const BASE_URL = 'http://192.168.1.20:3000/api'

// 请求封装
const request = (options) => {
  return new Promise((resolve, reject) => {
    uni.request({
      url: BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data,
      header: {
        'Content-Type': 'application/json',
        ...options.header
      },
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data)
        } else {
          reject(res.data)
        }
      },
      fail: (err) => {
        reject(err)
      }
    })
  })
}

// 旅游团 API
export const groupApi = {
  // 获取列表
  getList: () => request({ url: '/groups' }),

  // 按团名获取详情
  getByName: (groupName) => request({ url: `/groups/by-name/${encodeURIComponent(groupName)}` }),

  // 获取团详情
  getDetail: (id) => request({ url: `/groups/${id}` }),

  // 删除团
  delete: (id) => request({ url: `/groups/${id}`, method: 'DELETE' }),

  // 导入Excel
  import: (formData) => {
    return new Promise((resolve, reject) => {
      uni.uploadFile({
        url: BASE_URL + '/groups/import',
        filePath: formData.filePath,
        name: 'file',
        formData: formData.data,
        success: (res) => {
          if (res.statusCode === 200) {
            resolve(JSON.parse(res.data))
          } else {
            reject(JSON.parse(res.data))
          }
        },
        fail: reject
      })
    })
  },

  // 合并团
  merge: (data) => request({ url: '/groups/merge', method: 'POST', data }),

  // 删除分类
  deleteCategory: (category) => request({ url: `/groups/category/${encodeURIComponent(category)}`, method: 'DELETE' }),

  // 导出座位表
  exportSeats: (id) => {
    return new Promise((resolve, reject) => {
      uni.downloadFile({
        url: BASE_URL + `/groups/${id}/seats`,
        success: (res) => {
          if (res.statusCode === 200) {
            resolve(res.tempFilePath)
          } else {
            reject(res)
          }
        },
        fail: reject
      })
    })
  },

  // 复制信息
  copyInfo: (id) => request({ url: `/groups/${id}/copy` })
}

// 配置 API
export const configApi = {
  get: () => request({ url: '/config' }),
  update: (data) => request({ url: '/config', method: 'PUT', data })
}

// 认证 API
export const authApi = {
  login: (data) => request({ url: '/auth/login', method: 'POST', data }),
  wxLogin: (data) => request({ url: '/auth/wx-login', method: 'POST', data }),
  changePassword: (data) => request({ url: '/auth/password', method: 'PUT', data })
}
