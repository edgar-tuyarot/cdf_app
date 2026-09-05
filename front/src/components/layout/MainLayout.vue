<script setup>
import { useRoute, RouterView } from 'vue-router'
import TopbarNav from './TopbarNav.vue'

const route = useRoute()
</script>

<template>
  <div v-if="route.meta.plainLayout" class="plain-layout-wrapper">
    <RouterView />
  </div>

  <div v-else class="layout-wrapper">
    <!-- Topbar Superior con Menús Desplegables (Dropdowns) -->
    <TopbarNav />

    <main class="page-content">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.plain-layout-wrapper {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow-y: auto;
  background: var(--bg-primary);
}

.layout-wrapper {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  position: relative;
  background: var(--bg-primary);
}

.page-content {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
  background: var(--bg-primary);
}

/* Transición de página */
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
