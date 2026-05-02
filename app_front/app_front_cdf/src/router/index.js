import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '../views/DashboardView.vue'
import EnvasadoView from '../views/EnvasadoView.vue'
import LoginView from '../views/LoginView.vue'
import NuevoProductoView from '../views/NuevoProductoView.vue'
import ListaProductosView from '../views/ListaProductosView.vue'
import ModificarProductoView from '../views/ModificarProductoView.vue'
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
      path: '/productos/editar',
      name: 'modificar-producto',
      component: ModificarProductoView,
      meta: { requiresAuth: true }
    }
  ],
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else {
    next()
  }
})

export default router
