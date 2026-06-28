<template>
  <!-- 登录页面：全屏显示，无导航栏 -->
  <router-view v-if="isLoginPage" />

  <!-- 主页面：带导航栏 -->
  <div v-else class="app-container">
    <!-- 顶部导航栏 -->
    <div class="top-nav">
      <div class="nav-left">
        <div class="logo">
          <el-icon :size="24"><Van /></el-icon>
          <span>旅游团火车票管理系统</span>
        </div>
      </div>
      <div class="nav-right">
        <div class="nav-time">
          <el-icon><Clock /></el-icon>
          <span>{{ currentTime }}</span>
        </div>
        <div class="nav-menu">
          <router-link to="/" class="nav-item" :class="{ active: $route.path === '/' }">
            <el-icon><List /></el-icon>
            <span>旅游团管理</span>
          </router-link>
          <router-link to="/config" class="nav-item" :class="{ active: $route.path === '/config' }">
            <el-icon><Setting /></el-icon>
            <span>费用配置</span>
          </router-link>
        </div>
        <div class="user-dropdown">
          <el-dropdown>
            <div class="user-info">
              <el-icon><User /></el-icon>
              <span>{{ userName }}</span>
              <el-icon class="arrow"><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="handleLogout">
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="main-content">
      <router-view />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Van, Clock, List, Setting, User, ArrowDown, SwitchButton } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const currentTime = ref('')

// 判断是否是登录页面
const isLoginPage = computed(() => route.path === '/login')

const userName = computed(() => {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  return user.name || '用户'
})

// 更新时间
const updateTime = () => {
  const now = new Date()
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const month = now.getMonth() + 1
  const day = now.getDate()
  currentTime.value = `${hours}:${minutes} ${month}月${day}日`
}

let timer = null
onMounted(() => {
  updateTime()
  timer = setInterval(updateTime, 60000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

const handleLogout = () => {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    localStorage.removeItem('user')
    ElMessage.success('已退出登录')
    router.push('/login')
  }).catch(() => {})
}
</script>

<style>
/* 全局样式 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  background: #f0fdfa;
  min-height: 100vh;
  font-family: 'Microsoft YaHei', -apple-system, BlinkMacSystemFont, sans-serif;
}

/* 颜色变量 */
:root {
  --primary: #0d9488;
  --primary-light: #14b8a6;
  --primary-dark: #0f766e;
  --bg-soft: #f0fdfa;
  --card-bg: #ffffff;
  --text-primary: #374151;
  --text-secondary: #6b7280;
  --shadow-soft: 0 8px 32px rgba(13, 148, 136, 0.08);
  --radius-card: 1.25rem;
}

.app-container {
  min-height: 100vh;
  background: var(--bg-soft);
  display: flex;
  flex-direction: column;
}

/* 顶部导航栏 */
.top-nav {
  background: var(--card-bg);
  padding: 12px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: var(--shadow-soft);
  position: sticky;
  top: 0;
  z-index: 100;
  gap: 16px;
}

.nav-left .logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 600;
  color: var(--primary);
  white-space: nowrap;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.nav-time {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: var(--bg-soft);
  border-radius: 10px;
  font-size: 13px;
  color: var(--text-secondary);
  white-space: nowrap;
}

.nav-time .el-icon {
  color: var(--primary);
}

.nav-menu {
  display: flex;
  gap: 6px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 10px;
  font-size: 14px;
  color: var(--text-secondary);
  text-decoration: none;
  transition: all 0.2s;
  white-space: nowrap;
}

.nav-item:hover {
  background: var(--bg-soft);
  color: var(--primary);
}

.nav-item.active {
  background: var(--primary);
  color: white;
}

.user-dropdown {
  cursor: pointer;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--bg-soft);
  border-radius: 10px;
  font-size: 14px;
  color: var(--text-primary);
  white-space: nowrap;
}

.user-info .arrow {
  font-size: 12px;
  color: var(--text-secondary);
}

/* 主内容区 */
.main-content {
  flex: 1;
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

/* 响应式 - 平板 */
@media (max-width: 1024px) {
  .nav-time {
    display: none;
  }

  .nav-item span {
    display: none;
  }

  .nav-item {
    padding: 8px 12px;
  }

  .user-info span:not(.arrow) {
    max-width: 80px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

/* 响应式 - 手机 */
@media (max-width: 640px) {
  .top-nav {
    padding: 10px 16px;
    flex-wrap: wrap;
  }

  .nav-left .logo span {
    display: none;
  }

  .nav-left .logo {
    font-size: 24px;
  }

  .nav-right {
    width: 100%;
    justify-content: space-between;
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px solid #e5e7eb;
  }

  .nav-menu {
    flex: 1;
    justify-content: center;
  }

  .nav-item {
    flex: 1;
    justify-content: center;
    padding: 8px 10px;
    font-size: 13px;
  }

  .nav-item span {
    display: inline;
  }

  .main-content {
    padding: 16px;
  }
}
</style>
