import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { BASE_URL } from '@/config'

export const useUserStore = defineStore('user', () => {
  const userInfo = ref(uni.getStorageSync('user') || null)
  const token = ref(uni.getStorageSync('token') || '')

  const isLoggedIn = computed(() => !!userInfo.value)

  const userName = computed(() => {
    return userInfo.value?.name || ''
  })

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
