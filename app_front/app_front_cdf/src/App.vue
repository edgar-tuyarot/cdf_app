<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import MainLayout from './layouts/MainLayout.vue'

const route = useRoute()
const isLoginPage = computed(() => route.path === '/login')
</script>

<template>
  <!-- If it's the login page, show without layout shell -->
  <template v-if="isLoginPage">
    <RouterView />
  </template>

  <!-- Otherwise, use the MainLayout with Sidebar and Topbar -->
  <MainLayout v-else>
    <RouterView />
  </MainLayout>
</template>

<style>
/* Global styles can stay here or in main.css */
</style>
