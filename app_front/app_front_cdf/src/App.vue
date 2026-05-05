<script setup>
import MainLayout from './layouts/MainLayout.vue'
</script>

<template>
  <!-- If it's the login page, show without layout shell -->
  <template v-if="$route && $route.path === '/login'">
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
