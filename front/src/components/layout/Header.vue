<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/auth'

const route = useRoute()
const authStore = useAuthStore()
const emit = defineEmits(['toggle-menu'])

const pageTitle = computed(() => {
  const path = route.path
  if (path.startsWith('/productos')) return 'Productos'
  if (path.startsWith('/procesos')) return 'Procesos'
  if (path.startsWith('/pedidos')) return 'Pedidos'
  if (path.startsWith('/recortes')) return 'Recortes'
  if (path.startsWith('/ingreso-recortes')) return 'Ingreso de Recortes'
  if (path.startsWith('/decomisos')) return 'Decomisos'
  if (path === '/') return 'Dashboard'
  return 'CDF CRM'
})
</script>

<template>
  <header class="header glass-panel no-print">
    <div class="header-left">
      <!-- Botón Hamburguesa -->
      <button class="menu-toggle" @click="emit('toggle-menu')">
        <i class="ph ph-list"></i>
      </button>
      <h2 class="page-title">{{ pageTitle }}</h2>
    </div>
    
    <div class="header-right">
      <div class="header-actions">

      </div>
      

    </div>
  </header>
</template>

<style scoped>
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
