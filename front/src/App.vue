<script setup>
import { computed } from 'vue'
import { useAuthStore } from './stores/auth'
import MainLayout from './components/layout/MainLayout.vue'
import WinDialog from './components/WinDialog.vue'

const authStore = useAuthStore()
const isAuthenticated = computed(() => authStore.isAuthenticated)
</script>

<template>
  <!-- Si está autenticado, mostramos el layout completo. Si no, solo el router-view (donde estará el Login) -->
  <MainLayout v-if="isAuthenticated" />
  <router-view v-else />
  <WinDialog />
</template>

<style>
/* Los estilos globales se encuentran en assets/main.css */
</style>
