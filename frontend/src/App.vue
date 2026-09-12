<template>
  <!-- 登录页面：全屏显示，无导航栏 -->
  <router-view v-if="isLoginPage" />

  <!-- 主页面：带导航栏 -->
  <div v-else class="app-container">
    <!-- 顶部导航栏 -->
    <div class="top-nav">
      <div class="nav-left">
        <button class="sidebar-toggle" @click="toggleSidebar">
          <el-icon><Expand v-if="!sidebarCollapsed" /><Fold v-else /></el-icon>
        </button>
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

    <!-- 主内容区域（带侧边栏） -->
    <div class="main-wrapper">
      <!-- 侧边栏 -->
      <div class="sidebar" :class="{ collapsed: sidebarCollapsed }">
        <div class="sidebar-content">
          <!-- 工具区 -->
          <div class="sidebar-section">
            <div class="section-title" v-if="!sidebarCollapsed">工具箱</div>
            <div
              class="sidebar-item"
              :class="{ active: $route.path === '/ocr' }"
              @click="navigateTo('/ocr')"
            >
              <el-icon><Camera /></el-icon>
              <span v-if="!sidebarCollapsed">证件识别</span>
            </div>
            <div
              class="sidebar-item"
              :class="{ active: $route.path === '/compare' }"
              @click="navigateTo('/compare')"
            >
              <el-icon><Sort /></el-icon>
              <span v-if="!sidebarCollapsed">名单对比</span>
            </div>
          </div>

          <!-- 快捷操作 -->
          <div class="sidebar-section" v-if="!sidebarCollapsed">
            <div class="section-title">快捷操作</div>
            <div class="sidebar-item" @click="quickImport">
              <el-icon><Upload /></el-icon>
              <span>批量导入</span>
            </div>
            <div class="sidebar-item" @click="quickExport">
              <el-icon><Download /></el-icon>
              <span>导出数据</span>
            </div>
          </div>
        </div>

        <!-- 折叠按钮 -->
        <div class="sidebar-footer" v-if="!sidebarCollapsed">
          <div class="sidebar-item" @click="toggleSidebar">
            <el-icon><Fold /></el-icon>
            <span>收起侧栏</span>
          </div>
        </div>
      </div>

      <!-- 主内容 -->
      <div class="main-content" :class="{ expanded: sidebarCollapsed }">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Van, Clock, List, Setting, User, ArrowDown, SwitchButton,
  Expand, Fold, Camera, Upload, Download, Sort
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const currentTime = ref('')
const sidebarCollapsed = ref(false)

// 判断是否是登录页面
const isLoginPage = computed(() => route.path === '/login')

const userName = computed(() => {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  return user.name || '用户'
})

// 切换侧边栏
const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
  localStorage.setItem('sidebarCollapsed', sidebarCollapsed.value)
}

// 导航到指定页面
const navigateTo = (path) => {
  router.push(path)
}

// 快捷导入
const quickImport = () => {
  router.push('/')
  // 触发导入对话框（通过事件总线或 provide/inject）
  ElMessage.info('请在旅游团管理页面点击"导入 Excel"')
}

// 快捷导出
const quickExport = () => {
  ElMessage.info('导出功能开发中...')
}

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
  // 恢复侧边栏状态
  const saved = localStorage.getItem('sidebarCollapsed')
  if (saved !== null) {
    sidebarCollapsed.value = saved === 'true'
  }
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
    localStorage.removeItem('token')
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
  --sidebar-width: 200px;
  --sidebar-collapsed: 60px;
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

.nav-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sidebar-toggle {
  width: 36px;
  height: 36px;
  border: none;
  background: var(--bg-soft);
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary);
  transition: all 0.2s;
}

.sidebar-toggle:hover {
  background: var(--primary);
  color: white;
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

/* 主内容区域包装器 */
.main-wrapper {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* 侧边栏 */
.sidebar {
  width: var(--sidebar-width);
  background: var(--card-bg);
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  flex-shrink: 0;
}

.sidebar.collapsed {
  width: var(--sidebar-collapsed);
}

.sidebar-content {
  flex: 1;
  padding: 16px 8px;
  overflow-y: auto;
}

.sidebar-section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 12px;
  color: var(--text-secondary);
  padding: 8px 12px;
  font-weight: 500;
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  cursor: pointer;
  color: var(--text-primary);
  transition: all 0.2s;
  margin-bottom: 4px;
}

.sidebar-item:hover {
  background: var(--bg-soft);
  color: var(--primary);
}

.sidebar-item.active {
  background: linear-gradient(135deg, #ccfbf1 0%, #99f6e4 100%);
  color: var(--primary);
  font-weight: 500;
}

.sidebar-item .el-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.sidebar-item span {
  font-size: 14px;
  white-space: nowrap;
}

.sidebar.collapsed .sidebar-item {
  justify-content: center;
  padding: 10px;
}

.sidebar-footer {
  padding: 8px;
  border-top: 1px solid #e5e7eb;
}

/* 主内容区 */
.main-content {
  flex: 1;
  padding: 20px;
  max-width: calc(100% - var(--sidebar-width));
  overflow-y: auto;
  transition: max-width 0.3s ease;
}

.main-content.expanded {
  max-width: calc(100% - var(--sidebar-collapsed));
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

  /* 平板下侧边栏默认折叠 */
  .sidebar {
    width: var(--sidebar-collapsed);
  }

  .main-content {
    max-width: calc(100% - var(--sidebar-collapsed));
  }

  .sidebar .section-title,
  .sidebar-item span {
    display: none;
  }

  .sidebar-item {
    justify-content: center;
    padding: 10px;
  }
}

/* 响应式 - 手机 */
@media (max-width: 640px) {
  .sidebar-toggle {
    display: none;
  }

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

  /* 手机端隐藏侧边栏 */
  .sidebar {
    display: none;
  }

  .main-content {
    max-width: 100%;
    padding: 16px;
  }
}
</style>
