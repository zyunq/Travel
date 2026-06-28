<template>
  <div class="login-page">
    <div class="login-card">
      <h2>登 录</h2>

      <form @submit.prevent="handleLogin">
        <!-- 用户名输入框 -->
        <div class="form-group">
          <label>用户名</label>
          <input
            type="text"
            v-model="form.username"
            placeholder="请输入用户名"
          >
          <i class="fa-solid fa-user"></i>
        </div>

        <!-- 密码输入框 -->
        <div class="form-group">
          <label>密码</label>
          <input
            type="password"
            v-model="form.password"
            placeholder="请输入密码"
            @keyup.enter="handleLogin"
          >
          <i class="fa-solid fa-lock"></i>
        </div>

        <!-- 选项行 -->
        <div class="options-row">
          <label class="remember-me">
            <input type="checkbox" v-model="rememberMe">
            记住我
          </label>
          <a href="javascript:;" @click="showChangePassword = true">修改密码</a>
        </div>

        <!-- 登录按钮 -->
        <button type="submit" class="login-btn" :disabled="loading">
          {{ loading ? '登录中...' : '登 录' }}
        </button>

        <!-- 底部提示 -->
        <div class="signup-tip">
          旅游团火车票管理系统
        </div>
      </form>
    </div>

    <!-- 修改密码对话框 -->
    <el-dialog v-model="showChangePassword" title="修改密码" width="400px">
      <el-form :model="pwdForm" label-width="80px">
        <el-form-item label="用户名">
          <el-input v-model="pwdForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="原密码">
          <el-input v-model="pwdForm.oldPassword" type="password" placeholder="请输入原密码" show-password />
        </el-form-item>
        <el-form-item label="新密码">
          <el-input v-model="pwdForm.newPassword" type="password" placeholder="请输入新密码" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showChangePassword = false">取消</el-button>
        <el-button type="primary" @click="changePassword">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const router = useRouter()
const loading = ref(false)
const rememberMe = ref(false)
const showChangePassword = ref(false)

const form = reactive({
  username: '',
  password: ''
})

const pwdForm = reactive({
  username: '',
  oldPassword: '',
  newPassword: ''
})

// 页面加载时检查记住的用户名
onMounted(() => {
  const savedUsername = localStorage.getItem('rememberedUsername')
  if (savedUsername) {
    form.username = savedUsername
    rememberMe.value = true
  }
})

const handleLogin = async () => {
  if (!form.username || !form.password) {
    ElMessage.warning('请输入用户名和密码')
    return
  }

  loading.value = true
  try {
    const response = await axios.post('/api/auth/login', {
      username: form.username,
      password: form.password
    })

    // 记住用户名
    if (rememberMe.value) {
      localStorage.setItem('rememberedUsername', form.username)
    } else {
      localStorage.removeItem('rememberedUsername')
    }

    localStorage.setItem('user', JSON.stringify(response.data))

    ElMessage.success('登录成功')
    router.push('/')
  } catch (error) {
    ElMessage.error(error.response?.data?.error || '登录失败')
  } finally {
    loading.value = false
  }
}

const changePassword = async () => {
  if (!pwdForm.username || !pwdForm.oldPassword || !pwdForm.newPassword) {
    ElMessage.warning('请填写完整信息')
    return
  }

  try {
    // 先登录验证原密码
    const loginRes = await axios.post('/api/auth/login', {
      username: pwdForm.username,
      password: pwdForm.oldPassword
    })

    // 修改密码
    await axios.put('/api/auth/password', {
      userId: loginRes.data.id,
      oldPassword: pwdForm.oldPassword,
      newPassword: pwdForm.newPassword
    })

    ElMessage.success('密码修改成功')
    showChangePassword.value = false
    pwdForm.username = ''
    pwdForm.oldPassword = ''
    pwdForm.newPassword = ''
  } catch (error) {
    ElMessage.error(error.response?.data?.error || '修改失败')
  }
}
</script>

<style scoped>
/* 全屏背景 */
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: url('https://images.unsplash.com/photo-1509316785289-025f5b846b35?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80') no-repeat center center;
  background-size: cover;
  background-attachment: fixed;
}

/* 玻璃拟态登录卡片 */
.login-card {
  width: 100%;
  max-width: 420px;
  padding: 45px 40px;
  /* 毛玻璃核心属性 */
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(12px) saturate(180%);
  -webkit-backdrop-filter: blur(12px) saturate(180%);
  /* 半透明边框 */
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 20px;
  color: #ffffff;
}

/* 标题 */
.login-card h2 {
  text-align: center;
  font-size: 36px;
  font-weight: 500;
  margin-bottom: 35px;
  letter-spacing: 8px;
}

/* 输入框组 */
.form-group {
  position: relative;
  margin-bottom: 32px;
}

.form-group label {
  display: block;
  font-size: 16px;
  margin-bottom: 8px;
  opacity: 0.95;
}

.form-group input {
  width: 100%;
  background: transparent;
  border: none;
  border-bottom: 1px solid rgba(255, 255, 255, 0.8);
  padding: 6px 30px 6px 0;
  color: #ffffff;
  font-size: 15px;
  outline: none;
}

.form-group input::placeholder {
  color: rgba(255, 255, 255, 0.6);
}

/* 输入框右侧图标 */
.form-group i {
  position: absolute;
  right: 0;
  bottom: 8px;
  font-size: 16px;
  opacity: 0.9;
}

/* 选项行 */
.options-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
  font-size: 14px;
}

.remember-me {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  opacity: 0.95;
}

.remember-me input {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.options-row a {
  color: #ffffff;
  text-decoration: none;
  opacity: 0.95;
}

.options-row a:hover {
  text-decoration: underline;
}

/* 登录按钮 */
.login-btn {
  width: 100%;
  padding: 12px 0;
  border: none;
  border-radius: 50px;
  background: #ffffff;
  color: #333333;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  margin-bottom: 25px;
  transition: background 0.2s ease;
  letter-spacing: 4px;
}

.login-btn:hover {
  background: #f0f0f0;
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 底部提示 */
.signup-tip {
  text-align: center;
  font-size: 14px;
  opacity: 0.95;
}

/* 移动端适配 */
@media (max-width: 480px) {
  .login-card {
    margin: 0 20px;
    padding: 35px 25px;
  }

  .login-card h2 {
    font-size: 30px;
    letter-spacing: 6px;
  }
}
</style>
