<template>
  <div class="login-page">
    <!-- 背景装饰 -->
    <div class="bg-decoration">
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
      <div class="circle circle-3"></div>
      <div class="circle circle-4"></div>
      <div class="circle circle-5"></div>
      <div class="deco-dot deco-dot-1"></div>
      <div class="deco-dot deco-dot-2"></div>
      <div class="deco-dot deco-dot-3"></div>
      <div class="deco-dot deco-dot-4"></div>
      <div class="deco-dot deco-dot-5"></div>
      <div class="geo-line geo-line-1"></div>
      <div class="geo-line geo-line-2"></div>
    </div>

    <div class="login-card">
      <div class="card-header">
        <div class="logo">
          <h1>旅游团火车票管理系统</h1>
          <p>请登录您的账户</p>
        </div>
      </div>

      <div class="card-body">
        <form @submit.prevent="handleLogin">
          <!-- 用户名输入框 -->
          <div class="form-group">
            <label>用户名</label>
            <input
              type="text"
              v-model="form.username"
              placeholder="请输入用户名"
            >
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
          <div class="footer-text">
            专业 · 高效 · 可靠
          </div>
        </form>
      </div>
    </div>

    <!-- 版权信息 -->
    <div class="copyright">© 2024 旅游团火车票管理系统</div>

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
  background: linear-gradient(135deg, #e8f6f4 0%, #d4f4ec 40%, #c6f0e6 70%, #b8ece0 100%);
  position: relative;
  overflow: hidden;
}

/* 噪点纹理层 */
.login-page::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0.03;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  pointer-events: none;
  z-index: 0;
}

/* 背景装饰元素 */
.bg-decoration {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

/* 立体圆形 - 动画 */
.circle {
  position: absolute;
  border-radius: 50%;
  will-change: transform;
}

.circle-1 {
  width: 600px;
  height: 600px;
  top: -250px;
  left: -200px;
  background: radial-gradient(ellipse at 30% 30%,
    rgba(20, 184, 166, 0.18) 0%,
    rgba(13, 148, 136, 0.08) 40%,
    transparent 70%);
  box-shadow:
    inset -60px -40px 120px rgba(255, 255, 255, 0.25),
    inset 40px 60px 80px rgba(13, 148, 136, 0.08),
    0 30px 80px rgba(13, 148, 136, 0.1);
  animation: float1 20s ease-in-out infinite;
}

.circle-2 {
  width: 500px;
  height: 500px;
  bottom: -200px;
  right: -150px;
  background: radial-gradient(ellipse at 70% 70%,
    rgba(20, 184, 166, 0.15) 0%,
    rgba(13, 148, 136, 0.06) 40%,
    transparent 70%);
  box-shadow:
    inset 60px 40px 100px rgba(255, 255, 255, 0.2),
    inset -40px -60px 80px rgba(13, 148, 136, 0.06),
    0 -30px 80px rgba(13, 148, 136, 0.08);
  animation: float2 25s ease-in-out infinite;
}

.circle-3 {
  width: 300px;
  height: 300px;
  top: 35%;
  left: 3%;
  background: radial-gradient(ellipse at 50% 40%,
    rgba(20, 184, 166, 0.12) 0%,
    rgba(13, 148, 136, 0.04) 50%,
    transparent 70%);
  box-shadow:
    inset -20px -15px 50px rgba(255, 255, 255, 0.15),
    0 15px 40px rgba(13, 148, 136, 0.08);
  animation: float3 18s ease-in-out infinite;
}

.circle-4 {
  width: 220px;
  height: 220px;
  top: 12%;
  right: 8%;
  background: radial-gradient(ellipse at 60% 35%,
    rgba(20, 184, 166, 0.14) 0%,
    rgba(13, 148, 136, 0.05) 50%,
    transparent 70%);
  box-shadow:
    inset 20px 15px 40px rgba(255, 255, 255, 0.18),
    0 10px 30px rgba(13, 148, 136, 0.1);
  animation: float4 22s ease-in-out infinite;
}

.circle-5 {
  width: 150px;
  height: 150px;
  bottom: 22%;
  left: 18%;
  background: radial-gradient(ellipse at 45% 55%,
    rgba(20, 184, 166, 0.1) 0%,
    rgba(13, 148, 136, 0.03) 50%,
    transparent 70%);
  box-shadow:
    inset 10px 10px 30px rgba(255, 255, 255, 0.12),
    0 8px 20px rgba(13, 148, 136, 0.06);
  animation: float5 15s ease-in-out infinite;
}

/* 小装饰元素 */
.deco-dot {
  position: absolute;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(20, 184, 166, 0.4), rgba(13, 148, 136, 0.2));
  box-shadow: 0 3px 10px rgba(13, 148, 136, 0.15);
  animation: pulse 4s ease-in-out infinite;
}

.deco-dot-1 { width: 10px; height: 10px; top: 18%; left: 28%; animation-delay: 0s; }
.deco-dot-2 { width: 6px; height: 6px; top: 38%; right: 18%; animation-delay: 0.5s; }
.deco-dot-3 { width: 8px; height: 8px; bottom: 32%; right: 28%; animation-delay: 1s; }
.deco-dot-4 { width: 5px; height: 5px; top: 55%; left: 35%; animation-delay: 1.5s; }
.deco-dot-5 { width: 7px; height: 7px; top: 25%; right: 35%; animation-delay: 2s; }

/* 几何线条装饰 */
.geo-line {
  position: absolute;
  background: linear-gradient(90deg, transparent, rgba(20, 184, 166, 0.15), transparent);
  height: 1px;
  animation: shimmer 8s ease-in-out infinite;
}

.geo-line-1 { width: 200px; top: 30%; left: 5%; transform: rotate(-15deg); animation-delay: 0s; }
.geo-line-2 { width: 150px; bottom: 25%; right: 10%; transform: rotate(20deg); animation-delay: 2s; }

/* 动画定义 */
@keyframes float1 {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  33% { transform: translate(20px, 15px) rotate(2deg); }
  66% { transform: translate(-10px, 10px) rotate(-1deg); }
}

@keyframes float2 {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  33% { transform: translate(-15px, -20px) rotate(-2deg); }
  66% { transform: translate(10px, -10px) rotate(1deg); }
}

@keyframes float3 {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(15px, -10px); }
}

@keyframes float4 {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(-10px, 15px); }
}

@keyframes float5 {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(8px, -8px); }
}

@keyframes pulse {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.2); }
}

@keyframes shimmer {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.8; }
}

/* 登录卡片 */
.login-card {
  width: 100%;
  max-width: 420px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 28px;
  box-shadow:
    0 25px 50px rgba(13, 148, 136, 0.12),
    0 10px 25px rgba(13, 148, 136, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.9),
    inset 0 -1px 0 rgba(13, 148, 136, 0.05);
  overflow: hidden;
  position: relative;
  z-index: 1;
  border: 1px solid rgba(255, 255, 255, 0.6);
  transition: transform 0.4s ease, box-shadow 0.4s ease;
}

.login-card:hover {
  transform: translateY(-4px);
  box-shadow:
    0 35px 70px rgba(13, 148, 136, 0.15),
    0 15px 35px rgba(13, 148, 136, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

/* 装饰性头部 */
.card-header {
  background: linear-gradient(135deg, #15c4b0 0%, #0d9488 50%, #0a7d72 100%);
  padding: 44px 40px 36px;
  position: relative;
  overflow: hidden;
}

/* 头部光效 */
.card-header::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(ellipse at center, rgba(255, 255, 255, 0.15) 0%, transparent 50%);
  animation: headerGlow 8s ease-in-out infinite;
}

@keyframes headerGlow {
  0%, 100% { transform: translate(0, 0); opacity: 0.5; }
  50% { transform: translate(-10%, 10%); opacity: 0.8; }
}

/* 头部装饰圆 */
.card-header::after {
  content: '';
  position: absolute;
  top: -60px;
  right: -60px;
  width: 180px;
  height: 180px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.12) 0%, transparent 70%);
  border-radius: 50%;
}

.logo {
  text-align: center;
  position: relative;
  z-index: 1;
}

.logo h1 {
  font-size: 22px;
  font-weight: 600;
  color: #ffffff;
  letter-spacing: 1.5px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.logo p {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  margin-top: 10px;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* 表单区域 */
.card-body {
  padding: 36px 40px 44px;
}

.form-group {
  margin-bottom: 24px;
  position: relative;
}

.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 10px;
  letter-spacing: 0.3px;
}

.form-group input {
  width: 100%;
  padding: 14px 18px;
  border: 1.5px solid #e5e7eb;
  border-radius: 14px;
  font-size: 15px;
  color: #374151;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  outline: none;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
}

.form-group input:focus {
  border-color: #14b8a6;
  box-shadow:
    0 0 0 4px rgba(20, 184, 166, 0.1),
    0 4px 12px rgba(13, 148, 136, 0.08);
  background: #ffffff;
}

.form-group input::placeholder {
  color: #9ca3af;
}

/* 选项行 */
.options-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  font-size: 13px;
}

.remember-me {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  color: #6b7280;
  transition: color 0.2s;
}

.remember-me:hover {
  color: #374151;
}

.remember-me input {
  width: 17px;
  height: 17px;
  accent-color: #0d9488;
  cursor: pointer;
}

.options-row a {
  color: #0d9488;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.2s;
}

.options-row a:hover {
  color: #0f766e;
  text-decoration: underline;
}

/* 登录按钮 */
.login-btn {
  width: 100%;
  padding: 15px 0;
  border: none;
  border-radius: 14px;
  background: linear-gradient(135deg, #15c4b0 0%, #0d9488 50%, #0a7d72 100%);
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  letter-spacing: 5px;
  box-shadow:
    0 8px 20px rgba(13, 148, 136, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  position: relative;
  overflow: hidden;
}

.login-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.login-btn:hover {
  transform: translateY(-2px);
  box-shadow:
    0 12px 28px rgba(13, 148, 136, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.login-btn:hover::before {
  left: 100%;
}

.login-btn:active {
  transform: translateY(0);
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.login-btn:disabled:hover::before {
  left: -100%;
}

/* 底部提示 */
.footer-text {
  text-align: center;
  margin-top: 28px;
  font-size: 12px;
  color: #9ca3af;
  letter-spacing: 2px;
}

/* 版权信息 */
.copyright {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 12px;
  color: rgba(107, 114, 128, 0.6);
  z-index: 1;
  letter-spacing: 0.5px;
}

/* 移动端适配 */
@media (max-width: 480px) {
  .card-header {
    padding: 36px 24px 30px;
  }

  .card-body {
    padding: 30px 24px 36px;
  }

  .circle-1 {
    width: 350px;
    height: 350px;
  }

  .circle-2 {
    width: 280px;
    height: 280px;
  }

  .copyright {
    display: none;
  }
}
</style>
