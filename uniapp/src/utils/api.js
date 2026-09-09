// API 基础配置
import { BASE_URL } from '@/config'

// 请求封装
const request = (options) => {
  return new Promise((resolve, reject) => {
    // 获取用户信息和 token
    const userInfo = uni.getStorageSync('user')
    const token = uni.getStorageSync('token')

    // 构建请求头
    const header = {
      'Content-Type': 'application/json',
      ...options.header
    }

    // 如果有 token，添加到请求头
    if (token) {
      header['Authorization'] = `Bearer ${token}`
    }

    uni.request({
      url: BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data,
      header,
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data)
        } else if (res.statusCode === 401) {
          // token 过期或无效，跳转到登录页
          uni.removeStorageSync('user')
          uni.removeStorageSync('token')
          uni.reLaunch({
            url: '/pages/login/login'
          })
          reject({ error: '登录已过期，请重新登录' })
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
  deleteCategory: (category) => request({
    url: `/groups/category/${encodeURIComponent(category)}`,
    method: 'DELETE'
  }),

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
