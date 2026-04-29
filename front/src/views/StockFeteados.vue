<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useWinDialog } from '../composables/useWinDialog'

const { winConfirm } = useWinDialog()

const authStore = useAuthStore()
const isAdmin = computed(() => authStore.user?.rol === 'Admin')

const productos = ref([])
const isLoading = ref(false)
const searchQuery = ref('')
const expandedRows = ref(new Set()) // Para manejar múltiples filas expandidas en móvil

// Estado para el ajuste de stock
const showAjuste = ref(false)
const productoAAjustar = ref(null)
const nuevoStockValor = ref(0)
const isUpdating = ref(false)
const mensaje = ref({ tipo: '', texto: '' })

const mostrarMensaje = (tipo, texto) => {
  mensaje.value = { tipo, texto }
  setTimeout(() => { mensaje.value = { tipo: '', texto: '' } }, 4000)
}

const toggleRow = (id) => {
  if (expandedRows.value.has(id)) {
    expandedRows.value.delete(id)
  } else {
    expandedRows.value.add(id)
  }
}

const cargarProductos = async () => {
  isLoading.value = true
  try {
    const res = await fetch('/api/stock-kilos')
    if (res.ok) {
      productos.value = await res.json()
    }
  } catch (error) {
    console.error('Error al cargar productos:', error)
  } finally {
    isLoading.value = false
  }
}

const productosProcesados = computed(() => {
  let result = productos.value
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(p =>
      (p.nombre && p.nombre.toLowerCase().includes(query)) ||
      (p.codigo && p.codigo.toLowerCase().includes(query))
    )
  }
  return [...result].sort((a, b) => (Number(b.stock_kilos) || 0) - (Number(a.stock_kilos) || 0))
})

const abrirAjuste = (prod) => {
  productoAAjustar.value = prod
  nuevoStockValor.value = Number(prod.stock_en_kilos) || 0
  showAjuste.value = true
}

const confirmarAjuste = async () => {
  if (!productoAAjustar.value) return
  isUpdating.value = true
  try {
    const res = await fetch(`/api/productos/${productoAAjustar.value.codigo_interno}/stock`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nuevo_stock: Number(nuevoStockValor.value) })
    })
    if (res.ok) {
      mostrarMensaje('success', `Stock actualizado correctamente.`)
      showAjuste.value = false
      cargarProductos()
    }
  } catch (error) {
    mostrarMensaje('error', 'Error de red al ajustar stock.')
  } finally {
    isUpdating.value = false
  }
}

// Upload Excel stock-kilos
const showExcelModal = ref(false)
const archivoExcel = ref(null)
const isUploading = ref(false)
const uploadResult = ref(null)

const onFileChange = (e) => {
  archivoExcel.value = e.target.files[0] || null
  uploadResult.value = null
}

const subirExcelStock = async () => {
  if (!archivoExcel.value) return mostrarMensaje('error', 'Seleccione un archivo .xlsx primero.')
  if (!await winConfirm('Esto BORRARÁ todos los registros de stock-kilos existentes y los reemplazará con los del Excel. ¿Continuar?', 'Advertencia')) return

  isUploading.value = true
  uploadResult.value = null

  const formData = new FormData()
  formData.append('archivo', archivoExcel.value)

  try {
    const res = await fetch('/api/stock-kilos/cargar-excel', {
      method: 'POST',
      body: formData
    })
    const data = await res.json()
    if (res.ok) {
      uploadResult.value = data.resumen
      mostrarMensaje('success', data.mensaje || 'Excel procesado correctamente.')
      archivoExcel.value = null
      const fi = document.getElementById('stock-excel-input')
      if (fi) fi.value = ''
      cargarProductos()
    } else {
      mostrarMensaje('error', data.error || 'Error al procesar el Excel.')
    }
  } catch {
    mostrarMensaje('error', 'Error de red al subir el archivo.')
  } finally {
    isUploading.value = false
  }
}

onMounted(cargarProductos)
</script>

<template>
  <div class="page-container animate-fade">
    <div class="page-header responsive-header">
      <div class="header-content">
        <h2 class="page-title">Stock de Productos</h2>
        <p class="page-description">Control de inventario feteado y en kilos.</p>
      </div>
      <div style="display:flex;gap:0.3rem;align-items:center">
        <button v-if="isAdmin" class="btn btn-secondary" @click="showExcelModal = true" title="Cargar Excel">
          <i class="ph ph-microsoft-excel-logo"></i>
          <span class="d-none-mobile">Stock Excel</span>
        </button>
        <button class="btn btn-outline" @click="cargarProductos" :disabled="isLoading">
          <i class="ph ph-arrows-clockwise" :class="{ 'spinner': isLoading }"></i>
          <span class="d-none-mobile">Actualizar</span>
        </button>
      </div>
    </div>

    <div v-if="mensaje.texto" class="alert-box" :class="mensaje.tipo">
      <i :class="mensaje.tipo === 'success' ? 'ph ph-check-circle' : 'ph ph-warning-circle'"></i>
      <span>{{ mensaje.texto }}</span>
    </div>

    <div class="card mt-4 no-padding-mobile">
      <div class="card-header responsive-card-header">
        <div class="search-wrapper">
          <i class="ph ph-magnifying-glass search-icon"></i>
          <input 
            type="text" 
            class="form-control" 
            placeholder="Buscar productos..." 
            v-model="searchQuery"
          >
        </div>
      </div>

      <div class="table-container">
        <div v-if="isLoading && productos.length === 0" class="loading-state">
          <i class="ph ph-spinner spinner icon-xl"></i>
          <p>Cargando inventario...</p>
        </div>

        <table v-else class="responsive-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Cód.</th>
              <th class="text-right">Kilos</th>
              <th class="text-right">Envasados</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="prod in productosProcesados" :key="prod.codigo">
              <td class="text-sm">{{ (prod.nombre || '-').slice(5) }}</td>
              <td class="text-muted text-xs fw-bold">{{ prod.codigo }}</td>
              <td class="text-right fw-bold text-orange">{{ Number(prod.stock_kilos || 0).toFixed(2) }}</td>
              <td class="text-right text-blue fw-bold">{{ prod.stock_envasados ?? 0 }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Ajuste (Responsivo) -->
    <div v-if="showAjuste" class="modal-overlay" @click.self="showAjuste = false">
      <div class="modal-card animate-slide-in">
        <div class="modal-header">
          <h3 class="modal-title">Ajustar Stock</h3>
          <button class="icon-btn" @click="showAjuste = false"><i class="ph ph-x"></i></button>
        </div>
        <div class="modal-body">
          <p class="mb-4 text-sm text-secondary">
            Producto: <strong>{{ productoAAjustar?.descripcion }}</strong>
          </p>
          <div class="form-group">
            <label class="form-label">Nuevo Peso Total (kg)</label>
            <input type="number" step="0.01" class="form-control text-xl" v-model="nuevoStockValor">
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" @click="showAjuste = false">Cancelar</button>
          <button class="btn btn-primary" @click="confirmarAjuste" :disabled="isUpdating">
            <i v-if="isUpdating" class="ph ph-spinner spinner"></i>
            {{ isUpdating ? 'Guardando...' : 'Confirmar' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Carga Excel Stock Kilos -->
    <div v-if="showExcelModal" class="modal-overlay" @click.self="showExcelModal = false">
      <div class="modal-card animate-slide-in">
        <div class="modal-header">
          <h3 class="modal-title"><i class="ph ph-microsoft-excel-logo"></i> Cargar Stock desde Excel</h3>
          <button class="icon-btn" @click="showExcelModal = false"><i class="ph ph-x"></i></button>
        </div>
        <div class="modal-body">
          <div class="alert-box warning" style="margin-bottom:0.5rem;font-size:0.75rem">
            ⚠ Esto BORRARÁ todos los registros de stock-kilos y los reemplazará con los del archivo.
          </div>
          <div class="form-group">
            <label class="form-label">Archivo Excel (.xlsx)</label>
            <input
              id="stock-excel-input"
              type="file"
              accept=".xlsx,.xls"
              class="form-control file-input"
              @change="onFileChange"
            />
          </div>
          <p v-if="archivoExcel" class="file-name">
            <strong>{{ archivoExcel.name }}</strong> ({{ (archivoExcel.size/1024).toFixed(1) }} KB)
          </p>
          <!-- Resultado -->
          <div v-if="uploadResult" class="result-box">
            <div class="result-title">Resultado:</div>
            <table style="width:100%;font-size:0.8rem">
              <tr>
                <td>Registros insertados</td>
                <td class="text-right fw-bold text-blue">{{ uploadResult.registros_insertados }}</td>
              </tr>
              <tr>
                <td>Registros ignorados</td>
                <td class="text-right fw-bold" :class="uploadResult.registros_ignorados > 0 ? 'text-red' : 'text-muted'">{{ uploadResult.registros_ignorados }}</td>
              </tr>
            </table>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" @click="showExcelModal = false" :disabled="isUploading">Cancelar</button>
          <button class="btn btn-primary" @click="subirExcelStock" :disabled="!archivoExcel || isUploading">
            {{ isUploading ? 'Procesando...' : 'Subir y Procesar' }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.responsive-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

/* Search */
.search-wrapper {
  position: relative;
  width: 100%;
  flex: 1;
}

.search-icon {
  position: absolute;
  left: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  font-size: 0.85rem;
  pointer-events: none;
}

.search-wrapper .form-control {
  padding-left: 1.75rem;
}

/* Table */
.responsive-table tr { cursor: pointer; }
.row-expanded td { background: var(--accent-primary-light) !important; }

.prod-info { display: flex; flex-direction: column; }

.stock-display { display: flex; flex-direction: column; align-items: flex-end; }
.text-orange { color: var(--accent-warning); }

/* Detail Row (Mobile) */
.detail-row td {
  padding: 0 !important;
  border-bottom: 2px solid var(--bg-tertiary);
}

.detail-content {
  padding: 0.5rem 0.6rem;
  background: #e8e5dc;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem 1rem;
  margin-bottom: 0.6rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.detail-label {
  font-size: 0.65rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: 700;
}

.detail-value {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-primary);
}

.detail-actions { margin-top: 0.4rem; }

/* Expand button */
.expand-btn {
  background: var(--bg-secondary);
  color: var(--accent-primary);
  font-size: 0.9rem;
  border: none;
  box-shadow: var(--raised-shadow);
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.expand-btn:active { box-shadow: var(--inset-shadow); }

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.modal-card {
  background: var(--bg-secondary);
  box-shadow: var(--raised-shadow), 4px 4px 12px rgba(0,0,0,0.4);
  width: 100%;
  max-width: 380px;
  border: 1px solid var(--bevel-dark);
}

.modal-header {
  background: var(--accent-primary);
  color: white;
  padding: 0.4rem 0.75rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-title {
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.modal-body { padding: 0.75rem; }

.modal-footer {
  padding: 0.5rem 0.75rem;
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  border-top: 1px solid var(--bg-tertiary);
  background: var(--bg-primary);
}

/* Utilities */
.d-none-mobile { display: none; }
.d-only-mobile { display: block; }
.w-full { width: 100%; display: flex; }
.text-xl { font-size: 1.4rem; text-align: center; font-weight: 700; height: 44px; }
.btn-outline { background: var(--bg-secondary); color: var(--text-primary); box-shadow: var(--raised-shadow); border: none; }
.btn-outline:active { box-shadow: var(--inset-shadow); }

@media (min-width: 768px) {
  .d-none-mobile { display: table-cell; }
  .d-only-mobile { display: none !important; }
  .responsive-table tr { cursor: default; }
  .search-wrapper { max-width: 320px; }
}

.spinner { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

.animate-slide-down { animation: slideDown 0.15s ease-out; }
@keyframes slideDown { from { opacity: 0; } to { opacity: 1; } }

/* Excel upload */
.file-input { height: auto; padding: 0.3rem; font-size: 0.8rem; }
.file-name { font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.25rem; }

.result-box {
  margin-top: 0.5rem;
  padding: 0.4rem;
  background: var(--accent-primary-light);
  border: 1px solid var(--accent-primary);
  border-left: 4px solid var(--accent-primary);
}
.result-title {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--accent-primary);
  text-transform: uppercase;
  margin-bottom: 0.25rem;
}
.text-red { color: var(--accent-danger); }
</style>
