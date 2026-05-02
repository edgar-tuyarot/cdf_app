<template>
  <div>
    <!-- Backdrop -->
    <Transition name="fade">
      <div v-if="isOpen" class="sidebar-backdrop" @click="$emit('close')"></div>
    </Transition>

    <!-- Sidebar -->
    <Transition name="slide">
      <aside v-if="isOpen" class="sidebar">
        <div class="sidebar-header">
          <div class="logo">CDF APP</div>
          <button class="close-btn" @click="$emit('close')">×</button>
        </div>

        <nav class="sidebar-nav">
          <RouterLink to="/" class="nav-item" @click="$emit('close')">
            <span class="icon">🏠</span> Dashboard
          </RouterLink>
          <RouterLink to="/envasado" class="nav-item" @click="$emit('close')">
            <span class="icon">📦</span> Envasado
          </RouterLink>
          <RouterLink to="/inventario" class="nav-item" @click="$emit('close')">
            <span class="icon">📋</span> Inventario
          </RouterLink>
          <div class="nav-spacer"></div>
          <button class="nav-item logout-btn" @click="handleLogout">
            <span class="icon">🚪</span> Salir
          </button>
        </nav>
      </aside>
    </Transition>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

defineProps({
  isOpen: Boolean
})
const emit = defineEmits(['close'])

const router = useRouter()
const authStore = useAuthStore()

const handleLogout = () => {
  authStore.logout()
  emit('close')
  router.push('/login')
}
</script>

<style scoped>
.sidebar-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
  z-index: 1000;
}

.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: 280px;
  height: 100vh;
  background-color: var(--color-surface);
  border-right: 2px solid var(--color-border);
  z-index: 1001;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: var(--space-lg);
  background-color: var(--color-primary);
  border-bottom: 2px solid var(--color-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sidebar-header .logo {
  color: white;
  font-size: 1.5rem;
  font-weight: 800;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 2rem;
  cursor: pointer;
  line-height: 1;
}

.sidebar-nav {
  padding: var(--space-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  flex: 1;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  border-radius: var(--radius-md);
  text-decoration: none;
  color: var(--color-text);
  font-weight: 600;
  border: 2px solid transparent;
  transition: all 0.2s ease;
}

.nav-item:hover {
  background-color: #F0F0F0;
}

.nav-item.router-link-active {
  background-color: var(--color-primary);
  color: white;
  border-color: var(--color-border);
}

.logout-btn {
  width: 100%;
  background: none;
  cursor: pointer;
  border: 2px solid transparent;
  text-align: left;
}

.logout-btn:hover {
  background-color: #FFF0F0;
  color: #D32F2F;
}

.nav-spacer {
  flex: 1;
}

.icon {
  font-size: 1.2rem;
}

/* Transitions */
.slide-enter-active, .slide-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-enter-from, .slide-leave-to {
  transform: translateX(-100%);
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
