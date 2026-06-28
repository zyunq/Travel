<template>
  <view class="login-page">
    <view class="login-card">
      <text class="title">登 录</text>

      <!-- 用户名 -->
      <view class="form-group">
        <text class="label">用户名</text>
        <input
          class="input"
          type="text"
          v-model="form.username"
          placeholder="请输入用户名"
          placeholder-class="placeholder"
        />
      </view>

      <!-- 密码 -->
      <view class="form-group">
        <text class="label">密码</text>
        <input
          class="input"
          type="password"
          v-model="form.password"
          placeholder="请输入密码"
          placeholder-class="placeholder"
          @confirm="handleLogin"
        />
      </view>

      <!-- 记住我 -->
      <view class="options-row">
        <label class="remember" @tap="rememberMe = !rememberMe">
          <text class="checkbox" :class="{ checked: rememberMe }">✓</text>
          <text>记住我</text>
        </label>
      </view>

      <!-- 登录按钮 -->
      <button class="login-btn" :loading="loading" @tap="handleLogin">
        {{ loading ? '登录中...' : '登 录' }}
      </button>

      <!-- #ifdef MP-WEIXIN -->
      <!-- 微信登录按钮（仅小程序显示） -->
      <button class="wx-login-btn" open-type="getPhoneNumber" @getphonenumber="handleWxLogin">
        <text class="wx-icon">👤</text>
        微信一键登录
      </button>
      <!-- #endif -->

      <text class="footer-tip">旅游团火车票管理系统</text>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const loading = ref(false)
const rememberMe = ref(false)

const form = reactive({
  username: '',
  password: ''
})

onMounted(() => {
  const savedUsername = uni.getStorageSync('rememberedUsername')
  if (savedUsername) {
    form.username = savedUsername
    rememberMe.value = true
  }
})

// 账号密码登录
const handleLogin = async () => {
  if (!form.username || !form.password) {
    uni.showToast({ title: '请输入用户名和密码', icon: 'none' })
    return
  }

  loading.value = true
  try {
    const result = await userStore.login(form.username, form.password)

    if (result.success) {
      if (rememberMe.value) {
        uni.setStorageSync('rememberedUsername', form.username)
      } else {
        uni.removeStorageSync('rememberedUsername')
      }
      uni.showToast({ title: '登录成功', icon: 'success' })
      uni.switchTab({ url: '/pages/index/index' })
    } else {
      uni.showToast({ title: result.error || '登录失败', icon: 'none' })
    }
  } finally {
    loading.value = false
  }
}

// 微信登录（小程序）
const handleWxLogin = async (e) => {
  if (e.detail.errMsg !== 'getPhoneNumber:ok') {
    uni.showToast({ title: '授权失败', icon: 'none' })
    return
  }

  loading.value = true
  try {
    const result = await userStore.wxLogin()
    if (result.success) {
      uni.showToast({ title: '登录成功', icon: 'success' })
      uni.switchTab({ url: '/pages/index/index' })
    } else {
      uni.showToast({ title: result.error || '登录失败', icon: 'none' })
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40rpx;
}

.login-card {
  width: 100%;
  max-width: 650rpx;
  padding: 80rpx 60rpx;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 40rpx;
  box-shadow: 0 40rpx 120rpx rgba(0, 0, 0, 0.2);
}

.title {
  display: block;
  text-align: center;
  font-size: 56rpx;
  font-weight: 500;
  margin-bottom: 60rpx;
  letter-spacing: 16rpx;
  color: #333;
}

.form-group {
  margin-bottom: 48rpx;
}

.label {
  display: block;
  font-size: 28rpx;
  color: #666;
  margin-bottom: 16rpx;
}

.input {
  width: 100%;
  height: 80rpx;
  padding: 0 20rpx;
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 16rpx;
  font-size: 28rpx;
}

.placeholder {
  color: #999;
}

.options-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 48rpx;
}

.remember {
  display: flex;
  align-items: center;
  font-size: 26rpx;
  color: #666;
}

.checkbox {
  width: 36rpx;
  height: 36rpx;
  border: 2rpx solid #ddd;
  border-radius: 6rpx;
  margin-right: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  color: transparent;
}

.checkbox.checked {
  background: #0d9488;
  border-color: #0d9488;
  color: #fff;
}

.login-btn {
  width: 100%;
  height: 88rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border: none;
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: 500;
  letter-spacing: 8rpx;
}

.login-btn:active {
  opacity: 0.9;
}

.wx-login-btn {
  width: 100%;
  height: 88rpx;
  margin-top: 24rpx;
  background: #07c160;
  color: #fff;
  border: none;
  border-radius: 44rpx;
  font-size: 30rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.wx-icon {
  margin-right: 12rpx;
  font-size: 36rpx;
}

.footer-tip {
  display: block;
  text-align: center;
  font-size: 24rpx;
  color: #999;
  margin-top: 40rpx;
}
</style>
