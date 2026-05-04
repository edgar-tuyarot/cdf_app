<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <nav class="desktop-nav">
    <div class="nav-links">
      <!-- Vista para Colaboradores -->
      <RouterLink v-if="authStore.isColaborador" to="/produccion" class="nav-link">
        <span class="material-icons">precision_manufacturing</span> Producción
      </RouterLink>

      <!-- Vistas para Admin -->
      <template v-if="!authStore.isColaborador">
        <RouterLink to="/" class="nav-link">
          <span class="material-icons">dashboard</span> Dashboard
        </RouterLink>
        
        <!-- Dropdown Pedidos -->
        <div class="dropdown">
          <button class="dropdown-trigger">
            <span class="material-icons">shopping_cart</span> Pedidos <span class="material-icons arrow">expand_more</span>
          </button>
          <div class="dropdown-content">
            <RouterLink to="/pedidos/actuales">Pedidos Actuales</RouterLink>
            <RouterLink to="/pedidos/historial">Historial de Pedidos</RouterLink>
            <RouterLink to="/pedidos/nuevo">Crear Pedido</RouterLink>
          </div>
        </div>
        
        <!-- Dropdown Productos -->
        <div class="dropdown">
          <button class="dropdown-trigger">
            <span class="material-icons">category</span> Productos <span class="material-icons arrow">expand_more</span>
          </button>
          <div class="dropdown-content">
            <RouterLink to="/productos/nuevo">Alta de producto</RouterLink>
            <RouterLink to="/productos">Ver Productos</RouterLink>
            <RouterLink to="/productos/editar">Modificar Producto</RouterLink>
          </div>
        </div>

        <!-- Dropdown Existencias -->
        <div class="dropdown">
          <button class="dropdown-trigger">
            <span class="material-icons">store</span> Existencias <span class="material-icons arrow">expand_more</span>
          </button>
          <div class="dropdown-content">
            <RouterLink to="/existencias/nuevo">Agregar Existencia</RouterLink>
            <RouterLink to="/existencias/ver">Ver Existencias</RouterLink>
          </div>
        </div>

        <RouterLink to="/ubicaciones" class="nav-link">
          <span class="material-icons">place</span> Ubicaciones
        </RouterLink>
        <RouterLink to="/proveedores" class="nav-link">
          <span class="material-icons">local_shipping</span> Proveedores
        </RouterLink>
        <!-- Dropdown Usuarios -->
        <div class="dropdown">
          <button class="dropdown-trigger">
            <span class="material-icons">people</span> Usuarios <span class="material-icons arrow">expand_more</span>
          </button>
          <div class="dropdown-content">
            <RouterLink to="/usuarios">Gestión de Usuarios</RouterLink>
            <RouterLink to="/roles">Gestión de Roles</RouterLink>
          </div>
        </div>
      </template>
    </div>

    <div class="nav-actions">
      <button @click="handleLogout" class="logout-link">
        <span class="material-icons">logout</span> Salir
      </button>
    </div>
  </nav>
</template>

<style scoped>
.desktop-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0 var(--space-md);
}

.nav-links {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.nav-link, .dropdown-trigger, .logout-link {
  display: flex;
  align-items: center;
  gap: 8px;
  color: white;
  text-decoration: none;
  font-weight: 700;
  font-size: 0.9rem;
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  transition: all 0.2s ease;
  background: none;
  border: none;
  cursor: pointer;
}

.material-icons {
  font-size: 1.2rem;
}

.arrow {
  font-size: 1rem;
  opacity: 0.7;
}

.nav-link:hover, .dropdown-trigger:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.nav-link.router-link-active {
  background-color: white;
  color: var(--color-primary);
}

/* Dropdown Logic */
.dropdown {
  position: relative;
  display: inline-block;
}

.dropdown-content {
  display: none;
  position: absolute;
  top: 100%;
  left: 0;
  background-color: white;
  min-width: 200px;
  box-shadow: 0 8px 16px rgba(0,0,0,0.2);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  z-index: 1000;
  overflow: hidden;
}

.dropdown-content a {
  color: var(--color-text);
  padding: 12px 16px;
  text-decoration: none;
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  border-bottom: 1px solid #EEE;
}

.dropdown-content a:last-child {
  border-bottom: none;
}

.dropdown-content a:hover {
  background-color: #F8F8F8;
  color: var(--color-primary);
}

.dropdown:hover .dropdown-content {
  display: block;
}

.logout-link {
  color: white;
  background-color: rgba(0,0,0,0.2);
  border: 1px solid rgba(255,255,255,0.3);
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.logout-link:hover {
  background-color: #D32F2F;
}
</style>
