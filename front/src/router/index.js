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
      redirect: '/vencimientos',
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
      path: '/ingresos',
      name: 'ingresos',
      component: () => import('../views/Ingresos.vue'),
      meta: { requiresAuth: true, roles: ['Admin', 'Referente', 'Preparador', 'Feteador', 'Envasador', 'Usuario'] },
    },
    {
      path: '/ingresos-historial',
      redirect: '/ingresos-historial-transferencias'
    },
    {
      path: '/ingresos-historial-transferencias',
      name: 'ingresos-historial-transferencias',
      component: () => import('../views/IngresosHistorial.vue'),
      meta: { requiresAuth: true, tipoComprobante: '26_IN_PT_SU_TR', titulo: 'Ingresos Finalizados - Transferencias', roles: ['Admin', 'Referente', 'Preparador', 'Feteador', 'Envasador', 'Usuario'] },
    },
    {
      path: '/ingresos-historial-proveedores',
      name: 'ingresos-historial-proveedores',
      component: () => import('../views/IngresosHistorial.vue'),
      meta: { requiresAuth: true, tipoComprobante: '26_IN_PT_SU_ED', titulo: 'Ingresos Finalizados - Proveedores', roles: ['Admin', 'Referente', 'Preparador', 'Feteador', 'Envasador', 'Usuario'] },
    },
    {
      path: '/egresos-historial',
      name: 'egresos-historial',
      component: () => import('../views/EgresosHistorial.vue'),
      meta: { requiresAuth: true, roles: ['Admin', 'Referente', 'Preparador', 'Feteador', 'Envasador', 'Usuario'] },
    },
    {
      path: '/registros',
      name: 'registros',
      component: () => import('../views/Registros.vue'),
      meta: { requiresAuth: true, roles: ['Admin', 'Referente', 'Preparador', 'Feteador', 'Envasador', 'Usuario', 'Colaborador'] },
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
    {
      path: '/reportes-pedidos',
      name: 'reportes-pedidos',
      component: () => import('../views/ReportesPedidos.vue'),
      meta: { requiresAuth: true, roles: ['Admin', 'Referente', 'Preparador', 'Colaborador', 'Usuario'] },
    },
    {
      path: '/reportes-produccion',
      name: 'reportes-produccion',
      component: () => import('../views/ReportesProduccion.vue'),
      meta: { requiresAuth: true, roles: ['Admin', 'Referente', 'Feteador', 'Envasador', 'Colaborador'] },
    },
    {
      path: '/reporte-trazabilidad',
      name: 'reporte-trazabilidad',
      component: () => import('../views/ReportesTrazabilidad.vue'),
      meta: { requiresAuth: true, roles: ['Admin', 'Referente', 'Preparador', 'Feteador', 'Envasador', 'Colaborador', 'Usuario'] },
    },
    {
      path: '/stock-debug',
      name: 'stock-debug',
      component: () => import('../views/StockDebug.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/block-config',
      name: 'block-config',
      component: () => import('../views/BlockConfig.vue'),
      meta: { requiresAuth: true, roles: ['Admin'] },
    },

    {
      path: '/wms-stock-ubicaciones',
      name: 'wms-stock-ubicaciones',
      component: () => import('../views/WmsConsultaStockUbicacion.vue'),
      meta: { requiresAuth: true, roles: ['Admin', 'Referente', 'Preparador', 'Colaborador', 'Usuario'] },
    },
    {
      path: '/wms-ordenes-ingreso-pendientes',
      name: 'wms-ordenes-ingreso-pendientes',
      component: () => import('../views/WmsOrdenesIngresoPendientes.vue'),
      meta: { requiresAuth: true, roles: ['Admin', 'Referente', 'Preparador', 'Colaborador', 'Usuario'] },
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

  // Garantizar que los permisos de la base de datos estén cargados antes de validar el acceso a la ruta
  if (authStore.isAuthenticated && authStore.permissions.length === 0) {
    await authStore.loadPermissions()
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
