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
      path: '/stock-feteados',
      name: 'stock-feteados',
      component: () => import('../views/StockFeteados.vue'),
      meta: { requiresAuth: true, roles: ['Admin', 'Envasador', 'Feteador', 'Referente'] },
    },
    {
      path: '/envasado',
      name: 'envasado',
      component: () => import('../views/Envasado.vue'),
      meta: { requiresAuth: true, roles: ['Admin', 'Envasador', 'Referente'] },
    },
    {
      path: '/despachos',
      name: 'despachos',
      component: () => import('../views/Despachos.vue'),
      meta: { requiresAuth: true, roles: ['Admin'] },
    },
    {
      path: '/pedidos-sucursales',
      name: 'pedidos-sucursales',
      component: () => import('../views/PedidosSucursales.vue'),
      meta: { requiresAuth: true, roles: ['Admin', 'Preparador', 'Referente'] },
    },
    {
      path: '/feteado',
      name: 'feteado',
      component: () => import('../views/RegistroFeteado.vue'),
      meta: { requiresAuth: true, roles: ['Admin', 'Feteador', 'Envasador', 'Referente'] },
    },
    {
      path: '/ingreso-proveedores',
      name: 'ingreso-proveedores',
      component: () => import('../views/IngresoProveedores.vue'),
      meta: { requiresAuth: true, roles: ['Admin'] },
    },
    {
      path: '/abm-globales',
      name: 'abm-globales',
      component: () => import('../views/AbmGlobales.vue'),
      meta: { requiresAuth: true, roles: ['Admin'] },
    },
    {
      path: '/abm-usuarios',
      name: 'abm-usuarios',
      component: () => import('../views/AbmUsuarios.vue'),
      meta: { requiresAuth: true, roles: ['Admin'] },
    },
    {
      path: '/piezas',
      name: 'piezas',
      component: () => import('../views/StockPiezas.vue'),
      meta: { requiresAuth: true, roles: ['Admin', 'Referente'] },
    },
    {
      path: '/conversiones',
      name: 'conversiones',
      component: () => import('../views/Conversiones.vue'),
      meta: { requiresAuth: true, roles: ['Admin', 'Referente'] },
    },
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
