<script setup>
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { useTheme } from '../../composables/useTheme'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { isDarkMode, toggleTheme } = useTheme()

const activeDropdown = ref(null)
const activeSubmenu = ref(null)
const isMobileMenuOpen = ref(false)

// Estructura de grupos de navegación
const groups = [
  {
    name: 'Inventario',
    icon: 'ph-package',
    items: [
      { name: 'Productos', path: '/productos', icon: 'ph-package', roles: ['Admin', 'Referente', 'Preparador', 'Feteador', 'Envasador'] },
      { name: 'Stock Sucursales', path: '/wms-stock-ubicaciones', icon: 'ph-buildings', roles: ['Admin', 'Referente', 'Preparador', 'Feteador', 'Envasador', 'Usuario'] },
      { name: 'Historial de Stock', path: '/movimientos-stock', icon: 'ph-clock-counter-clockwise', roles: ['Admin', 'Referente'] },
      { name: 'Vencimientos', path: '/vencimientos', icon: 'ph-calendar', roles: ['Admin', 'Referente', 'Preparador', 'Feteador', 'Envasador', 'Usuario'] },
    ]
  },
  {
    name: 'Ingresos y Salidas',
    icon: 'ph-arrows-down-up',
    items: [
      { name: 'Ingreso Mercadería', path: '/ingresos', icon: 'ph-download-simple', roles: ['Admin', 'Referente', 'Preparador', 'Feteador', 'Envasador', 'Usuario'] },
      { 
        name: 'Ingresos Pendientes', 
        icon: 'ph-clock-afternoon', 
        roles: ['Admin', 'Referente', 'Preparador', 'Feteador', 'Envasador', 'Usuario'],
        children: [
          { name: 'Proveedores', path: '/wms-ordenes-ingreso-pendientes-proveedores', icon: 'ph-storefront', roles: ['Admin', 'Referente', 'Preparador', 'Feteador', 'Envasador', 'Usuario'] },
          { name: 'Sucursales / CD', path: '/wms-ordenes-ingreso-pendientes-sucursales', icon: 'ph-truck-trailer', roles: ['Admin', 'Referente', 'Preparador', 'Feteador', 'Envasador', 'Usuario'] }
        ]
      },
      { 
        name: 'Ingresos Finalizados', 
        icon: 'ph-receipt', 
        roles: ['Admin', 'Referente', 'Preparador', 'Feteador', 'Envasador', 'Usuario'],
        children: [
          { name: 'Transferencias', path: '/ingresos-historial-transferencias', icon: 'ph-truck-trailer', roles: ['Admin', 'Referente', 'Preparador', 'Feteador', 'Envasador', 'Usuario'] },
          { name: 'Proveedores', path: '/ingresos-historial-proveedores', icon: 'ph-storefront', roles: ['Admin', 'Referente', 'Preparador', 'Feteador', 'Envasador', 'Usuario'] }
        ]
      },
      { name: 'Egresos Finalizados', path: '/egresos-historial', icon: 'ph-clock-counter-clockwise', roles: ['Admin', 'Referente', 'Preparador', 'Feteador', 'Envasador', 'Usuario'] },
    ]
  },
  {
    name: 'Producción',
    icon: 'ph-arrows-clockwise',
    items: [
      { name: 'Procesos', path: '/procesos', icon: 'ph-arrows-clockwise', roles: ['Admin', 'Referente', 'Feteador', 'Envasador', 'Colaborador'] },
      { name: 'Conversiones', path: '/conversiones', icon: 'ph-arrows-left-right', roles: ['Admin', 'Referente', 'Feteador', 'Envasador'] },
      { name: 'Recortes', path: '/recortes', icon: 'ph-scissors', roles: ['Admin', 'Referente'] },
      { name: 'Decomisos', path: '/decomisos', icon: 'ph-trash', roles: ['Admin', 'Referente'] },
    ]
  },
  {
    name: 'Pedidos',
    icon: 'ph-shopping-cart',
    items: [
      { name: 'Preparar', path: '/preparar', icon: 'ph-hourglass', roles: ['Admin', 'Referente', 'Preparador', 'Colaborador'] },
      { name: 'Ver Todos', path: '/pedidos', icon: 'ph-shopping-cart', roles: ['Admin', 'Referente', 'Preparador', 'Colaborador'] },
      { name: 'Cargar Pedido', path: '/crear-pedido-sucursal', icon: 'ph-file-plus', roles: ['Admin', 'Referente', 'Preparador', 'Feteador', 'Envasador'] },
      { name: 'Demanda Pendiente', path: '/demanda-pendiente', icon: 'ph-clipboard-text', roles: ['Admin', 'Referente', 'Preparador', 'Colaborador', 'Usuario'] }
    ]
  },
  {
    name: 'Reportes',
    icon: 'ph-chart-line',
    items: [
      { name: 'Reportes de Pedidos', path: '/reportes-pedidos', icon: 'ph-chart-line-up', roles: ['Admin', 'Referente', 'Preparador', 'Colaborador', 'Usuario'] },
      { name: 'Reporte Producción', path: '/reportes-produccion', icon: 'ph-chart-bar', roles: ['Admin', 'Referente', 'Feteador', 'Envasador', 'Colaborador'] },
      { name: 'Despacho Semanal', path: '/reportes-despacho-semanal', icon: 'ph-truck-trailer', roles: ['Admin', 'Referente', 'Preparador', 'Feteador', 'Envasador', 'Colaborador', 'Usuario'] },
      { name: 'Proyección', path: '/reportes-proyeccion', icon: 'ph-chart-line-up', roles: ['Admin', 'Referente', 'Preparador', 'Feteador', 'Envasador', 'Colaborador', 'Usuario'] },
      { name: 'Trazabilidad de Producto', path: '/reporte-trazabilidad', icon: 'ph-line-segments', roles: ['Admin', 'Referente', 'Preparador', 'Feteador', 'Envasador', 'Colaborador', 'Usuario'] },
      { name: 'Comparaciones de Variabilidad', path: '/comparaciones-variabilidad', icon: 'ph-scales', roles: ['Admin', 'Referente', 'Preparador', 'Feteador', 'Envasador', 'Colaborador', 'Usuario'] },
      { name: 'Próximo Despacho [DEV]', path: '/proximo-despacho-stock', icon: 'ph-trend-up', roles: ['Admin', 'Referente', 'Preparador', 'Feteador', 'Envasador', 'Colaborador', 'Usuario'] }
    ]


  },
  {
    name: 'Configuración',
    icon: 'ph-gear',
    items: [
      { name: 'Colaboradores', path: '/colaboradores', icon: 'ph-users', roles: ['Admin'] },
      { name: 'Sucursales', path: '/sucursales', icon: 'ph-storefront', roles: ['Admin'] },
      { name: 'Proveedores', path: '/proveedores', icon: 'ph-handshake', roles: ['Admin'] },
      { name: 'Bultos', path: '/bultos', icon: 'ph-package', roles: ['Admin'] },
      { name: 'Ubicaciones', path: '/ubicaciones', icon: 'ph-map-pin', roles: ['Admin'] },
      { name: 'Usuarios', path: '/usuarios', icon: 'ph-user-gear', roles: ['Admin'] },
      { name: 'Permisos de Roles', path: '/permisos', icon: 'ph-shield-check', roles: ['Admin'] },
      { name: 'Registros', path: '/registros', icon: 'ph-note-pencil', roles: ['Admin', 'Referente', 'Preparador', 'Feteador', 'Envasador', 'Colaborador', 'Usuario'] },
      { name: 'Block', path: '/block-config', icon: 'ph-shield-check', roles: ['Admin', 'Referente'] },
      { name: 'Debug Stock PHP', path: '/stock-debug', icon: 'ph-bug', roles: ['Admin', 'Referente', 'Preparador', 'Feteador', 'Envasador', 'Colaborador', 'Usuario'] },
    ]
  }
]

// Filtrar grupos según permisos de rol
const menuGroups = computed(() => {
  return groups.map(group => {
    const filteredItems = group.items.map(item => {
      if (item.children && Array.isArray(item.children)) {
        const filteredChildren = item.children.filter(child => authStore.hasPermission(child.path, child.roles))
        return {
          ...item,
          children: filteredChildren
        }
      }
      return item
    }).filter(item => {
      if (item.children) return item.children.length > 0
      return authStore.hasPermission(item.path, item.roles)
    })

    return {
      ...group,
      items: filteredItems
    }
  }).filter(group => group.items.length > 0)
})

const isColaborador = computed(() => authStore.user?.rol?.toLowerCase() === 'colaborador')

const toggleDropdown = (groupName) => {
  if (activeDropdown.value === groupName) {
    activeDropdown.value = null
    activeSubmenu.value = null
  } else {
    activeDropdown.value = groupName
    activeSubmenu.value = null
  }
}

const closeAll = () => {
  activeDropdown.value = null
  activeSubmenu.value = null
  isMobileMenuOpen.value = false
}

const navigateTo = (path) => {
  if (!path) return
  router.push(path)
  closeAll()
}

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}

const isActive = (path) => {
  if (!path) return false
  if (path === '/') return route.path === '/'
  return route.path === path || (route.path.startsWith(path + '/') && path !== '/')
}

const isItemActive = (item) => {
  if (item.path) return isActive(item.path)
  if (item.children) return item.children.some(c => isActive(c.path))
  return false
}

const isGroupActive = (group) => {
  return group.items.some(item => isItemActive(item))
}

// Cerrar desplegables al hacer clic fuera del menú
const handleOutsideClick = (e) => {
  const navContainer = document.querySelector('.topbar-nav-container')
  if (navContainer && !navContainer.contains(e.target)) {
    activeDropdown.value = null
    activeSubmenu.value = null
  }
}

watch(() => route.path, () => {
  closeAll()
})

onMounted(() => {
  document.addEventListener('click', handleOutsideClick)
})

onUnmounted(() => {
  document.removeEventListener('click', handleOutsideClick)
})
</script>

<template>
  <header class="topbar-header no-print">
    <div class="topbar-main">
      <!-- Sección Izquierda: Logo y Título -->
      <div class="topbar-brand" @click="router.push('/')">
        <div class="brand-badge">CDF</div>
        <span class="brand-text">Gestión</span>
      </div>

      <!-- Menú Navegación Horizontal con Dropdowns (Desktop) -->
      <nav v-if="!isColaborador" class="topbar-nav-container">
        <div 
          v-for="group in menuGroups" 
          :key="group.name" 
          class="nav-dropdown-wrapper"
          @mouseenter="activeDropdown = group.name"
          @mouseleave="activeDropdown = null; activeSubmenu = null"
        >
          <button 
            type="button"
            class="topbar-group-btn" 
            :class="{ 'group-active': isGroupActive(group), 'dropdown-open': activeDropdown === group.name }"
            @click.stop="toggleDropdown(group.name)"
          >
            <i class="ph group-icon" :class="group.icon"></i>
            <span>{{ group.name }}</span>
            <i class="ph ph-caret-down caret-icon"></i>
          </button>

          <!-- Menú desplegable dropdown -->
          <transition name="dropdown-fade">
            <div v-show="activeDropdown === group.name" class="dropdown-menu">
              <template v-for="item in group.items" :key="item.name">
                
                <!-- Ítem Directo -->
                <div 
                  v-if="!item.children"
                  class="dropdown-item"
                  :class="{ active: isActive(item.path) }"
                  @click="navigateTo(item.path)"
                >
                  <i class="ph item-icon" :class="item.icon"></i>
                  <span class="item-text">{{ item.name }}</span>
                </div>

                <!-- Ítem con Submenú (Flyout Lateral) -->
                <div 
                  v-else
                  class="dropdown-item has-children"
                  :class="{ active: isItemActive(item), 'submenu-open': activeSubmenu === item.name }"
                  @mouseenter="activeSubmenu = item.name"
                  @mouseleave="activeSubmenu = null"
                >
                  <div class="item-main-content">
                    <i class="ph item-icon" :class="item.icon"></i>
                    <span class="item-text">{{ item.name }}</span>
                  </div>
                  <i class="ph ph-caret-right caret-right-icon"></i>

                  <!-- Panel Flotante Submenú Lateral -->
                  <transition name="dropdown-fade">
                    <div v-show="activeSubmenu === item.name" class="submenu-flyout">
                      <div 
                        v-for="child in item.children" 
                        :key="child.path"
                        class="dropdown-item child-item"
                        :class="{ active: isActive(child.path) }"
                        @click.stop="navigateTo(child.path)"
                      >
                        <i class="ph item-icon" :class="child.icon"></i>
                        <span class="item-text">{{ child.name }}</span>
                      </div>
                    </div>
                  </transition>
                </div>

              </template>
            </div>
          </transition>
        </div>
      </nav>

      <!-- Botón de retorno para rol Colaborador -->
      <div v-else class="colaborador-nav">
        <button v-if="route.path !== '/'" class="back-btn" @click="router.push('/')">
          <i class="ph ph-arrow-left"></i>
          <span>Volver al Menú</span>
        </button>
      </div>

      <!-- Sección Derecha: Usuario, Tema & Logout -->
      <div class="topbar-right">
        <div class="user-badge" v-if="authStore.user">
          <i class="ph ph-user"></i>
          <span class="user-name">{{ authStore.user.nombre || authStore.user.usuario }}</span>
          <span class="user-role">({{ authStore.user.rol }})</span>
        </div>

        <!-- Toggle Tema (Claro / Oscuro) -->
        <button 
          type="button" 
          @click="toggleTheme" 
          class="theme-toggle-btn" 
          :title="isDarkMode ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'"
        >
          <i class="ph" :class="isDarkMode ? 'ph-sun-dim' : 'ph-moon-stars'"></i>
          <span class="theme-toggle-text">{{ isDarkMode ? 'Claro' : 'Oscuro' }}</span>
        </button>

        <button @click="handleLogout" class="logout-btn" title="Cerrar sesión en CDF Gestión">
          <i class="ph ph-sign-out"></i>
          <span class="logout-text">Salir</span>
        </button>

        <!-- Hamburguesa Móvil -->
        <button class="mobile-toggle-btn" @click="isMobileMenuOpen = !isMobileMenuOpen">
          <i class="ph" :class="isMobileMenuOpen ? 'ph-x' : 'ph-list'"></i>
        </button>
      </div>
    </div>

    <!-- Menú Desplegable Móvil -->
    <transition name="mobile-slide">
      <div v-if="isMobileMenuOpen" class="mobile-menu-overlay">
        <div class="mobile-menu-content">
          <div v-for="group in menuGroups" :key="'mob-' + group.name" class="mobile-group">
            <div class="mobile-group-title">
              <i class="ph" :class="group.icon"></i>
              <span>{{ group.name }}</span>
            </div>
            <div class="mobile-group-items">
              <template v-for="item in group.items" :key="'mob-item-' + item.name">
                
                <div 
                  v-if="!item.children"
                  class="mobile-item"
                  :class="{ active: isActive(item.path) }"
                  @click="navigateTo(item.path)"
                >
                  <i class="ph" :class="item.icon"></i>
                  <span>{{ item.name }}</span>
                </div>

                <div v-else class="mobile-subgroup">
                  <div class="mobile-subgroup-title">
                    <i class="ph" :class="item.icon"></i>
                    <span>{{ item.name }}</span>
                  </div>
                  <div class="mobile-subgroup-items">
                    <div 
                      v-for="child in item.children"
                      :key="'mob-child-' + child.path"
                      class="mobile-item child"
                      :class="{ active: isActive(child.path) }"
                      @click="navigateTo(child.path)"
                    >
                      <i class="ph" :class="child.icon"></i>
                      <span>{{ child.name }}</span>
                    </div>
                  </div>
                </div>

              </template>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </header>
</template>

<style scoped>
.topbar-header {
  width: 100%;
  background: #111827;
  border-bottom: 2px solid var(--accent-primary);
  box-shadow: none;
  position: relative;
  z-index: 1000;
  color: #f8fafc;
}

.topbar-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 1rem;
  gap: 1rem;
}

/* Branding Logo */
.topbar-brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  user-select: none;
  flex-shrink: 0;
}

.brand-badge {
  background: var(--accent-primary);
  color: #ffffff;
  font-weight: 900;
  font-size: 0.85rem;
  padding: 0.2rem 0.45rem;
  border-radius: 4px;
  letter-spacing: 0.05em;
  border: 1px solid var(--bevel-dark);
}

.brand-text {
  font-size: 1.05rem;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: 0.03em;
}

/* Nav Container Desktop */
.topbar-nav-container {
  display: none;
  align-items: stretch;
  gap: 0;
  height: 100%;
  margin: 0;
  padding: 0;
}

@media (min-width: 1024px) {
  .topbar-nav-container {
    display: flex;
  }
}

.nav-dropdown-wrapper {
  position: relative;
  height: 100%;
  display: flex;
  align-items: stretch;
  margin: 0;
  padding: 0;
}

.topbar-group-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  height: 100%;
  padding: 0 1rem;
  margin: 0;
  background: transparent;
  color: #d1d5db;
  border: none;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 0.82rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  cursor: pointer;
  border-radius: 0 !important;
  transition: all 0.15s ease;
}

.topbar-group-btn:hover,
.topbar-group-btn.dropdown-open {
  background: rgba(255, 255, 255, 0.15);
  color: #ffffff;
}

.topbar-group-btn.group-active {
  background: var(--accent-primary);
  color: #ffffff;
  border-right-color: transparent;
}

.group-icon {
  font-size: 1.05rem;
}

.caret-icon {
  font-size: 0.75rem;
  transition: transform 0.15s ease;
}

.topbar-group-btn.dropdown-open .caret-icon {
  transform: rotate(180deg);
}

/* Dropdown Menu Floating Panel */
.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  min-width: 220px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1.5px solid var(--bevel-dark);
  border-radius: 4px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  padding: 0.4rem 0;
  z-index: 1100;
}

.dropdown-item {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0.65rem;
  padding: 0.55rem 1rem;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.12s ease;
  position: relative;
  text-align: left;
}

.dropdown-item.has-children {
  justify-content: space-between;
}

.item-main-content {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.dropdown-item:hover {
  background: var(--accent-primary-light);
  color: var(--accent-primary);
}

.dropdown-item.active {
  background: var(--accent-primary);
  color: #ffffff;
  font-weight: 700;
}

.caret-right-icon {
  font-size: 0.75rem;
  color: #64748b;
  margin-left: 0.5rem;
}

.dropdown-item:hover .caret-right-icon {
  color: #0284c7;
}

.dropdown-item.active .caret-right-icon {
  color: #ffffff;
}

/* Submenu Lateral Flotante (Flyout 2º Nivel) */
.submenu-flyout {
  position: absolute;
  top: -4px;
  left: 100%;
  min-width: 190px;
  background: #ffffff;
  color: #0f172a;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  padding: 0.4rem 0;
  z-index: 1200;
}

.dropdown-item.child-item {
  padding: 0.5rem 0.9rem;
}

.item-icon {
  font-size: 1.05rem;
  flex-shrink: 0;
}

/* Transición Dropdown Fade */
.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* Sección Derecha */
.topbar-right {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-left: auto;
}

.user-badge {
  display: none;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.78rem;
  color: #e2e8f0;
}

@media (min-width: 1280px) {
  .user-badge {
    display: flex;
  }
}

.user-name {
  font-weight: 700;
}

.user-role {
  color: #94a3b8;
  font-size: 0.7rem;
  text-transform: uppercase;
}

.logout-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  height: 32px;
  padding: 0 0.75rem;
  background: rgba(220, 38, 38, 0.2);
  color: #fca5a5;
  border: 1.5px solid rgba(239, 68, 68, 0.4);
  border-radius: var(--border-radius-md) !important;
  font-weight: 800;
  font-size: 0.78rem;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.logout-btn:hover {
  background: #dc2626;
  color: #ffffff;
  border-color: #b91c1c;
}

.mobile-toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  border: none;
  width: 34px;
  height: 34px;
  border-radius: 4px;
  font-size: 1.3rem;
  cursor: pointer;
}

@media (min-width: 1024px) {
  .mobile-toggle-btn {
    display: none;
  }
}

/* Menú Móvil Desplegable */
.mobile-menu-overlay {
  position: absolute;
  top: 48px;
  left: 0;
  right: 0;
  background: #0f172a;
  border-bottom: 2px solid #0284c7;
  max-height: calc(100vh - 48px);
  overflow-y: auto;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.4);
}

.mobile-menu-content {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.mobile-group-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  font-weight: 800;
  color: #38bdf8;
  text-transform: uppercase;
  margin-bottom: 0.4rem;
}

.mobile-group-items {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.mobile-subgroup {
  background: #1e293b;
  padding: 0.5rem;
  border-radius: 4px;
  border-left: 3px solid #0284c7;
}

.mobile-subgroup-title {
  font-size: 0.78rem;
  font-weight: 800;
  color: #38bdf8;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.35rem;
  text-transform: uppercase;
}

.mobile-subgroup-items {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 0.35rem;
}

.mobile-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: #1e293b;
  color: #e2e8f0;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}

.mobile-item.child {
  background: #0f172a;
}

.mobile-item.active {
  background: #0284c7;
  color: #ffffff;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: #0284c7;
  color: #ffffff;
  border: none;
  padding: 0.35rem 0.75rem;
  border-radius: 4px;
  font-weight: 800;
  font-size: 0.8rem;
  cursor: pointer;
}

.theme-toggle-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  height: 32px;
  padding: 0 0.7rem;
  background: rgba(255, 255, 255, 0.1);
  color: #f3f4f6;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--border-radius-md) !important;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.theme-toggle-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.4);
  color: #ffffff;
}
</style>
