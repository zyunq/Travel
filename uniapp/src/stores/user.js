import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// API 基础地址 - 小程序必须使用完整URL
const BASE_URL = 'http://101.34.71.12:3000/api'

export const useUserStore = defineStore('user', () => {
  // 状态
  const userInfo = ref(uni.getStorageSync('user') || null)
  const token = ref(uni.getStorageSync('token') || '')

  // 计算属性
  const isLoggedIn = computed(() => !!userInfo.value)
  const userName = computed(() => userInfo.value?.name || '')

  // 登录
  const login = async (username, password) => {
    return new Promise((resolve) => {
      uni.request({
        url: BASE_URL + '/auth/login',
        method: 'POST',
        data: { username, password },
        success: (res) => {
          if (res.statusCode === 200) {
            userInfo.value = res.data
            uni.setStorageSync('user', res.data)
            resolve({ success: true })
          } else {
            resolve({ success: false, error: res.data?.error || '登录失败' })
          }
        },
        fail: (err) => {
          console.error('登录请求失败:', err)
          resolve({ success: false, error: '网络连接失败' })
        }
      })
    })
  }

  // 微信登录（小程序）
  const wxLogin = async () => {
    return new Promise((resolve) => {
      uni.login({
        provider: 'weixin',
        success: (loginRes) => {
          if (!loginRes.code) {
            resolve({ success: false, error: '微信登录失败' })
            return
          }

          uni.request({
            url: BASE_URL + '/auth/wx-login',
            method: 'POST',
            data: { code: loginRes.code },
            success: (res) => {
              if (res.statusCode === 200) {
                userInfo.value = res.data
                uni.setStorageSync('user', res.data)
                resolve({ success: true })
              } else {
                resolve({ success: false, error: res.data?.error || '登录失败' })
              }
            },
            fail: () => {
              resolve({ success: false, error: '网络连接失败' })
            }
          })
        },
        fail: () => {
          resolve({ success: false, error: '微信授权失败' })
        }
      })
    })
  }

  // 退出登录
  const logout = () => {
    userInfo.value = null
    token.value = ''
    uni.removeStorageSync('user')
    uni.removeStorageSync('token')
  }

  return {
    userInfo,
    token,
    isLoggedIn,
    userName,
    login,
    wxLogin,
    logout
  }
})
