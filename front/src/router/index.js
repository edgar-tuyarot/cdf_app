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
      path: '/vencimientos',
      name: 'vencimientos',
      component: () => import('../views/Vencimientos.vue'),
      meta: { requiresAuth: true, roles: ['Admin', 'Referente', 'Preparador', 'Feteador', 'Envasador', 'Usuario'] },
    },
    {
      path: '/control-piezas',
      name: 'control-piezas',
      component: () => import('../views/ControlPiezas.vue'),
      meta: { requiresAuth: true, roles: ['Admin', 'Referente'] },
    },
    {
      path: '/procesos',
      name: 'procesos',
      component: () => import('../views/Procesos.vue'),
      meta: { requiresAuth: true, roles: ['Admin', 'Referente', 'Feteador', 'Envasador', 'Colaborador'] },
    },

    {
      path: '/conversiones',
      name: 'conversiones',
      component: () => import('../views/Conversiones.vue'),
      meta: { requiresAuth: true, roles: ['Admin', 'Referente', 'Feteador', 'Envasador'] },
    },
    {
      path: '/pedidos',
      name: 'pedidos',
      component: () => import('../views/Pedidos.vue'),
      meta: { requiresAuth: true, roles: ['Admin', 'Referente', 'Preparador', 'Colaborador'] },
    },
    {
      path: '/preparar',
      name: 'preparar',
      component: () => import('../views/Preparar.vue'),
      meta: { requiresAuth: true, roles: ['Admin', 'Referente', 'Preparador', 'Colaborador'] },
    },



    {
      path: '/recortes',
      name: 'recortes',
      component: () => import('../views/Recortes.vue'),
      meta: { requiresAuth: true, roles: ['Admin', 'Referente'] },
    },
    {
      path: '/ingreso-recortes',
      name: 'ingreso-recortes',
      component: () => import('../views/RecepcionRecortes.vue'),
      meta: { requiresAuth: true, roles: ['Admin', 'Referente', 'Preparador', 'Feteador', 'Envasador'] },
    },
    {
      path: '/ingresos',
      name: 'ingresos',
      component: () => import('../views/Ingresos.vue'),
      meta: { requiresAuth: true, roles: ['Admin', 'Referente', 'Preparador', 'Feteador', 'Envasador', 'Usuario'] },
    },
    {
      path: '/decomisos',
      name: 'decomisos',
      component: () => import('../views/Decomisos.vue'),
      meta: { requiresAuth: true, roles: ['Admin', 'Referente'] },
    },
    {
      path: '/colaboradores',
      name: 'colaboradores',
      component: () => import('../views/Colaboradores.vue'),
      meta: { requiresAuth: true, roles: ['Admin'] },
    },
    {
      path: '/sucursales',
      name: 'sucursales',
      component: () => import('../views/Sucursales.vue'),
      meta: { requiresAuth: true, roles: ['Admin'] },
    },
    {
      path: '/proveedores',
      name: 'proveedores',
      component: () => import('../views/Proveedores.vue'),
      meta: { requiresAuth: true, roles: ['Admin'] },
    },
    {
      path: '/bultos',
      name: 'bultos',
      component: () => import('../views/Bultos.vue'),
      meta: { requiresAuth: true, roles: ['Admin'] },
    },
    {
      path: '/ubicaciones',
      name: 'ubicaciones',
      component: () => import('../views/Ubicaciones.vue'),
      meta: { requiresAuth: true, roles: ['Admin'] },
    },
    {
      path: '/usuarios',
      name: 'usuarios',
      component: () => import('../views/Usuarios.vue'),
      meta: { requiresAuth: true, roles: ['Admin'] },
    },
    {
      path: '/permisos',
      name: 'permisos',
      component: () => import('../views/Permisos.vue'),
      meta: { requiresAuth: true, roles: ['Admin'] },
    },

    {
      path: '/movimientos-stock',
      name: 'movimientos-stock',
      component: () => import('../views/MovimientosStock.vue'),
      meta: { requiresAuth: true, roles: ['Admin', 'Referente'] },
    },




    {
      path: '/demanda-pendiente',
      name: 'demanda-pendiente',
      component: () => import('../views/DemandaPendiente.vue'),
      meta: { requiresAuth: true, roles: ['Admin', 'Referente', 'Preparador', 'Colaborador', 'Usuario'] },
    },
    {
      path: '/crear-pedido-sucursal',
      name: 'crear-pedido-sucursal',
      component: () => import('../views/CrearPedidoSucursal.vue'),
      meta: { requiresAuth: true },
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

  // Verificar accesos dinámicos basados en permisos cargados desde el servidor
  if (to.meta.requiresAuth && to.name !== 'dashboard') {
    const userRole = authStore.user?.rol?.toLowerCase() || ''
    if (userRole !== 'admin' && !authStore.hasPermission(to.path, to.meta.roles || [])) {
      return { name: 'dashboard' }
    }
  }
})

export default router
