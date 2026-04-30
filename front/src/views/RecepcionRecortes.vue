<script setup>
import { ref, onMounted, computed } from 'vue'

// --- ESTADO ---
const activeTab = ref('recortes') // 'recortes' | 'decomisos' | 'historial'
const sucursales = ref([])
const productos = ref([])
const historial = ref([])
const isLoading = ref(false)
const isLoadingHistorial = ref(false)
const isSubmitting = ref(false)
const mensaje = ref({ tipo: '', texto: '' })

// Buscador de productos
const productoBuscado = ref('')
const inputProducto = ref(null)

// Formulario actual
const nuevoItem = ref({
  id_sucursal: '',
  id_producto: '',
  peso: ''
})

// Lista temporal antes de enviar al back
const itemsAgregados = ref([])

const mostrarMensaje = (tipo, texto) => {
  mensaje.value = { tipo, texto }
  setTimeout(() => { mensaje.value = { tipo: '', texto: '' } }, 4000)
}

// --- CARGA DE DATOS ---
const cargarDatos = async () => {
  isLoading.value = true
  try {
    const [resSuc, resProd] = await Promise.all([
      fetch('/api/sucursales').catch(() => ({ ok: false })),
      fetch('/api/productos').catch(() => ({ ok: false }))
    ])
    
    if (resSuc.ok) sucursales.value = await resSuc.json()
    if (resProd.ok) productos.value = await resProd.json()
  } catch (error) {
    console.error("Error al cargar datos:", error)
    mostrarMensaje('error', 'Error al conectar con el servidor.')
  } finally {
    isLoading.value = false
  }
}

const cargarHistorial = async () => {
  isLoadingHistorial.value = true
  try {
    const res = await fetch('/api/recortes/recepcion')
    if (res.ok) {
      historial.value = await res.json()
    }
  } catch (error) {
    console.error("Error al cargar historial:", error)
  } finally {
    isLoadingHistorial.value = false
  }
}

// --- LÓGICA ---
const onProductoSelect = () => {
  const selected = productos.value.find(p => `[${p.codigo_interno}] ${p.descripcion}` === productoBuscado.value)
  if (selected) {
    nuevoItem.value.id_producto = selected.id_producto
  } else {
    nuevoItem.value.id_producto = ''
  }
}

const agregarALista = () => {
  if (!nuevoItem.value.id_sucursal || !nuevoItem.value.id_producto || !nuevoItem.value.peso) {
    mostrarMensaje('error', 'Por favor, complete todos los campos.')
    return
  }

  const sucursal = sucursales.value.find(s => s.id_sucursal == nuevoItem.value.id_sucursal)
  const producto = productos.value.find(p => p.id_producto == nuevoItem.value.id_producto)

  itemsAgregados.value.push({
    id_sucursal: nuevoItem.value.id_sucursal,
    sucursal_nombre: sucursal?.nombre || 'Desconocida',
    id_producto: nuevoItem.value.id_producto,
    producto_nombre: producto?.descripcion || 'Producto',
    codigo_interno: producto?.codigo_interno || 'N/A',
    peso: Number(nuevoItem.value.peso),
    tipo: activeTab.value
  })

  // Limpiar campos de producto y peso, mantenemos sucursal para carga rápida
  nuevoItem.value.id_producto = ''
  nuevoItem.value.peso = ''
  productoBuscado.value = ''
  
  if (inputProducto.value) inputProducto.value.focus()
}

const eliminarItem = (index) => {
  itemsAgregados.value.splice(index, 1)
}

const confirmarEnvio = async () => {
  if (itemsAgregados.value.length === 0) return
  
  isSubmitting.value = true
  try {
    // Nota: El endpoint aún no existe en el back, se usa placeholder
    const res = await fetch('/api/recortes/recepcion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: itemsAgregados.value,
        fecha: new Date().toISOString()
      })
    })

    if (res.ok) {
      mostrarMensaje('success', 'Recepción registrada con éxito.')
      itemsAgregados.value = []
      cargarHistorial()
    } else {
      const errorData = await res.json().catch(() => ({}))
      mostrarMensaje('error', errorData.error || 'Error al registrar la recepción.')
    }
  } catch (error) {
    console.error(error)
    mostrarMensaje('error', 'Error de conexión con el servidor.')
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  cargarDatos()
  cargarHistorial()
})
</script>

<template>
  <div class="page-container animate-fade">
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title">Recepción de Recortes y Decomisos</h2>
        <p class="page-description">Registro de mermas y devoluciones provenientes de las sucursales.</p>
      </div>
    </div>

    <!-- Pestañas -->
    <div class="tabs-scroll no-print">
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'recortes' }"
        @click="activeTab = 'recortes'"
      >
        <i class="ph ph-recycle"></i> Ingreso Recortes
      </button>
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'decomisos' }"
        @click="activeTab = 'decomisos'"
      >
        <i class="ph ph-warning-circle"></i> Ingreso Decomisos
      </button>
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'historial' }"
        @click="activeTab = 'historial'"
      >
        <i class="ph ph-clock-counter-clockwise"></i> Historial
      </button>
    </div>

    <!-- Mensajes -->
    <div v-if="mensaje.texto" class="alert animate-slide-down" :class="mensaje.tipo === 'success' ? 'alert-success' : 'alert-danger'">
      <i :class="mensaje.tipo === 'success' ? 'ph-check-circle' : 'ph-warning-circle'"></i>
      {{ mensaje.texto }}
    </div>

    <div v-if="activeTab !== 'historial'" class="main-grid">
      <!-- Formulario de Carga -->
      <div class="card form-section">
        <div class="card-header">
          <h3 class="card-title">
            <i :class="activeTab === 'recortes' ? 'ph-recycle text-green' : 'ph-warning-circle text-red'"></i>
            Cargar {{ activeTab === 'recortes' ? 'Recorte' : 'Decomiso' }}
          </h3>
        </div>
        <form @submit.prevent="agregarALista" class="p-4">
          <div class="form-group mb-4">
            <label class="form-label">Sucursal de Origen</label>
            <select class="form-control" v-model="nuevoItem.id_sucursal" required>
              <option value="" disabled>Seleccione una sucursal...</option>
              <option v-for="suc in sucursales" :key="suc.id_sucursal" :value="suc.id_sucursal">
                {{ suc.nombre }}
              </option>
            </select>
          </div>

          <div class="form-group mb-4">
            <label class="form-label">Producto</label>
            <input 
              ref="inputProducto"
              list="productos-list" 
              class="form-control highlight-input" 
              v-model="productoBuscado" 
              @input="onProductoSelect" 
              placeholder="Buscar por código o nombre..." 
              required
            >
            <datalist id="productos-list">
              <option v-for="prod in productos" :key="prod.id_producto" :value="`[${prod.codigo_interno}] ${prod.descripcion}`"></option>
            </datalist>
          </div>

          <div class="form-group mb-6">
            <label class="form-label">Peso (Kg)</label>
            <input 
              type="number" 
              step="0.001" 
              class="form-control" 
              v-model="nuevoItem.peso" 
              placeholder="0.000" 
              required
            >
          </div>

          <button type="submit" class="btn btn-primary w-full">
            <i class="ph ph-plus"></i> Agregar a la Lista
          </button>
        </form>
      </div>

      <!-- Lista de Items Agregados -->
      <div class="card list-section">
        <div class="card-header responsive-card-header">
          <h3 class="card-title">Items para enviar</h3>
          <span class="badge badge-dark">{{ itemsAgregados.length }} items</span>
        </div>
        
        <div class="table-container">
          <table class="responsive-table">
            <thead>
              <tr>
                <th>Sucursal</th>
                <th>Producto</th>
                <th class="text-right">Peso</th>
                <th class="text-center">Tipo</th>
                <th class="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in itemsAgregados" :key="index">
                <td class="text-sm">{{ item.sucursal_nombre }}</td>
                <td>
                  <div class="prod-info">
                    <span class="fw-bold">{{ item.producto_nombre }}</span>
                    <span class="text-xs text-muted">{{ item.codigo_interno }}</span>
                  </div>
                </td>
                <td class="text-right fw-bold text-blue">{{ item.peso.toFixed(3) }} kg</td>
                <td class="text-center">
                  <span class="badge text-xs" :class="item.tipo === 'recortes' ? 'badge-primary' : 'badge-warning'">
                    {{ item.tipo === 'recortes' ? 'Recorte' : 'Decomiso' }}
                  </span>
                </td>
                <td class="text-right">
                  <button class="icon-btn text-red" @click="eliminarItem(index)" title="Eliminar">
                    <i class="ph ph-trash"></i>
                  </button>
                </td>
              </tr>
              <tr v-if="itemsAgregados.length === 0">
                <td colspan="5" class="text-center text-muted py-8">
                  <i class="ph ph-tray icon-xl mb-2"></i>
                  <p>No hay items en la lista.</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="card-footer" v-if="itemsAgregados.length > 0">
          <button 
            class="btn btn-success w-full btn-lg" 
            :disabled="isSubmitting"
            @click="confirmarEnvio"
          >
            <i v-if="isSubmitting" class="ph ph-spinner spinner"></i>
            <i v-else class="ph ph-check-circle"></i>
            {{ isSubmitting ? 'Procesando...' : 'Confirmar Recepción Completa' }}
          </button>
        </div>
      </div>
    </div>

    <!-- VISTA: HISTORIAL -->
    <div v-if="activeTab === 'historial'" class="history-view">
      <div class="card">
        <div class="card-header responsive-card-header">
          <h3 class="card-title">Registros Recientes</h3>
          <button class="icon-btn" @click="cargarHistorial" :disabled="isLoadingHistorial">
            <i class="ph ph-arrows-clockwise" :class="{ spinner: isLoadingHistorial }"></i>
          </button>
        </div>
        <div class="table-container">
          <table class="responsive-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Sucursal</th>
                <th>Producto</th>
                <th class="text-right">Peso</th>
                <th class="text-center">Tipo</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="isLoadingHistorial">
                <td colspan="5" class="text-center py-8 text-muted">Cargando historial...</td>
              </tr>
              <tr v-else-if="historial.length === 0">
                <td colspan="5" class="text-center py-8 text-muted">No hay registros aún.</td>
              </tr>
              <tr v-for="h in historial" :key="h.id">
                <td class="text-xs">{{ h.fecha?.split('T')[0] }} <span class="text-muted">{{ h.fecha?.split('T')[1].slice(0,5) }}</span></td>
                <td class="text-sm fw-medium">{{ h.sucursal_nombre }}</td>
                <td>
                  <div class="prod-info">
                    <span class="fw-bold">{{ h.producto_nombre }}</span>
                    <span class="text-xs text-muted">{{ h.codigo_interno }}</span>
                  </div>
                </td>
                <td class="text-right fw-bold text-blue">{{ Number(h.peso).toFixed(3) }} kg</td>
                <td class="text-center">
                  <span class="badge text-xs" :class="h.tipo === 'recortes' ? 'badge-primary' : 'badge-warning'">
                    {{ h.tipo === 'recortes' ? 'Recorte' : 'Decomiso' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.main-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

@media (min-width: 1024px) {
  .main-grid {
    grid-template-columns: 350px 1fr;
  }
}

.prod-info {
  display: flex;
  flex-direction: column;
}

.text-green { color: var(--accent-success); }
.text-red { color: var(--accent-danger); }

.highlight-input {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.w-full { width: 100%; }
.btn-lg { padding: 0.75rem; font-size: 1rem; }

.mb-4 { margin-bottom: 1rem; }
.mb-6 { margin-bottom: 1.5rem; }
.mt-4 { margin-top: 1rem; }

.icon-xl { font-size: 2.5rem; opacity: 0.2; }

.card-footer {
  padding: 1rem;
  background: rgba(255, 255, 255, 0.02);
  border-top: 1px solid var(--glass-border);
}

.badge-primary { background: var(--accent-primary); color: white; }
.badge-warning { background: var(--accent-warning); color: white; }
.badge-dark { background: #444; color: white; }

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Transiciones */
.animate-fade {
  animation: fadeIn 0.3s ease;
}
.animate-slide-down {
  animation: slideDown 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes slideDown {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
