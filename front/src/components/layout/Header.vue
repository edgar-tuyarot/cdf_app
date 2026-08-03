<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const emit = defineEmits(['toggle-menu'])

const isColaborador = computed(() => authStore.user?.rol?.toLowerCase() === 'colaborador')
const showBackButton = computed(() => isColaborador.value && route.path !== '/')

const pageTitle = computed(() => {
  const path = route.path
  if (path.startsWith('/productos')) return 'Productos'
  if (path.startsWith('/ingresos')) return 'Ingreso de Mercadería'
  if (path.startsWith('/procesos')) return 'Procesos'
  if (path.startsWith('/pedidos')) return 'Pedidos'
  if (path.startsWith('/recortes')) return 'Recortes'
  if (path.startsWith('/ingreso-recortes')) return 'Ingreso de Recortes'
  if (path.startsWith('/decomisos')) return 'Decomisos'
  if (path.startsWith('/demanda-pendiente')) return 'Demanda Pendiente'
  if (path === '/') return isColaborador.value ? 'Menú Principal' : 'Dashboard'
  return 'CDF CRM'
})
</script>

<template>
  <header class="header glass-panel no-print">
    <div class="header-left">
      <!-- Botón Volver para Colaborador -->
      <button v-if="showBackButton" class="back-btn" @click="router.push('/')">
        <i class="ph ph-arrow-left"></i>
        <span>Volver</span>
      </button>
      <!-- Botón Hamburguesa para otros roles -->
      <button v-else-if="!isColaborador" class="menu-toggle" @click="emit('toggle-menu')">
        <i class="ph ph-list"></i>
      </button>
      <h2 class="page-title">{{ pageTitle }}</h2>
    </div>
    
    <div class="header-right">
      <div v-if="authStore.user?.nombre_ubicacion" class="location-badge">
        <i class="ph ph-map-pin" style="color: var(--accent-primary); font-size: 0.95rem;"></i>
        <span>{{ authStore.user.nombre_ubicacion }}</span>
      </div>
      <div class="header-actions">

      </div>
    </div>
  </header>
</template>

<style scoped>
.location-badge {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.72rem;
  font-weight: bold;
  border: 1px solid var(--bevel-dark);
  text-transform: uppercase;
}

.header {
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0.5rem;
  z-index: 5;
  background: var(--bg-secondary);
  border-bottom: 2px solid var(--bevel-dark);
  box-shadow: 0 2px 0 var(--bevel-light) inset;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.menu-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 28px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 1.1rem;
  border: none;
  cursor: pointer;
  box-shadow: var(--raised-shadow);
}

.menu-toggle:active {
  box-shadow: var(--inset-shadow);
}

.back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  height: 28px;
  padding: 0 0.65rem;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 0.78rem;
  font-weight: 700;
  border: 1px solid var(--bevel-dark);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  box-shadow: var(--raised-shadow);
  text-transform: uppercase;
  transition: all 0.1s ease;
}

.back-btn:active {
  box-shadow: var(--inset-shadow);
  background-color: var(--bg-window);
}

.page-title {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

@media (min-width: 768px) {
  .header { padding: 0 0.75rem; }
  .page-title { font-size: 0.9rem; }
}

@media (min-width: 1024px) {
  .menu-toggle { display: none; }
}
</style>
