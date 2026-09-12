import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import GroupList from '../views/GroupList.vue'
import GroupDetail from '../views/GroupDetail.vue'
import Config from '../views/Config.vue'
import OCR from '../views/OCR.vue'
import Compare from '../views/Compare.vue'

const routes = [
  { path: '/login', name: 'Login', component: Login },
  { path: '/', name: 'GroupList', component: GroupList, meta: { requiresAuth: true } },
  { path: '/group/:groupName', name: 'GroupDetail', component: GroupDetail, meta: { requiresAuth: true } },
  { path: '/config', name: 'Config', component: Config, meta: { requiresAuth: true } },
  { path: '/ocr', name: 'OCR', component: OCR, meta: { requiresAuth: true } },
  { path: '/compare', name: 'Compare', component: Compare, meta: { requiresAuth: true } }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')

  if (to.meta.requiresAuth && !token) {
    next('/login')
  } else if (to.path === '/login' && token) {
    next('/')
  } else {
    next()
  }
})

export default router
