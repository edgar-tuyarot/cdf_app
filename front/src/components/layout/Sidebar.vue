<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'

const props = defineProps({
  isOpen: Boolean
})

const emit = defineEmits(['close'])

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// Agrupamiento por familias de acciones (Inventario, Producción, Comercial, Reportes y Configuración)
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
      { name: 'Órdenes de Compra', path: '/ordenes-compra', icon: 'ph-shopping-bag', roles: ['Admin', 'Referente', 'Preparador', 'Colaborador', 'Usuario'] },
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
      { name: 'Diferencias WMS', path: '/wms-reporte-diferencias-ingreso', icon: 'ph-warning-octagon', roles: ['Admin', 'Referente', 'Preparador', 'Colaborador', 'Usuario'] }
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

// Determinar qué grupo debe estar abierto inicialmente basado en la ruta activa
const getInitialOpenState = () => {
  const state = {}
  groups.forEach(g => {
    state[g.name] = false
  })
  
  // Buscar qué grupo tiene la ruta activa
  for (const group of groups) {
    const hasActiveItem = group.items.some(item => {
      if (item.path === '/') return route.path === '/'
      return route.path === item.path || (route.path.startsWith(item.path + '/') && item.path !== '/')
    })
    if (hasActiveItem) {
      state[group.name] = true
      return state
    }
  }
  
  // Por defecto, si no coincide ninguno (ej: dashboard), abrimos el primero
  if (groups.length > 0) {
    state[groups[0].name] = true
  }
  return state
}

// Estado abierto/cerrado de cada submenú (acordeón dinámico)
const openGroups = ref(getInitialOpenState())

const toggleGroup = (groupName) => {
  const isCurrentlyOpen = openGroups.value[groupName]
  // Colapsar todos los grupos
  Object.keys(openGroups.value).forEach(key => {
    openGroups.value[key] = false
  })
  // Si el grupo no estaba abierto, lo abrimos
  if (!isCurrentlyOpen) {
    openGroups.value[groupName] = true
  }
}

// Mantener sincronizado el acordeón si la ruta cambia de forma externa
watch(() => route.path, (newPath) => {
  for (const group of groups) {
    const hasActiveItem = group.items.some(item => {
      if (item.path === '/') return newPath === '/'
      return newPath === item.path || (newPath.startsWith(item.path + '/') && item.path !== '/')
    })
    if (hasActiveItem) {
      Object.keys(openGroups.value).forEach(key => {
        openGroups.value[key] = false
      })
      openGroups.value[group.name] = true
      break
    }
  }
})

// Filtrar dinámicamente los grupos y sus sub-ítems según los permisos del rol del usuario
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
  }).filter(group => group.items.length > 0) // Omitir el grupo si no contiene ítems visibles
})

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}

const isActive = (path) => {
  if (!path) return false
  if (path === '/') return route.path === '/'
  return route.path === path || (route.path.startsWith(path + '/') && path !== '/')
}
</script>

<template>
  <aside class="sidebar no-print" :class="{ 'is-open': isOpen }">
    <div class="sidebar-header">
      <div class="logo-container">
        <h1 class="logo-text">CDF Gestion</h1>
      </div>
    </div>

    <nav class="sidebar-nav">
      <div class="menu-groups">
        <div v-for="group in menuGroups" :key="group.name" class="menu-group">
          <!-- Encabezado de Grupo (Botonera colapsable Windows) -->
          <button 
            @click="toggleGroup(group.name)" 
            class="group-header"
            :aria-expanded="openGroups[group.name]"
          >
            <div class="group-title-content">
              <i class="ph group-icon" :class="group.icon"></i>
              <span class="group-name">{{ group.name }}</span>
            </div>
            <i class="ph caret-icon" :class="openGroups[group.name] ? 'ph-caret-down' : 'ph-caret-right'"></i>
          </button>
          
          <!-- Lista de Sub-ítems (Estilo Árbol de Carpetas Windows 98) -->
          <ul v-show="openGroups[group.name]" class="group-items">
            <li v-for="item in group.items" :key="item.name">
              <template v-if="!item.children">
                <router-link 
                  :to="item.path" 
                  class="nav-link" 
                  :class="{ active: isActive(item.path) }"
                  @click="emit('close')"
                >
                  <i class="ph nav-icon" :class="item.icon"></i>
                  <span class="nav-text">{{ item.name }}</span>
                </router-link>
              </template>

              <template v-else>
                <div class="nav-parent-label" style="padding: 0.3rem 0.5rem; font-size: 0.72rem; font-weight: 700; color: var(--text-secondary); display: flex; align-items: center; gap: 0.4rem; text-transform: uppercase;">
                  <i class="ph nav-icon" :class="item.icon"></i>
                  <span>{{ item.name }}</span>
                </div>
                <ul class="subgroup-items" style="list-style: none; padding: 0 0 0 0.8rem; margin: 0; display: flex; flex-direction: column; gap: 2px;">
                  <li v-for="child in item.children" :key="child.path">
                    <router-link 
                      :to="child.path" 
                      class="nav-link" 
                      :class="{ active: isActive(child.path) }"
                      @click="emit('close')"
                    >
                      <i class="ph nav-icon" :class="child.icon"></i>
                      <span class="nav-text">{{ child.name }}</span>
                    </router-link>
                  </li>
                </ul>
              </template>
            </li>
          </ul>
        </div>
      </div>
    </nav>
    
    <div class="sidebar-footer">
      <button @click="handleLogout" class="logout-btn">
        <i class="ph ph-sign-out"></i>
        <span>Cerrar Sesión</span>
      </button>
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
  padding: 0.4rem 0.5rem;
  overflow-y: auto;
}

.menu-groups {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* Cabecera del Grupo */
.group-header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.4rem 0.6rem;
  background-color: var(--bg-window);
  border: 1px solid var(--bevel-light);
  box-shadow: var(--raised-shadow);
  color: var(--text-primary);
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  margin-bottom: 0.2rem;
  text-align: left;
}

.group-header:active {
  box-shadow: var(--inset-shadow);
}

.group-title-content {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.group-icon {
  font-size: 0.95rem;
  color: var(--accent-primary);
}

.caret-icon {
  font-size: 0.8rem;
  color: var(--text-muted);
}

/* Lista de Sub-ítems (Estilo Árbol Clásico Windows) */
.group-items {
  list-style: none;
  padding: 0;
  margin: 0 0 0 0.5rem;
  border-left: 1px dashed #808080;
  padding-left: 0.4rem;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

/* Enlace del Sub-ítem */
.nav-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.6rem;
  color: var(--text-primary);
  font-size: 0.75rem;
  font-weight: 600;
  text-decoration: none;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  transition: none;
  border: 1px solid transparent;
  position: relative;
}

/* Línea de conector horizontal */
.nav-link::before {
  content: "";
  position: absolute;
  left: -0.45rem;
  top: 50%;
  width: 0.45rem;
  border-top: 1px dashed #808080;
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
  font-size: 0.9rem;
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
