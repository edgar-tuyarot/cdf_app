<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const usuario = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')

const loginMode = ref('select') // 'select', 'personal', 'sucursal'
const sucursales = ref([])
const selectedSucursalId = ref('')
const loadingSucursales = ref(false)

const switchToSucursalMode = async () => {
  loginMode.value = 'sucursal'
  errorMsg.value = ''
  selectedSucursalId.value = ''
  if (sucursales.value.length === 0) {
    loadingSucursales.value = true
    try {
      const res = await fetch('/api/sucursales')
      if (res.ok) {
        sucursales.value = await res.json()
      } else {
        errorMsg.value = 'Error al cargar sucursales'
      }
    } catch (e) {
      console.error(e)
      errorMsg.value = 'Error de conexión'
    } finally {
      loadingSucursales.value = false
    }
  }
}

const switchToPersonalMode = () => {
  loginMode.value = 'personal'
  errorMsg.value = ''
  usuario.value = ''
  password.value = ''
}

const handleLogin = async () => {
  if (!usuario.value || !password.value) return
  
  loading.value = true
  errorMsg.value = ''
  
  const result = await authStore.login(usuario.value, password.value)
  
  if (result.success) {
    router.push('/')
  } else {
    errorMsg.value = result.error
  }
  
  loading.value = false
}

const handleSucursalLogin = async () => {
  if (!selectedSucursalId.value) return
  const s = sucursales.value.find(x => x.id === selectedSucursalId.value)
  if (!s) return

  loading.value = true
  const result = await authStore.loginComoSucursal(s)
  if (result.success) {
    router.push('/')
  } else {
    errorMsg.value = 'Error al iniciar sesión como sucursal'
  }
  loading.value = false
}

const handleFormSubmit = () => {
  if (loginMode.value === 'sucursal') {
    handleSucursalLogin()
  } else if (loginMode.value === 'personal') {
    handleLogin()
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-container animate-fade">
      
      <!-- Logo y título principal -->
      <header class="login-header">
        <h1 class="logo">CDF</h1>
      </header>

      <!-- Tarjeta de Login -->
      <div class="card">
        <div class="card-header" style="justify-content: center; background-color: var(--bg-tertiary); color: white; border-bottom: 2px solid var(--bevel-dark);">
          <span class="card-title" style="color: white; font-weight: bold; font-size: 0.9rem;">
            <span v-if="loginMode === 'select'">Acceso al Sistema</span>
            <span v-else-if="loginMode === 'personal'">Acceso de Personal</span>
            <span v-else-if="loginMode === 'sucursal'">Acceso de Sucursales</span>
          </span>
        </div>

        <div class="card-body" style="padding: 1.5rem; background: var(--bg-secondary);">
          <form @submit.prevent="handleFormSubmit" class="login-form">

            <!-- Modo de Selección Inicial -->
            <template v-if="loginMode === 'select'">
              <div style="display: flex; flex-direction: column; align-items: center; text-align: center; gap: 1rem;">
                <p style="font-size: 0.85rem; color: var(--text-muted); font-weight: bold; margin-bottom: 0.25rem;">
                  Selecciona tu perfil de acceso:
                </p>
                
                <div style="display: flex; justify-content: center; gap: 1.25rem; width: 100%;">
                  <!-- Botón Personal -->
                  <button 
                    type="button" 
                    class="btn btn-primary profile-btn" 
                    style="width: 125px; height: 125px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.75rem; border-radius: 12px;"
                    @click="switchToPersonalMode"
                  >
                    <i class="ph ph-user" style="font-size: 2.2rem;"></i>
                    <span style="font-size: 0.85rem; font-weight: bold; line-height: 1.1;">Acceso Personal</span>
                  </button>
                  
                  <!-- Botón Sucursal -->
                  <button 
                    type="button" 
                    class="btn btn-secondary profile-btn" 
                    style="width: 125px; height: 125px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.75rem; border-radius: 12px; border: 2px solid var(--bevel-dark);" 
                    @click="switchToSucursalMode"
                  >
                    <i class="ph ph-storefront" style="font-size: 2.2rem; color: var(--accent-primary);"></i>
                    <span style="font-size: 0.85rem; font-weight: bold; line-height: 1.1;">Acceso Sucursales</span>
                  </button>
                </div>
              </div>
            </template>

            <!-- Modo Personal (Usuario / Contraseña) -->
            <template v-if="loginMode === 'personal'">
              <div class="form-group" style="margin-bottom: 1rem; display: flex; flex-direction: column; gap: 0.3rem;">
                <label class="form-label" style="font-weight: bold; font-size: 0.8rem; color: var(--text-primary);">Usuario</label>
                <input
                  type="text"
                  class="form-control"
                  v-model="usuario"
                  placeholder="Nombre de usuario"
                  autocomplete="username"
                  required
                  style="width: 100%; height: 36px; padding: 0.5rem; border: 1.5px solid var(--bevel-dark); border-radius: var(--border-radius-md); font-size: 0.85rem;"
                >
              </div>

              <div class="form-group" style="margin-bottom: 1rem; display: flex; flex-direction: column; gap: 0.3rem;">
                <label class="form-label" style="font-weight: bold; font-size: 0.8rem; color: var(--text-primary);">Contraseña</label>
                <input
                  type="password"
                  class="form-control"
                  v-model="password"
                  placeholder="••••••••"
                  autocomplete="current-password"
                  required
                  style="width: 100%; height: 36px; padding: 0.5rem; border: 1.5px solid var(--bevel-dark); border-radius: var(--border-radius-md); font-size: 0.85rem;"
                >
              </div>

              <div v-if="errorMsg" class="error-box animate-shake" style="margin-bottom: 1rem;">
                {{ errorMsg }}
              </div>

              <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-top: 1.25rem;">
                <button type="submit" class="btn btn-primary" style="height: 38px; font-weight: bold; width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.4rem;" :disabled="loading">
                  <span v-if="!loading">Iniciar Sesión</span>
                  <span v-else><i class="ph ph-spinner spinner"></i> Conectando...</span>
                </button>
                <button type="button" class="btn btn-secondary" style="height: 36px; width: 100%; font-weight: bold;" @click="loginMode = 'select'" :disabled="loading">
                  Volver
                </button>
              </div>
            </template>

            <!-- Modo Sucursal (Selección de Sucursal) -->
            <template v-if="loginMode === 'sucursal'">
              <div class="form-group" style="margin-bottom: 1rem; display: flex; flex-direction: column; gap: 0.3rem;">
                <label class="form-label" style="font-weight: bold; font-size: 0.8rem; color: var(--text-primary);">Seleccione la Sucursal</label>
                <select
                  class="form-control"
                  v-model="selectedSucursalId"
                  required
                  style="width: 100%; height: 36px; padding: 0 0.5rem; border: 1.5px solid var(--bevel-dark); border-radius: var(--border-radius-md); font-size: 0.85rem; cursor: pointer;"
                >
                  <option value="" disabled>Seleccione su sucursal...</option>
                  <option v-for="s in sucursales" :key="s.id" :value="s.id">
                    {{ s.sucursal }} {{ s.numero ? '#' + s.numero : '' }}
                  </option>
                </select>
              </div>

              <div v-if="errorMsg" class="error-box animate-shake" style="margin-bottom: 1rem;">
                {{ errorMsg }}
              </div>

              <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-top: 1.25rem;">
                <button type="submit" class="btn btn-primary" style="height: 38px; font-weight: bold; width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.4rem;" :disabled="loading || loadingSucursales">
                  <span v-if="!loading && !loadingSucursales">Ingresar como Sucursal</span>
                  <span v-else><i class="ph ph-spinner spinner"></i> Conectando...</span>
                </button>
                <button type="button" class="btn btn-secondary" style="height: 36px; width: 100%; font-weight: bold;" @click="loginMode = 'select'" :disabled="loading">
                  Volver
                </button>
              </div>
            </template>
          </form>
        </div>
      </div>

      <footer class="login-footer">
        <p>&copy; 2026 Planta de Producción CDF — Sistema de Gestión v1.0</p>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  width: 100vw;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-primary);
  padding: 1.5rem;
  font-family: 'Inter', sans-serif;
}

.login-container {
  width: 100%;
  max-width: 400px;
}

.login-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.login-header .logo {
  color: var(--accent-primary);
  font-size: 3.5rem;
  font-weight: 850;
  letter-spacing: -2px;
  margin: 0;
  line-height: 1;
}

.subtitle {
  color: var(--text-muted);
  font-size: 0.85rem;
  font-weight: 600;
  margin-top: 0.25rem;
}

.error-box {
  background-color: #fee2e2;
  color: var(--accent-danger);
  padding: 10px;
  border-radius: 6px;
  border: 1.5px solid var(--accent-danger);
  font-size: 0.8rem;
  font-weight: 600;
  text-align: center;
}

.login-footer {
  text-align: center;
  margin-top: 1.5rem;
  color: var(--text-muted);
  font-size: 0.75rem;
  font-weight: 500;
}

/* Animaciones */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

.animate-shake {
  animation: shake 0.2s ease-in-out 0s 2;
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.profile-btn {
  transition: transform 0.2s, box-shadow 0.2s, background-color 0.2s;
}
.profile-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.15);
}
</style>
