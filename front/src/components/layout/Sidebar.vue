<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'

const props = defineProps({
  isOpen: Boolean
})

const emit = defineEmits(['close'])

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const allMenuItems = [
  { name: 'Productos', path: '/productos', icon: 'ph-package', roles: ['Admin', 'Referente', 'Preparador', 'Feteador', 'Envasador'] },
  { name: 'Procesos', path: '/procesos', icon: 'ph-arrows-clockwise', roles: ['Admin', 'Referente', 'Feteador', 'Envasador'] },
  { name: 'Pedidos', path: '/pedidos', icon: 'ph-shopping-cart', roles: ['Admin', 'Referente', 'Preparador'] },
  { name: 'Top Productos', path: '/top-productos', icon: 'ph-chart-bar', roles: ['Admin', 'Referente', 'Preparador'] },
  { name: 'Recortes', path: '/recortes', icon: 'ph-scissors', roles: ['Admin', 'Referente'] },
  { name: 'Ingreso Recortes', path: '/ingreso-recortes', icon: 'ph-plus-circle', roles: ['Admin', 'Referente', 'Preparador', 'Feteador', 'Envasador'] },
  { name: 'Decomisos', path: '/decomisos', icon: 'ph-trash', roles: ['Admin', 'Referente'] },
  { name: 'Colaboradores', path: '/colaboradores', icon: 'ph-users', roles: ['Admin'] },
  { name: 'Sucursales', path: '/sucursales', icon: 'ph-storefront', roles: ['Admin'] },
]

const menuItems = computed(() => {
  const userRole = authStore.user?.rol?.toLowerCase() || 'feteador'
  if (userRole === 'admin') return allMenuItems
  return allMenuItems.filter(item => {
    const rolesLower = item.roles.map(r => r.toLowerCase())
    return rolesLower.includes(userRole)
  })
})

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}

const isActive = (path) => {
  if (path === '/') return route.path === '/'
  // Si la ruta es exacta o si es una sub-ruta pero no coincide parcialmente con otra (ej: /feteado vs /feteado-externo)
  return route.path === path || (route.path.startsWith(path + '/') && path !== '/')
}
</script>

<template>
  <aside class="sidebar no-print" :class="{ 'is-open': isOpen }">
    <div class="sidebar-header">
      <div class="logo-container">
        <i class="ph ph-fill ph-cheese logo-icon"></i>
        <h1 class="logo-text">CDF <span class="text-gradient">Gestion</span></h1>
      </div>
      <button class="close-btn" @click="emit('close')" aria-label="Cerrar menú">
        <i class="ph ph-x"></i>
      </button>
    </div>

    <div class="user-profile" v-if="authStore.user">
      <div class="avatar">
        {{ authStore.user.usuario ? authStore.user.usuario.toString().charAt(0).toUpperCase() : '?' }}
      </div>
      <div class="user-info">
        <span class="user-name">{{ authStore.user.usuario }}</span>
        <span class="user-role">{{ authStore.user.rol }}</span>
      </div>
    </div>

    <nav class="sidebar-nav">
      <ul>
        <li v-for="item in menuItems" :key="item.path">
          <router-link 
            :to="item.path" 
            class="nav-link" 
            :class="{ active: isActive(item.path) }"
            @click="emit('close')"
          >
            <i class="ph nav-icon" :class="item.icon"></i>
            <span class="nav-text">{{ item.name }}</span>
          </router-link>
        </li>
      </ul>
    </nav>
    
    <div class="sidebar-footer">
      <!-- 
      <button @click="handleLogout" class="logout-btn">
        <i class="ph ph-sign-out"></i>
        <span>Cerrar Sesión</span>
      </button>
      -->
    </div>
  </aside>
</template>

<style scoped>
/* ---- SIDEBAR CLÁSICO ---- */
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: var(--sidebar-width);
  background: var(--bg-secondary);
  z-index: 100;
  display: flex;
  flex-direction: column;
  transform: translateX(-100%);
  transition: transform 0.2s ease;
  border-right: 2px solid var(--bevel-dark);
  box-shadow: 2px 0 4px rgba(0,0,0,0.3);
}

.sidebar.is-open {
  transform: translateX(0);
}

@media (min-width: 1024px) {
  .sidebar {
    position: static;
    transform: translateX(0);
  }
  .close-btn { display: none; }
}

/* Header: barra azul clásica de título de ventana */
.sidebar-header {
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0.5rem 0 0.75rem;
  background: linear-gradient(to right, #0b5394, #1e6ec8);
  border-bottom: 1px solid #083e73;
  flex-shrink: 0;
}

.logo-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.logo-icon {
  font-size: 1.1rem;
  color: #fffacd;
}

.logo-text {
  font-size: 0.9rem;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 0.05em;
}

.text-gradient {
  color: #fffacd;
}

.close-btn {
  background: #cc0000;
  color: white;
  font-size: 0.75rem;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  box-shadow: var(--raised-shadow);
  flex-shrink: 0;
}

/* Panel de usuario */
.user-profile {
  padding: 0.6rem 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--bevel-dark);
  flex-shrink: 0;
}

.avatar {
  width: 32px;
  height: 32px;
  background: var(--accent-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1rem;
  border: none;
  box-shadow: var(--raised-shadow);
  flex-shrink: 0;
}

.user-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.user-name {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  font-size: 0.7rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* Navegación */
.sidebar-nav {
  flex: 1;
  padding: 0.5rem 0.4rem;
  overflow-y: auto;
}

.sidebar-nav ul {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.5rem 0.75rem;
  color: var(--text-primary);
  font-size: 0.82rem;
  font-weight: 600;
  text-decoration: none;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  transition: none;
  border: 1px solid transparent;
}

.nav-link:hover {
  background: var(--accent-primary-light);
  color: var(--accent-primary);
  border: 1px solid var(--accent-primary);
}

.nav-link.active {
  background: var(--accent-primary);
  color: white;
  border: 1px solid var(--accent-primary-hover);
  box-shadow: var(--inset-shadow);
}

.nav-icon {
  font-size: 1rem;
  flex-shrink: 0;
}

/* Footer */
.sidebar-footer {
  padding: 0.5rem 0.4rem;
  border-top: 1px solid var(--bevel-dark);
  flex-shrink: 0;
}

.logout-btn {
  width: 100%;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: var(--bg-secondary);
  color: var(--accent-danger);
  border: none;
  box-shadow: var(--raised-shadow);
  font-weight: 700;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  cursor: pointer;
}

.logout-btn:active {
  box-shadow: var(--inset-shadow);
}
</style>
