<script setup>
import { ref } from 'vue'
import Sidebar from '../components/Sidebar.vue'
import TopNavbar from '../components/TopNavbar.vue'

const isSidebarOpen = ref(false)

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
}
</script>

<template>
  <div class="app-layout">
    <!-- Sidebar Component -->
    <Sidebar :isOpen="isSidebarOpen" @close="isSidebarOpen = false" />

    <!-- Top Navigation -->
    <header class="app-header">
      <!-- Mobile Trigger & Logo -->
      <div class="mobile-header-content mobile-only">
        <button class="menu-trigger" @click="toggleSidebar">☰</button>
        <div class="header-logo">CDF APP</div>
      </div>

      <!-- Desktop Navbar -->
      <div class="desktop-only w-full">
        <TopNavbar />
      </div>

      <div class="header-actions mobile-only">
        <div class="user-avatar">
          <span class="material-icons">person</span>
        </div>
      </div>
    </header>

    <!-- Main Content Area -->
    <main class="main-content">
      <div class="container fade-in">
        <slot />
      </div>
    </main>
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background-color: var(--color-primary);
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-md);
  border-bottom: 2px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 900;
}

.mobile-header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.w-full { width: 100%; }

.mobile-only { display: block; }
.desktop-only { display: none; }

@media (min-width: 1024px) {
  .mobile-only { display: none !important; }
  .desktop-only { display: block !important; }
  
  .app-header {
    padding-left: var(--space-md);
  }
  
  .main-content {
    padding-left: 0;
  }
}

.menu-trigger {
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 8px;
  line-height: 1;
}

.header-logo {
  color: white;
  font-size: 1.25rem;
  font-weight: 800;
  flex: 1;
  text-align: center;
}

.user-avatar {
  width: 36px;
  height: 36px;
  background-color: var(--color-secondary);
  border-radius: 50%;
  border: 2px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.main-content {
  flex: 1;
  background-color: var(--color-bg);
}

.container {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  padding: var(--space-lg) var(--space-md);
}

@media (min-width: 1024px) {
  .container {
    max-width: 1200px;
  }
}
</style>
