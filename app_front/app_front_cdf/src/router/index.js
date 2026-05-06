import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '../views/DashboardView.vue'
import EnvasadoView from '../views/EnvasadoView.vue'
import LoginView from '../views/LoginView.vue'
import NuevoProductoView from '../views/NuevoProductoView.vue'
import ListaProductosView from '../views/ListaProductosView.vue'
import ModificarProductoView from '../views/ModificarProductoView.vue'
import ExistenciasView from '../views/ExistenciasView.vue'
import ListaExistenciasView from '../views/ListaExistenciasView.vue'
import UbicacionesView from '../views/UbicacionesView.vue'
import UsuariosView from '../views/UsuariosView.vue'
import RolesView from '../views/RolesView.vue'
import ProveedoresView from '../views/ProveedoresView.vue'
import ProduccionView from '../views/ProduccionView.vue'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView
    },
    {
      path: '/',
      name: 'dashboard',
      component: DashboardView,
      meta: { requiresAuth: true }
    },
    {
      path: '/produccion',
      name: 'produccion',
      component: ProduccionView,
      meta: { requiresAuth: true }
    },
    {
      path: '/envasado',
      name: 'envasado',
      component: EnvasadoView,
      meta: { requiresAuth: true }
    },
    {
      path: '/productos/nuevo',
      name: 'nuevo-producto',
      component: NuevoProductoView,
      meta: { requiresAuth: true }
    },
    {
      path: '/productos',
      name: 'lista-productos',
      component: ListaProductosView,
      meta: { requiresAuth: true }
    },
    {
      path: '/productos/editar/:id?',
      name: 'modificar-producto',
      component: ModificarProductoView,
      meta: { requiresAuth: true }
    },
    {
      path: '/productos/reglas-fraccionado',
      name: 'reglas-fraccionado',
      component: () => import('../views/ReglasFraccionadoView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/existencias/nuevo',
      name: 'nueva-existencia',
      component: ExistenciasView,
      meta: { requiresAuth: true }
    },
    {
      path: '/existencias/ver',
      name: 'ver-existencias',
      component: ListaExistenciasView,
      meta: { requiresAuth: true }
    },
    {
      path: '/ubicaciones',
      name: 'ubicaciones',
      component: UbicacionesView,
      meta: { requiresAuth: true }
    },
    {
      path: '/usuarios',
      name: 'usuarios',
      component: UsuariosView,
      meta: { requiresAuth: true }
    },
    {
      path: '/roles',
      name: 'roles',
      component: RolesView,
      meta: { requiresAuth: true }
    },
    {
      path: '/proveedores',
      name: 'proveedores',
      component: ProveedoresView,
      meta: { requiresAuth: true }
    },
    {
      path: '/procesos',
      name: 'procesos',
      component: () => import('../views/ProcesosView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/pedidos/actuales',
      name: 'pedidos-actuales',
      component: () => import('../views/PedidosActualesView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/pedidos/historial',
      name: 'pedidos-historial',
      component: () => import('../views/PedidosView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/pedidos/nuevo',
      name: 'nuevo-pedido',
      component: () => import('../views/CrearPedidoView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/pedidos/seguimiento',
      name: 'pedidos-seguimiento',
      component: () => import('../views/SeguimientoPreparacionView.vue'),
      meta: { requiresAuth: true }
    }
  ],
})

router.beforeEach((to, from) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return '/login'
  }

  // Redirección por Rol: Colaborador solo puede ver Producción y Pedidos Actuales
  if (authStore.isAuthenticated && authStore.isColaborador) {
    const allowedPaths = ['/produccion', '/pedidos/actuales']
    if (!allowedPaths.includes(to.path)) {
      return '/produccion'
    }
  }

  // Redirección de Dashboard para Admin (opcional, si queremos que Admin vea el Dashboard)
  if (authStore.isAuthenticated && !authStore.isColaborador && to.path === '/produccion') {
    return '/'
  }

  return true
})

export default router
