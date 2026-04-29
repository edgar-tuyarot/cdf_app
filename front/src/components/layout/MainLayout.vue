<script setup>
import { ref, watch } from 'vue'
import { useRoute, RouterView } from 'vue-router'
import Sidebar from './Sidebar.vue'
import Header from './Header.vue'

const route = useRoute()
const isSidebarOpen = ref(false)

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
}

const closeSidebar = () => {
  isSidebarOpen.value = false
}

// Cerrar sidebar automáticamente al cambiar de ruta (en móvil)
watch(() => route?.path, () => {
  closeSidebar()
})
</script>

<template>
  <div class="layout-wrapper">
    <!-- Overlay para móvil -->
    <div 
      v-if="isSidebarOpen" 
      class="sidebar-overlay" 
      @click="closeSidebar"
    ></div>

    <!-- Sidebar con prop de estado -->
    <Sidebar :isOpen="isSidebarOpen" @close="closeSidebar" />

    <div class="main-content">
      <!-- Header con disparador de menú -->
      <Header @toggle-menu="toggleSidebar" />
      
      <main class="page-content">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style scoped>
.layout-wrapper {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  position: relative;
  background: var(--bg-primary);
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background-color: var(--bg-primary);
}

.page-content {
  flex: 1;
  overflow-y: auto;
  padding: 0.25rem;
  background: var(--bg-primary);
}

/* Overlay sólo visible en móvil cuando el menú está abierto */
.sidebar-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 40;
}

@media (min-width: 1024px) {
  .sidebar-overlay {
    display: none;
  }
  .page-content {
    padding: 0.5rem;
  }
}

/* Transición de página */
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
