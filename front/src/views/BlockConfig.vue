<template>
  <div class="page-container animate-fade">
    <!-- Encabezado de la Página -->
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title">
          <i class="ph ph-shield-check"></i> Configuración & Sincronización BlockWMS
        </h2>
        <p class="page-description">
          Administre la sesión de conexión con el servidor BlockWMS, consulte el inventario externo en JSON y sincronice las cantidades de stock.
        </p>
      </div>
    </div>

    <!-- Pestañas Principales -->
    <div class="tabs-header mb-4" style="display: flex; gap: 0.5rem; border-bottom: 2px solid var(--bevel-light);">
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'config' }" 
        @click="activeTab = 'config'"
      >
        <i class="ph ph-key"></i> Sesión & Credenciales
      </button>
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'productos' }" 
        @click="activeTab = 'productos'; if(!productsList.length) fetchWmsProducts();"
      >
        <i class="ph ph-list-numbers"></i> Productos WMS (JSON)
      </button>
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'sync' }" 
        @click="activeTab = 'sync'"
      >
        <i class="ph ph-arrows-clockwise"></i> Sincronización de Stock
      </button>
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'ajuste' }" 
        @click="activeTab = 'ajuste'; fetchMotivos();"
      >
        <i class="ph ph-plus-minus"></i> Realizar Ajuste en WMS
      </button>
    </div>

    <!-- PESTAÑA 1: CREDENCIALES & SESIÓN EN NAVEGADOR -->
    <div v-if="activeTab === 'config'" class="card">
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
            Ingrese su usuario y contraseña de BlockWMS. Al autenticar, la cookie de inicio de sesión <code>PHPSESSID</code> y el identificador de sitio se guardarán <strong>únicamente en el navegador local</strong> para realizar las operaciones.
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
                <label class="form-label">ID de Entidad Site:</label>
                <input 
                  type="text" 
                  v-model="loginForm.siteId" 
                  class="form-control" 
                  placeholder="194326" 
                  required 
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

    <!-- PESTAÑA 2: PRODUCTOS WMS (SERVICE JSON) -->
    <div v-else-if="activeTab === 'productos'" class="card">
      <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
        <h3 class="card-title">
          <i class="ph ph-list-numbers"></i> Catálogo de Productos Registrados en BlockWMS (JSON)
        </h3>
        <button type="button" class="btn btn-sm btn-secondary" @click="fetchWmsProducts" :disabled="loadingProducts || !wmsSession">
          <i class="ph ph-spinner spinner" v-if="loadingProducts"></i>
          <i class="ph ph-arrows-clockwise" v-else></i> Recargar Productos
        </button>
      </div>
      <div class="card-body">
        <div v-if="!wmsSession" class="alert alert-warning mb-3">
          <i class="ph ph-warning"></i> <strong>Atención:</strong> No hay una sesión activa de BlockWMS. Por favor inicie sesión en la pestaña <strong>"Sesión & Credenciales"</strong>.
        </div>

        <div class="form-group mb-3">
          <input 
            type="text" 
            v-model="searchProduct" 
            class="form-control" 
            placeholder="Buscar por código de producto o nombre..." 
          />
        </div>

        <div v-if="productsError" class="alert alert-danger mb-3">
          <i class="ph ph-x-circle"></i> {{ productsError }}
        </div>

        <div style="overflow-x: auto;">
          <table class="table table-bordered table-striped" style="font-size: 0.9rem;">
            <thead>
              <tr style="background-color: var(--bg-secondary);">
                <th style="width: 15%;">Código</th>
                <th style="width: 45%;">Descripción</th>
                <th style="width: 20%;">Stock Físico WMS</th>
                <th style="width: 20%;">Estado en BBDD</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in filteredProducts" :key="p.codigo || p.codigo_productos || p.ID">
                <td><strong>{{ p.codigo || p.codigo_productos || p.ID }}</strong></td>
                <td>{{ p.nombre || p.producto }}</td>
                <td>
                  <span class="badge badge-info" style="font-size: 0.9rem;">
                    {{ p.stockFisico !== undefined && p.stockFisico !== null ? p.stockFisico : (p.cantidad_fisica || p.stock || 0) }} kg/un
                  </span>
                </td>
                <td>
                  <span class="badge" :class="p.existeEnBd !== false ? 'badge-success' : 'badge-warning'">
                    <i :class="p.existeEnBd !== false ? 'ph ph-check-circle' : 'ph ph-warning'"></i>
                    {{ p.existeEnBd !== false ? 'En BBDD' : 'No en BBDD' }}
                  </span>
                </td>
              </tr>
              <tr v-if="filteredProducts.length === 0 && !loadingProducts">
                <td colspan="4" class="text-center text-muted py-3">No se encontraron productos coincidentes.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- PESTAÑA 3: SINCRONIZACIÓN DE STOCK -->
    <div v-else-if="activeTab === 'sync'" class="card">
      <div class="card-header">
        <h3 class="card-title">
          <i class="ph ph-arrows-clockwise"></i> Sincronización de Stock Local con BlockWMS
        </h3>
      </div>
      <div class="card-body">
        <div v-if="!wmsSession" class="alert alert-warning mb-3">
          <i class="ph ph-warning"></i> <strong>Atención:</strong> No hay una sesión activa de BlockWMS. Por favor inicie sesión en la pestaña <strong>"Sesión & Credenciales"</strong>.
        </div>

        <p class="mb-4 text-muted">
          Esta herramienta consulta las existencias en BlockWMS y actualiza los balances de stock de la aplicación local.
        </p>

        <div v-if="syncMessage" class="alert alert-success mb-3">
          <i class="ph ph-check-circle"></i> {{ syncMessage }}
        </div>
        <div v-if="syncError" class="alert alert-danger mb-3">
          <i class="ph ph-x-circle"></i> {{ syncError }}
        </div>

        <button type="button" class="btn btn-primary" @click="runStockSync" :disabled="loadingSync || !wmsSession">
          <i class="ph ph-spinner spinner" v-if="loadingSync"></i>
          <i class="ph ph-arrows-clockwise" v-else></i> Iniciar Sincronización de Stock
        </button>

        <div v-if="syncDetails" class="mt-4 p-3 bg-light rounded border">
          <h5 class="fw-bold mb-3"><i class="ph ph-receipt"></i> Resumen de Sincronización</h5>
          <ul class="mb-3 text-sm" style="list-style: none; padding-left: 0; display: flex; gap: 1.5rem; flex-wrap: wrap; background: #fff; padding: 0.75rem; border-radius: 6px; border: 1px solid #e2e8f0;">
            <li>📦 <strong>Total WMS:</strong> {{ syncDetails.totalWms || 0 }}</li>
            <li>✅ <strong>Coincidentes:</strong> {{ syncDetails.coincidentes || 0 }}</li>
            <li>🔄 <strong>Actualizados:</strong> {{ syncDetails.actualizados || 0 }}</li>
            <li>➖ <strong>Sin Cambios:</strong> {{ syncDetails.sinCambios || 0 }}</li>
            <li>⚠️ <strong>No en BBDD:</strong> {{ syncDetails.noEncontradosCount || 0 }}</li>
          </ul>

          <!-- Tabla de Productos Sincronizados -->
          <div style="overflow-x: auto;" class="mt-3">
            <table class="table table-bordered table-striped mb-0" style="font-size: 0.88rem; background-color: white;">
              <thead>
                <tr style="background-color: var(--bg-secondary);">
                  <th style="width: 15%;">Código</th>
                  <th style="width: 45%;">Descripción</th>
                  <th style="width: 15%;">Stock Anterior</th>
                  <th style="width: 15%;">Stock WMS</th>
                  <th style="width: 10%;">Estado</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in (syncDetails.todos || syncDetails.detalles || [])" :key="item.codigo">
                  <td><strong>{{ item.codigo }}</strong></td>
                  <td>{{ item.nombre }}</td>
                  <td>{{ item.stockAnterior !== undefined ? item.stockAnterior : '-' }}</td>
                  <td><strong>{{ item.stockWms !== undefined ? item.stockWms : (item.stockNuevo || item.cantidad_fisica || 0) }}</strong> kg/un</td>
                  <td>
                    <span 
                      class="badge" 
                      :class="item.estado === 'ACTUALIZADO' ? 'badge-primary' : (item.estado === 'NO_ENCONTRADO' ? 'badge-warning' : 'badge-secondary')"
                    >
                      {{ item.estado === 'ACTUALIZADO' ? '🔄 Actualizado' : (item.estado === 'NO_ENCONTRADO' ? '⚠️ No en BD' : '➖ Sin Cambios') }}
                    </span>
                  </td>
                </tr>
                <tr v-if="!syncDetails.todos || syncDetails.todos.length === 0">
                  <td colspan="5" class="text-center text-muted py-3">No hay renglones registrados en esta sincronización.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- PESTAÑA 4: REALIZAR AJUSTE EN WMS -->
    <div v-else-if="activeTab === 'ajuste'" class="card">
      <div class="card-header">
        <h3 class="card-title">
          <i class="ph ph-plus-minus"></i> Ajuste Directo de Stock en BlockWMS
        </h3>
      </div>
      <div class="card-body">
        <div v-if="!wmsSession" class="alert alert-warning mb-3">
          <i class="ph ph-warning"></i> <strong>Atención:</strong> No hay una sesión activa de BlockWMS. Por favor inicie sesión en la pestaña <strong>"Sesión & Credenciales"</strong>.
        </div>

        <form @submit.prevent="sendAjuste">
          <div class="form-grid mb-3">
            <div class="form-group">
              <label class="form-label">Código de Producto:</label>
              <input 
                type="text" 
                v-model="ajusteForm.codigoProducto" 
                class="form-control" 
                placeholder="Código exacto en WMS" 
                required 
              />
            </div>
            <div class="form-group">
              <label class="form-label">Operación:</label>
              <select v-model="ajusteForm.operador" class="form-control" required>
                <option value="+">➕ Incremento de Stock (+)</option>
                <option value="-">➖ Decremento de Stock (-)</option>
              </select>
            </div>
          </div>

          <div class="form-grid mb-3">
            <div class="form-group">
              <label class="form-label">Cantidad (kg/unidades):</label>
              <input 
                type="number" 
                step="0.001" 
                v-model.number="ajusteForm.cantidad" 
                class="form-control" 
                placeholder="Ej: 10.500" 
                required 
              />
            </div>
            <div class="form-group">
              <label class="form-label">Motivo del Ajuste:</label>
              <select v-model="ajusteForm.idMotivo" class="form-control" required>
                <option value="" disabled>Seleccione un motivo</option>
                <option v-for="m in motivosList" :key="m.id" :value="m.id">
                  {{ m.nombre }} (ID: {{ m.id }})
                </option>
              </select>
            </div>
          </div>

          <div class="form-grid mb-3">
            <div class="form-group">
              <label class="form-label">Layout / Ubicación:</label>
              <input 
                type="text" 
                v-model="ajusteForm.ubicacion" 
                class="form-control" 
                placeholder="26-ST-00-00-00-00" 
              />
            </div>
            <div class="form-group">
              <label class="form-label">Lote:</label>
              <input 
                type="text" 
                v-model="ajusteForm.lote" 
                class="form-control" 
                placeholder="0" 
              />
            </div>
          </div>

          <div class="form-group mb-4">
            <label class="form-label">Observaciones:</label>
            <input 
              type="text" 
              v-model="ajusteForm.observaciones" 
              class="form-control" 
              placeholder="Ej: Ajuste manual desde App CDF" 
            />
          </div>

          <button type="submit" class="btn btn-primary" :disabled="loadingAjuste || !wmsSession">
            <i class="ph ph-spinner spinner" v-if="loadingAjuste"></i>
            <i class="ph ph-paper-plane-tilt" v-else></i> Procesar Ajuste en BlockWMS
          </button>
        </form>

        <div v-if="ajusteError" class="alert alert-danger mt-3">
          <i class="ph ph-x-circle"></i> {{ ajusteError }}
        </div>
        <div v-if="ajusteResult" class="alert alert-success mt-3">
          <i class="ph ph-check-circle"></i> {{ ajusteResult.message }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const activeTab = ref('config')

// Sesión guardada en navegador
const wmsSession = ref(null)
const loadingLogin = ref(false)
const loginMessage = ref('')
const loginOk = ref(false)
const showPassword = ref(false)

const loginForm = ref({
  host: 'http://192.168.10.2',
  siteId: '194326',
  usuario: '',
  password: ''
})

const getWmsHeaders = () => {
  if (!wmsSession.value || !wmsSession.value.sessionId) return {}
  return {
    'X-WMS-Session-Id': wmsSession.value.sessionId || '',
    'X-WMS-Site-Id': wmsSession.value.siteId || '194326',
    'X-WMS-Host': wmsSession.value.host || 'http://192.168.10.2'
  }
}

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
      loginMessage.value = `¡Sesión iniciada exitosamente! Logueado como ${data.usuario}`
      loginForm.value.password = ''
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

const logoutWmsSession = () => {
  localStorage.removeItem('wms_session')
  wmsSession.value = null
  loginOk.value = false
  loginMessage.value = 'Sesión cerrada exitosamente. Los datos de sesión fueron eliminados del navegador.'
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

// Productos WMS
const loadingProducts = ref(false)
const productsError = ref('')
const productsList = ref([])
const searchProduct = ref('')

const fetchWmsProducts = async () => {
  if (!wmsSession.value) return
  loadingProducts.value = true
  productsError.value = ''
  try {
    const res = await fetch('/api/wms/productos', {
      headers: getWmsHeaders()
    })
    const data = await res.json()
    if (res.ok && data.ok) {
      productsList.value = data.productos || []
    } else {
      throw new Error(data.error || 'Error al obtener productos de BlockWMS.')
    }
  } catch (err) {
    productsError.value = err.message
  } finally {
    loadingProducts.value = false
  }
}

const filteredProducts = computed(() => {
  if (!searchProduct.value.trim()) return productsList.value
  const q = searchProduct.value.toLowerCase()
  return productsList.value.filter(p => 
    (p.codigo && p.codigo.toLowerCase().includes(q)) || 
    (p.nombre && p.nombre.toLowerCase().includes(q))
  )
})

// Sync Stock
const loadingSync = ref(false)
const syncMessage = ref('')
const syncError = ref('')
const syncDetails = ref(null)

const runStockSync = async () => {
  if (!wmsSession.value) return
  loadingSync.value = true
  syncMessage.value = ''
  syncError.value = ''
  syncDetails.value = null

  try {
    const res = await fetch('/api/wms/sync-stock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getWmsHeaders() }
    })
    const data = await res.json()
    if (data.wmsSession && data.wmsSession.sessionId) {
      localStorage.setItem('wms_session', JSON.stringify(data.wmsSession))
      wmsSession.value = data.wmsSession
    }
    if (res.ok && data.ok) {
      syncMessage.value = data.message || data.mensaje || 'Sincronización completada exitosamente.'
      syncDetails.value = data.report || data.detalles || data
    } else {
      throw new Error(data.error || 'Error en la sincronización.')
    }
  } catch (err) {
    syncError.value = err.message
  } finally {
    loadingSync.value = false
  }
}

// Realizar Ajuste
const loadingAjuste = ref(false)
const ajusteError = ref('')
const ajusteResult = ref(null)
const motivosList = ref([])
const ajusteForm = ref({
  codigoProducto: '',
  operador: '+',
  cantidad: null,
  idMotivo: '27',
  ubicacion: '26-ST-00-00-00-00',
  lote: '0',
  observaciones: 'Ajuste manual desde App CDF'
})

const fetchMotivos = async () => {
  if (motivosList.value.length > 0) return
  try {
    const res = await fetch('/api/wms/motivos')
    const data = await res.json()
    if (data.ok && data.motivos) {
      motivosList.value = data.motivos
    }
  } catch (err) {
    console.error('Error al cargar motivos WMS:', err)
  }
}

const sendAjuste = async () => {
  if (!wmsSession.value) return
  loadingAjuste.value = true
  ajusteError.value = ''
  ajusteResult.value = null

  try {
    const res = await fetch('/api/wms/ajuste', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getWmsHeaders() },
      body: JSON.stringify(ajusteForm.value)
    })
    const data = await res.json()
    if (res.ok && data.ok) {
      ajusteResult.value = data
      ajusteForm.value.cantidad = null
    } else {
      throw new Error(data.error || 'Error al procesar ajuste.')
    }
  } catch (err) {
    ajusteError.value = err.message
  } finally {
    loadingAjuste.value = false
  }
}

onMounted(() => {
  checkLocalSession()
  fetchMotivos()
})
</script>

<style scoped>
.tab-btn {
  background: transparent;
  border: none;
  padding: 0.75rem 1.25rem;
  font-weight: 600;
  color: var(--text-secondary);
  cursor: pointer;
  border-bottom: 3px solid transparent;
  transition: all 0.2s ease;
}

.tab-btn:hover {
  color: var(--primary);
}

.tab-btn.active {
  color: var(--primary);
  border-bottom-color: var(--primary);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
}
</style>
