<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

defineProps({
  isOpen: Boolean
})
const emit = defineEmits(['close'])

const router = useRouter()
const authStore = useAuthStore()
const isProductosOpen = ref(false)

const handleLogout = () => {
  authStore.logout()
  emit('close')
  router.push('/login')
}

const toggleProductos = () => {
  isProductosOpen.value = !isProductosOpen.value
}
</script>

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
          
          <!-- Menu Productos con Submenu -->
          <div class="menu-group">
            <button 
              class="nav-item group-toggle" 
              :class="{ 'is-active': isProductosOpen }"
              @click="toggleProductos"
            >
              <span class="icon">🍎</span> Productos
              <span class="arrow" :class="{ 'is-rotated': isProductosOpen }">▼</span>
            </button>
            
            <Transition name="expand">
              <div v-if="isProductosOpen" class="submenu">
                <RouterLink to="/productos/nuevo" class="submenu-item" @click="$emit('close')">
                  <span class="dot">•</span> Alta de producto
                </RouterLink>
                <RouterLink to="/productos" class="submenu-item" @click="$emit('close')">
                  <span class="dot">•</span> Ver Productos
                </RouterLink>
                <RouterLink to="/productos/editar" class="submenu-item" @click="$emit('close')">
                  <span class="dot">•</span> Modificar Producto
                </RouterLink>
              </div>
            </Transition>
          </div>

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

/* Submenu Styles */
.menu-group {
  display: flex;
  flex-direction: column;
}

.group-toggle {
  width: 100%;
  background: none;
  cursor: pointer;
  border: 2px solid transparent;
  justify-content: space-between;
}

.group-toggle.is-active {
  background-color: #F8F8F8;
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}

.arrow {
  font-size: 0.7rem;
  transition: transform 0.3s ease;
  opacity: 0.5;
}

.arrow.is-rotated {
  transform: rotate(180deg);
}

.submenu {
  display: flex;
  flex-direction: column;
  background-color: #FAFAFA;
  border-bottom-left-radius: var(--radius-md);
  border-bottom-right-radius: var(--radius-md);
  padding: 4px;
  border: 2px solid #F0F0F0;
  border-top: none;
}

.submenu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 18px;
  padding-left: 24px;
  border-radius: var(--radius-sm);
  text-decoration: none;
  color: var(--color-text-muted);
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.2s ease;
}

.submenu-item:hover {
  background-color: #F0F0F0;
  color: var(--color-primary);
}

.submenu-item.router-link-active {
  color: var(--color-primary);
  background-color: white;
}

.dot {
  font-size: 1.2rem;
  line-height: 1;
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

/* Expand Transition */
.expand-enter-active, .expand-leave-active {
  transition: all 0.3s ease-out;
  max-height: 200px;
  overflow: hidden;
}
.expand-enter-from, .expand-leave-to {
  max-height: 0;
  opacity: 0;
  transform: translateY(-10px);
}
</style>
