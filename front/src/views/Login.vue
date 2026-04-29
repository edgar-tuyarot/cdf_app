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
</script>

<template>
  <div class="login-wrapper">

    <!-- Ventana de Login estilo Windows clásico -->
    <div class="login-window animate-fade">

      <!-- Barra de título -->
      <div class="window-titlebar">
        <div class="titlebar-left">
          <i class="ph ph-fill ph-cheese titlebar-icon"></i>
          <span>CRM Delicatessen - Acceso al Sistema</span>
        </div>
        <div class="titlebar-controls">
          <span class="ctrl-btn">_</span>
          <span class="ctrl-btn">□</span>
          <span class="ctrl-btn ctrl-close">✕</span>
        </div>
      </div>

      <!-- Cuerpo de la ventana -->
      <div class="window-body">

        <!-- Logo y título -->
        <div class="login-header">
          <div class="logo-area">
            <i class="ph ph-fill ph-cheese logo-icon"></i>
            <div class="logo-text">
              <strong>GESTIÓN DE PRODUCCIÓN</strong>
              <span>Planta de Producción — CDF</span>
            </div>
          </div>
          <hr class="divider">
        </div>

        <!-- Formulario -->
        <form @submit.prevent="handleLogin" class="login-form">

          <div class="form-row-login">
            <label class="login-label" for="login-usuario">Usuario:</label>
            <input
              id="login-usuario"
              type="text"
              class="form-control login-input"
              v-model="usuario"
              placeholder=""
              autocomplete="username"
              required
            >
          </div>

          <div class="form-row-login">
            <label class="login-label" for="login-password">Contraseña:</label>
            <input
              id="login-password"
              type="password"
              class="form-control login-input"
              v-model="password"
              placeholder=""
              autocomplete="current-password"
              required
            >
          </div>

          <div v-if="errorMsg" class="error-box">
            ⚠ {{ errorMsg }}
          </div>

          <div class="btn-row">
            <button type="submit" class="btn btn-primary login-btn" :disabled="loading">
              <span v-if="!loading">Iniciar Sesión</span>
              <span v-else>Conectando...</span>
            </button>
            <button type="button" class="btn btn-secondary login-btn" @click="usuario = ''; password = ''" :disabled="loading">
              Cancelar
            </button>
          </div>
        </form>
      </div>

      <!-- Barra de estado -->
      <div class="status-bar">
        <span>© 2026 Planta de Producción</span>
        <span>v1.0</span>
      </div>
    </div>

  </div>
</template>

<style scoped>
/* Fondo gris del sistema */
.login-wrapper {
  height: 100vh;
  width: 100vw;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-primary);
  font-family: 'Noto Sans', 'Segoe UI', Tahoma, sans-serif;
}

/* Ventana estilo Windows clásico */
.login-window {
  width: 100%;
  max-width: 400px;
  background: var(--bg-secondary);
  border: none;
  box-shadow: var(--raised-shadow), 4px 4px 16px rgba(0,0,0,0.35);
  display: flex;
  flex-direction: column;
  margin: 1rem;
}

/* Barra de título */
.window-titlebar {
  height: 28px;
  background: linear-gradient(to right, #0b5394, #1e6ec8);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0.4rem 0 0.6rem;
  color: white;
  font-size: 0.78rem;
  font-weight: 700;
  user-select: none;
  flex-shrink: 0;
}

.titlebar-left {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.titlebar-icon {
  font-size: 0.9rem;
  color: #fffacd;
}

.titlebar-controls {
  display: flex;
  gap: 2px;
}

.ctrl-btn {
  width: 18px;
  height: 16px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 0.65rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--raised-shadow);
  cursor: default;
  font-weight: 700;
  line-height: 1;
}

.ctrl-close {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

/* Cuerpo */
.window-body {
  padding: 1.25rem 1.5rem 1rem;
}

/* Encabezado con logo */
.login-header {
  margin-bottom: 1rem;
}

.logo-area {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.logo-icon {
  font-size: 2.5rem;
  color: var(--accent-primary);
}

.logo-text {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.logo-text strong {
  font-size: 0.85rem;
  color: var(--text-primary);
  letter-spacing: 0.04em;
}

.logo-text span {
  font-size: 0.72rem;
  color: var(--text-muted);
}

.divider {
  border: none;
  border-top: 1px solid var(--bevel-dark);
  border-bottom: 1px solid var(--bevel-light);
}

/* Formulario */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.form-row-login {
  display: grid;
  grid-template-columns: 90px 1fr;
  align-items: center;
  gap: 0.5rem;
}

.login-label {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-primary);
  text-align: right;
}

.login-input {
  height: 32px;
  font-size: 0.9rem;
}

/* Error */
.error-box {
  grid-column: 1 / -1;
  background: #f8d7da;
  color: var(--accent-danger);
  border: 1px solid var(--accent-danger);
  border-left: 3px solid var(--accent-danger);
  padding: 0.4rem 0.6rem;
  font-size: 0.8rem;
  font-weight: 600;
  margin-top: 0.25rem;
}

/* Botones */
.btn-row {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--bg-tertiary);
}

.login-btn {
  min-width: 120px;
  height: 32px;
  font-size: 0.82rem;
}

/* Barra de estado */
.status-bar {
  height: 22px;
  background: var(--bg-primary);
  border-top: 1px solid var(--bevel-dark);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0.5rem;
  font-size: 0.68rem;
  color: var(--text-muted);
  box-shadow: inset 0 1px 0 var(--bevel-light);
}

/* Spinner */
.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
