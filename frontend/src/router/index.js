import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import GroupList from '../views/GroupList.vue'
import GroupDetail from '../views/GroupDetail.vue'
import Config from '../views/Config.vue'

const routes = [
  { path: '/login', name: 'Login', component: Login },
  { path: '/', name: 'GroupList', component: GroupList, meta: { requiresAuth: true } },
  { path: '/group/:groupName', name: 'GroupDetail', component: GroupDetail, meta: { requiresAuth: true } },
  { path: '/config', name: 'Config', component: Config, meta: { requiresAuth: true } }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const user = localStorage.getItem('user')

  if (to.meta.requiresAuth && !user) {
    next('/login')
  } else if (to.path === '/login' && user) {
    next('/')
  } else {
    next()
  }
})

export default router
