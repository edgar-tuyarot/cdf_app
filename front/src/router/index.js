import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { pinia } from '../stores'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/Login.vue'),
      meta: { layout: 'blank' },
    },
    {
      path: '/',
      name: 'dashboard',
      component: () => import('../views/Dashboard.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/productos',
      name: 'productos',
      component: () => import('../views/Productos.vue'),
      meta: { requiresAuth: true, roles: ['Admin', 'Referente', 'Preparador', 'Feteador', 'Envasador'] },
    },
    {
      path: '/procesos',
      name: 'procesos',
      component: () => import('../views/Procesos.vue'),
      meta: { requiresAuth: true, roles: ['Admin', 'Referente', 'Feteador', 'Envasador'] },
    },
    {
      path: '/pedidos',
      name: 'pedidos',
      component: () => import('../views/Pedidos.vue'),
      meta: { requiresAuth: true, roles: ['Admin', 'Referente', 'Preparador'] },
    },
    {
      path: '/recortes',
      name: 'recortes',
      component: () => import('../views/Recortes.vue'),
      meta: { requiresAuth: true, roles: ['Admin', 'Referente'] },
    },
    {
      path: '/decomisos',
      name: 'decomisos',
      component: () => import('../views/Decomisos.vue'),
      meta: { requiresAuth: true, roles: ['Admin', 'Referente'] },
    }
  ],
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore(pinia)

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { name: 'login' }
  }

  if (to.name === 'login' && authStore.isAuthenticated) {
    return { name: 'dashboard' }
  }

  if (to.meta.roles) {
    const userRole = authStore.user?.rol?.toLowerCase() || ''
    const allowedRoles = to.meta.roles.map((r) => r.toLowerCase())

    if (userRole !== 'admin' && !allowedRoles.includes(userRole)) {
      return { name: 'dashboard' }
    }
  }
})

export default router
