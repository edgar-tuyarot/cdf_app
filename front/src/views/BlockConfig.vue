<template>
  <div class="page-container animate-fade">
    <!-- Encabezado de la Página -->
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title">
          <i class="ph ph-shield-check"></i> Conexión a BlockWMS
        </h2>
        <p class="page-description">
          Administre la sesión de conexión y autenticación con el servidor BlockWMS.
        </p>
      </div>
    </div>

    <!-- CREDENCIALES & SESIÓN -->
    <div class="card">
      <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
        <h3 class="card-title">
          <i class="ph ph-key"></i> Autenticación & Estado de Sesión BlockWMS
        </h3>
        <span v-if="wmsSession" class="badge badge-success" style="font-size: 0.85rem; padding: 4px 10px;">
          🟢 Conectado (Sesión Activa)
        </span>
        <span v-else class="badge badge-warning" style="font-size: 0.85rem; padding: 4px 10px;">
          🔴 Sin Sesión Activa
        </span>
      </div>

      <div class="card-body">
        <!-- Mensajes de Alerta -->
        <div v-if="loginMessage" class="alert mb-3" :class="loginOk ? 'alert-success' : 'alert-danger'">
          <i :class="loginOk ? 'ph ph-check-circle' : 'ph ph-x-circle'"></i> {{ loginMessage }}
        </div>

        <!-- VISTA DE SESIÓN ACTIVA (Logueado) -->
        <div v-if="wmsSession" class="p-3 bg-light rounded border mb-3">
          <h5 class="fw-bold mb-3" style="color: var(--text-primary); display: flex; align-items: center; gap: 0.4rem;">
            <i class="ph ph-user-circle-gear text-blue" style="font-size: 1.3rem;"></i>
            Datos de la Sesión Guardada en Navegador
          </h5>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; margin-bottom: 1.25rem;">
            <div style="background: #fff; padding: 0.75rem; border: 1px solid #cbd5e1;">
              <span style="font-size: 0.75rem; color: var(--text-muted); display: block; text-transform: uppercase; font-weight: bold;">Logueado como</span>
              <strong style="font-size: 1rem; color: var(--text-primary);">{{ wmsSession.usuario }}</strong>
            </div>

            <div style="background: #fff; padding: 0.75rem; border: 1px solid #cbd5e1;">
              <span style="font-size: 0.75rem; color: var(--text-muted); display: block; text-transform: uppercase; font-weight: bold;">Servidor Host</span>
              <strong style="font-size: 0.9rem; color: var(--text-primary); font-family: monospace;">{{ wmsSession.host }}</strong>
            </div>

            <div style="background: #fff; padding: 0.75rem; border: 1px solid #cbd5e1;">
              <span style="font-size: 0.75rem; color: var(--text-muted); display: block; text-transform: uppercase; font-weight: bold;">ID de Sitio / Site</span>
              <strong style="font-size: 0.95rem; color: var(--text-primary); font-family: monospace;">{{ wmsSession.siteId }}</strong>
              <div v-if="wmsSession.siteNombre" style="font-size: 0.75rem; color: #16a34a; font-weight: bold; margin-top: 2px;">
                {{ wmsSession.siteNombre }}
              </div>
            </div>

            <div style="background: #fff; padding: 0.75rem; border: 1px solid #cbd5e1;">
              <span style="font-size: 0.75rem; color: var(--text-muted); display: block; text-transform: uppercase; font-weight: bold;">Cookie PHPSESSID</span>
              <strong style="font-size: 0.82rem; color: #2563eb; font-family: monospace; word-break: break-all;">{{ wmsSession.sessionId }}</strong>
            </div>
          </div>

          <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
            <button type="button" class="btn btn-secondary" @click="testSession" :disabled="loadingLogin">
              <i class="ph ph-spinner spinner" v-if="loadingLogin"></i>
              <i class="ph ph-shield-check" v-else></i> Verificar Conexión
            </button>
            <button type="button" class="btn btn-danger" style="background: #c9241b; color: white; border: none;" @click="logoutWmsSession">
              <i class="ph ph-sign-out"></i> Cerrar Sesión BlockWMS
            </button>
          </div>
        </div>

        <!-- FORMULARIO DE LOGIN (Deslogueado) -->
        <div v-else>
          <p class="text-muted mb-4">
            Ingrese su usuario y contraseña de BlockWMS. El sistema <strong>detectará automáticamente el sitio o sucursal</strong> asignado a su cuenta en BlockWMS.
          </p>

          <form @submit.prevent="handleWmsLogin">
            <div class="form-grid mb-3">
              <div class="form-group">
                <label class="form-label">Servidor / Host BlockWMS:</label>
                <input 
                  type="text" 
                  v-model="loginForm.host" 
                  class="form-control" 
                  placeholder="http://192.168.10.2" 
                  required 
                />
              </div>
              <div class="form-group">
                <label class="form-label" style="display: flex; justify-content: space-between; align-items: baseline;">
                  <span>ID de Entidad Site:</span>
                  <small style="color: var(--text-muted); font-size: 0.75rem; font-weight: normal;">(Opcional - Se autodetecta)</small>
                </label>
                <input 
                  type="text" 
                  v-model="loginForm.siteId" 
                  class="form-control" 
                  placeholder="Automático según usuario (o ej: 194326)" 
                />
              </div>
            </div>

            <div class="form-grid mb-4">
              <div class="form-group">
                <label class="form-label">Usuario WMS *:</label>
                <input 
                  type="text" 
                  v-model="loginForm.usuario" 
                  class="form-control" 
                  placeholder="Ingrese su usuario de BlockWMS" 
                  required 
                />
              </div>
              <div class="form-group">
                <label class="form-label">Contraseña WMS *:</label>
                <input 
                  :type="showPassword ? 'text' : 'password'" 
                  v-model="loginForm.password" 
                  class="form-control" 
                  placeholder="••••••••" 
                  required
                />
              </div>
            </div>

            <div style="display: flex; gap: 0.75rem; align-items: center;" class="mt-4">
              <button type="submit" class="btn btn-primary" :disabled="loadingLogin">
                <i class="ph ph-spinner spinner" v-if="loadingLogin"></i>
                <i class="ph ph-sign-in" v-else></i> Iniciar Sesión en BlockWMS
              </button>
              <label style="display: flex; align-items: center; gap: 0.35rem; font-size: 0.85rem; cursor: pointer; user-select: none;">
                <input type="checkbox" v-model="showPassword" /> Mostrar contraseña
              </label>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getWmsHeaders } from '../utils/wmsHeaders'

// Sesión guardada en navegador
const wmsSession = ref(null)
const loadingLogin = ref(false)
const loginMessage = ref('')
const loginOk = ref(false)
const showPassword = ref(false)

const loginForm = ref({
  host: 'http://192.168.10.2',
  siteId: '',
  usuario: '',
  password: ''
})

const checkLocalSession = () => {
  const saved = localStorage.getItem('wms_session')
  if (saved) {
    try {
      wmsSession.value = JSON.parse(saved)
    } catch (e) {
      wmsSession.value = null
    }
  } else {
    wmsSession.value = null
  }
}

const handleWmsLogin = async () => {
  if (!loginForm.value.usuario || !loginForm.value.password) {
    loginOk.value = false
    loginMessage.value = 'Debe ingresar su usuario y contraseña de BlockWMS.'
    return
  }

  loadingLogin.value = true
  loginMessage.value = ''
  loginOk.value = false

  try {
    const res = await fetch('/api/wms/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginForm.value)
    })

    const data = await res.json()

    if (res.ok && data.ok) {
      wmsSession.value = data
      localStorage.setItem('wms_session', JSON.stringify(data))
      loginOk.value = true
      const siteDetalle = data.siteNombre ? `${data.siteId} (${data.siteNombre})` : (data.siteId || 'Sin sitio')
      loginMessage.value = `¡Sesión iniciada exitosamente! Logueado como ${data.usuario} en Sitio ${siteDetalle}`
      loginForm.value.password = ''
      loginForm.value.siteId = data.siteId || ''
    } else {
      throw new Error(data.error || 'Error al autenticar contra BlockWMS.')
    }
  } catch (err) {
    loginOk.value = false
    loginMessage.value = err.message
  } finally {
    loadingLogin.value = false
  }
}

const logoutWmsSession = async () => {
  loadingLogin.value = true
  try {
    await fetch('/api/wms/logout', { method: 'POST' })
  } catch (e) {
    console.warn('Error al llamar /api/wms/logout:', e)
  } finally {
    loadingLogin.value = false
  }
  localStorage.removeItem('wms_session')
  wmsSession.value = null
  loginOk.value = false
  loginMessage.value = 'Sesión cerrada exitosamente tanto en el navegador como en el servidor.'
}

const testSession = async () => {
  loadingLogin.value = true
  loginMessage.value = ''
  loginOk.value = false

  try {
    const res = await fetch('/api/wms/productos', {
      headers: getWmsHeaders()
    })
    const data = await res.json()

    if (res.ok && data.ok) {
      loginOk.value = true
      loginMessage.value = `Conexión verificada exitosamente con BlockWMS (${data.totalItems || data.productos?.length || 0} productos obtenidos).`
    } else {
      throw new Error(data.error || 'La sesión no responde o expiró en BlockWMS.')
    }
  } catch (err) {
    loginOk.value = false
    loginMessage.value = 'Error en verificación: ' + err.message
  } finally {
    loadingLogin.value = false
  }
}

onMounted(() => {
  checkLocalSession()
})
</script>

<style scoped>
.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
}
</style>
