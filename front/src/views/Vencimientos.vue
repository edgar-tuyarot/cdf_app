<template>
  <div class="page-container animate-fade">
    <!-- Header Principal -->
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title">Vencimientos de Productos</h2>
        <p class="page-description">Supervisa los lotes de piezas con vencimientos más cercanos y gestiona el stock crítico.</p>
      </div>
    </div>

    <!-- Alertas -->
    <div v-if="alert.show" :class="['alert-box mb-4', alert.type]">
      {{ alert.message }}
    </div>

    <!-- Buscador de Vencimientos -->
    <div class="card mb-4">
      <div class="card-header">Buscador de Vencimientos</div>
      <div class="card-body" style="padding: 0.75rem;">
        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label">Buscar por Producto (Código / Nombre)</label>
          <div style="display: flex; align-items: center; background: var(--bg-window); padding: 0.25rem 0.5rem; border: 1.5px solid var(--bevel-dark);">
            <i class="ph ph-magnifying-glass" style="color: var(--text-secondary); margin-right: 0.4rem; font-size: 1rem;"></i>
            <input 
              type="text" 
              v-model="searchQuery" 
              placeholder="Ej: jamón, 1001..." 
              style="border: none; outline: none; background: transparent; width: 100%; color: var(--text-primary); font-size: 0.88rem; font-weight: 600;"
            />
            <button v-if="searchQuery" @click="searchQuery = ''" style="background: none; border: none; cursor: pointer; color: var(--text-muted); display: flex; align-items: center;">
              <i class="ph ph-x-circle" style="font-size: 1rem;"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Listado de Vencimientos -->
    <div class="card">
      <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
        <div style="display: flex; gap: 0.5rem; align-items: center;">
          <button 
            v-if="!loading && filteredVencimientos.length > 0"
            class="btn btn-secondary" 
            style="height: 28px; font-size: 0.8rem; display: flex; align-items: center; gap: 0.25rem; padding: 0 0.55rem; background: #1f7244; color: white; border: 1px solid #165230;" 
            @click="exportToExcel"
          >
            <i class="ph ph-file-xls"></i> Exportar
          </button>
        </div>
      </div>
      
      <div class="table-container">
        <table v-if="!loading && filteredVencimientos.length > 0" class="vencimientos-table access-table">
          <thead>
            <tr>
              <th>
                <span class="d-none-mobile">Código</span>
                <span class="d-only-mobile">Cod.</span>
              </th>
              <th>
                <span class="d-none-mobile">Nombre de Producto</span>
                <span class="d-only-mobile">Nombre</span>
              </th>
              <th class="text-center">
                <span class="d-none-mobile">Vencimiento</span>
                <span class="d-only-mobile">Venc.</span>
              </th>
              <th class="text-center d-none-mobile">Días Restantes</th>
              <th class="text-right">
                <span class="d-none-mobile">Piezas</span>
                <span class="d-only-mobile">Pzas.</span>
              </th>
              <th class="text-right d-none-mobile">Peso Unitario</th>
              <th class="text-right d-none-mobile">Kilos Est. Expira</th>
              <th class="text-right d-none-mobile">Stock Kilos Total</th>
              <th class="text-center d-none-mobile">Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="v in filteredVencimientos" 
              :key="v.id" 
              class="clickable-row" 
              @click="openEditLoteModal(v)" 
              style="cursor: pointer;"
            >
              <td><strong>{{ v.codigo_producto }}</strong></td>
              <td>{{ v.producto?.nombre || 'Producto Desconocido' }}</td>
              <td class="text-center" style="font-family: monospace; font-weight: bold;">
                {{ formatDateDDMM(v.vencimiento) }}
              </td>
              <td class="text-center d-none-mobile">
                <span :class="['days-remaining', getDaysRemaining(v.vencimiento).class]">
                  {{ getDaysRemaining(v.vencimiento).text }}
                </span>
              </td>
              <td class="text-right font-bold" style="font-family: monospace;">
                {{ getPiezasEstimadasVencimiento(v) }}
              </td>
              <td class="text-right d-none-mobile" style="color: var(--text-muted);">
                {{ v.producto?.peso_pieza ? `${parseFloat(v.producto.peso_pieza).toFixed(3)} kg` : '-' }}
              </td>
              <td class="text-right font-bold d-none-mobile" style="color: var(--accent-danger); font-family: monospace;">
                {{ calcularKilosEst(v).toFixed(3) }} kg
              </td>
              <td class="text-right d-none-mobile" style="font-family: monospace;">
                {{ v.producto?.stock !== undefined ? `${parseFloat(v.producto.stock).toFixed(3)} kg` : '0.000 kg' }}
              </td>
              <td class="text-center d-none-mobile">
                <span :class="['status-tag', getDaysRemaining(v.vencimiento).class]">
                  {{ getDaysRemaining(v.vencimiento).label }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Cargando -->
        <div v-if="loading" class="loading-state">
          <i class="ph ph-spinner spinner icon-xl"></i>
          Obteniendo cronograma de vencimientos...
        </div>

        <!-- Vacío -->
        <div v-if="!loading && filteredVencimientos.length === 0" class="empty-state">
          <i class="ph ph-calendar-x icon-xl"></i>
          No se encontraron lotes de vencimiento que coincidan con la búsqueda.
        </div>
      </div>
    </div>

    <!-- MODAL EDITAR LOTE DE VENCIMIENTO -->
    <Teleport to="body">
      <div v-if="showEditLoteModal" class="win-dialog-overlay" @mousedown.self="showEditLoteModal = false">
        <div class="win-dialog" style="max-width: 520px; width: 95vw;">
          <div class="win-dialog-titlebar" style="background: #0f172a; color: white;">
            <span class="win-dialog-titlebar-text" style="font-weight: 800; font-size: 0.95rem; color: white; display: flex; align-items: center; gap: 0.4rem;">
              <i class="ph ph-pencil-simple text-blue"></i> Editar Lote de Vencimiento
            </span>
            <button class="win-dialog-close" style="color: white;" @click="showEditLoteModal = false">
              <i class="ph ph-x"></i>
            </button>
          </div>

          <div class="win-dialog-body" style="padding: 1.25rem; display: flex; flex-direction: column; gap: 1rem;">
            <!-- 1. Producto -->
            <div class="form-group" style="margin: 0;">
              <label class="form-label" style="font-weight: 700;">Producto *</label>
              <select v-model="editLoteForm.codigo_producto" class="form-control fw-bold" style="font-size: 0.85rem; height: 32px;">
                <option v-for="p in productos" :key="p.codigo" :value="p.codigo">
                  [{{ p.codigo }}] {{ p.nombre }}
                </option>
              </select>
            </div>

            <!-- 2. Peso y Piezas Calculadas Automáticas -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
              <div class="form-group" style="margin: 0;">
                <label class="form-label" style="font-weight: 700;">Peso del Lote (kg) *</label>
                <input 
                  type="number" 
                  step="0.001" 
                  min="0" 
                  v-model.number="editLoteForm.peso" 
                  class="form-control text-right fw-bold" 
                  style="height: 32px;"
                  required
                />
              </div>

              <div class="form-group" style="margin: 0;">
                <label class="form-label" style="font-weight: 700;">Piezas (Auto)</label>
                <input 
                  type="number" 
                  :value="editPiezasCalculadas" 
                  class="form-control text-right fw-bold text-blue" 
                  disabled 
                  style="height: 32px; background: var(--bg-secondary);"
                />
              </div>
            </div>

            <!-- 3. Fecha de Vencimiento -->
            <div class="form-group" style="margin: 0;">
              <label class="form-label" style="font-weight: 700;">Fecha de Vencimiento *</label>
              <input 
                type="date" 
                v-model="editLoteForm.vencimiento" 
                class="form-control fw-bold" 
                style="height: 32px;"
                required
              />
            </div>
          </div>

          <div class="win-dialog-footer" style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; padding: 0.75rem 1.25rem;">
            <button 
              type="button" 
              style="background: transparent; border: 1.5px solid var(--accent-error); color: var(--accent-error); font-weight: 700; font-size: 0.8rem; padding: 0.35rem 0.75rem; border-radius: 4px; display: inline-flex; align-items: center; gap: 0.3rem; cursor: pointer;"
              @click="confirmDeleteLote(editLoteForm)"
            >
              <i class="ph ph-trash"></i> Eliminar Lote
            </button>

            <div style="display: flex; gap: 0.5rem;">
              <button class="win-dialog-btn" @click="showEditLoteModal = false">Cancelar</button>
              <button class="win-dialog-btn win-dialog-btn-ok" @click="saveEditLote" :disabled="savingLote">
                <i class="ph ph-spinner spinner" v-if="savingLote"></i>
                <i class="ph ph-floppy-disk me-1" v-else></i> Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import * as XLSX from 'xlsx'

const vencimientos = ref([])
const productos = ref([])
const loading = ref(true)
const searchQuery = ref('')
const alert = ref({ show: false, message: '', type: 'success' })

// Estado Modal Editar Lote
const showEditLoteModal = ref(false)
const savingLote = ref(false)
const editLoteForm = ref({
  id: null,
  codigo_producto: '',
  peso: 0,
  vencimiento: ''
})

const editSelectedProduct = computed(() => {
  if (!editLoteForm.value.codigo_producto) return null
  return productos.value.find(p => p.codigo === editLoteForm.value.codigo_producto) || null
})

const editPiezasCalculadas = computed(() => {
  const pesoVal = parseFloat(editLoteForm.value.peso) || 0
  const pxp = parseFloat(editSelectedProduct.value?.peso_pieza) || 0
  if (pesoVal <= 0 || pxp <= 0 || pesoVal < pxp) return 0
  return Math.round(pesoVal / pxp)
})

const openEditLoteModal = (v) => {
  editLoteForm.value = {
    id: v.id,
    codigo_producto: v.codigo_producto,
    peso: parseFloat(v.peso) || 0,
    vencimiento: v.vencimiento ? String(v.vencimiento).split('T')[0] : ''
  }
  showEditLoteModal.value = true
}

const saveEditLote = async () => {
  if (!editLoteForm.value.codigo_producto || !editLoteForm.value.vencimiento) {
    showAlert('Seleccione el producto y la fecha de vencimiento.', 'error')
    return
  }
  savingLote.value = true
  try {
    const res = await fetch(`/api/productos/vencimientos/${editLoteForm.value.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editLoteForm.value)
    })
    const data = await res.json()
    if (res.ok) {
      showAlert('Lote de vencimiento actualizado exitosamente.', 'success')
      showEditLoteModal.value = false
      await fetchVencimientos()
    } else {
      showAlert(data.error || 'Error al actualizar el lote.', 'error')
    }
  } catch (err) {
    console.error('Error saving lote:', err)
    showAlert('Error de conexión con el servidor.', 'error')
  } finally {
    savingLote.value = false
  }
}

const confirmDeleteLote = async (target) => {
  const loteId = target?.id || target
  if (!loteId) return
  const prodName = editSelectedProduct.value?.nombre || target?.producto?.nombre || target?.codigo_producto || 'este producto'
  if (!confirm(`¿Estás seguro de que deseas eliminar el lote de ${prodName}?`)) return
  try {
    const res = await fetch(`/api/productos/vencimientos/${loteId}`, { method: 'DELETE' })
    if (res.ok) {
      showAlert('Lote eliminado correctamente.')
      showEditLoteModal.value = false
      await fetchVencimientos()
    } else {
      const data = await res.json()
      showAlert(data.error || 'Error al eliminar el lote.', 'error')
    }
  } catch (err) {
    console.error('Error deleting lote:', err)
    showAlert('Error de conexión con el servidor.', 'error')
  }
}

const showAlert = (msg, type = 'success') => {
  alert.value = { show: true, message: msg, type }
  setTimeout(() => { alert.value.show = false }, 4000)
}

const fetchVencimientos = async () => {
  loading.value = true
  try {
    const [resVenc, resProd] = await Promise.all([
      fetch('/api/productos/vencimientos-cercanos'),
      fetch('/api/productos')
    ])
    if (resVenc.ok) {
      vencimientos.value = await resVenc.json()
    }
    if (resProd.ok) {
      productos.value = await resProd.json()
    }
  } catch (error) {
    console.error('Error al obtener datos:', error)
  } finally {
    loading.value = false
  }
}

// Formateador de fecha dd-mm
const formatDateDDMM = (dateStr) => {
  if (!dateStr) return '-'
  const match = String(dateStr).trim().match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (match) {
    return `${match[3]}-${match[2]}`
  }
  return dateStr
}

const getPiezasEstimadasVencimiento = (v) => {
  if (!v) return 0
  const peso = parseFloat(v.peso) || 0
  const pesoXP = parseFloat(v.producto?.peso_pieza) || 0
  if (peso <= 0 || pesoXP <= 0 || peso < pesoXP) return 0
  return Math.round(peso / pesoXP)
}

const calcularKilosEst = (v) => {
  if (!v) return 0
  return parseFloat(v.peso) || 0
}

const getDaysRemaining = (vencimientoDate) => {
  if (!vencimientoDate) return { text: '-', class: 'status-safe', label: 'Seguro', days: 999 }
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const target = new Date(vencimientoDate + 'T00:00:00')
  target.setHours(0, 0, 0, 0)
  
  const diffTime = target - today
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) {
    const absDays = Math.abs(diffDays)
    return {
      text: `Hace ${absDays} ${absDays === 1 ? 'día' : 'días'}`,
      class: 'status-expired',
      label: 'Vencido',
      days: diffDays
    }
  } else if (diffDays === 0) {
    return {
      text: '¡Vence Hoy!',
      class: 'status-today',
      label: 'Hoy',
      days: diffDays
    }
  } else if (diffDays <= 7) {
    return {
      text: `${diffDays} ${diffDays === 1 ? 'día' : 'días'}`,
      class: 'status-warning',
      label: 'Crítico',
      days: diffDays
    }
  } else if (diffDays <= 30) {
    return {
      text: `${diffDays} días`,
      class: 'status-approaching',
      label: 'Próximo',
      days: diffDays
    }
  } else {
    return {
      text: `${diffDays} días`,
      class: 'status-safe',
      label: 'Seguro',
      days: diffDays
    }
  }
}

const filteredVencimientos = computed(() => {
  let result = [...vencimientos.value]

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    result = result.filter(v => {
      const codigoMatch = v.codigo_producto ? v.codigo_producto.toLowerCase().includes(query) : false
      const nombreMatch = v.producto?.nombre ? v.producto.nombre.toLowerCase().includes(query) : false
      return codigoMatch || nombreMatch
    })
  }

  return result
})

const exportToExcel = () => {
  if (filteredVencimientos.value.length === 0) return

  const dataToExport = filteredVencimientos.value.map(v => ({
    'Código Producto': v.codigo_producto,
    'Nombre del Producto': v.producto?.nombre || 'Desconocido',
    'Piezas Est.': getPiezasEstimadasVencimiento(v),
    'Fecha de Vencimiento (dd-mm)': formatDateDDMM(v.vencimiento),
    'Fecha Completa': v.vencimiento,
    'Kilos Est. Expira (kg)': parseFloat(calcularKilosEst(v)).toFixed(3),
    'Estado': getDaysRemaining(v.vencimiento).label
  }))

  const worksheet = XLSX.utils.json_to_sheet(dataToExport)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Vencimientos')

  const maxCodeLen = Math.max(...dataToExport.map(d => String(d['Código Producto']).length), 16)
  const maxNameLen = Math.max(...dataToExport.map(d => String(d['Nombre del Producto']).length), 26)
  worksheet['!cols'] = [
    { wch: maxCodeLen },
    { wch: maxNameLen },
    { wch: 10 },
    { wch: 22 },
    { wch: 18 },
    { wch: 22 },
    { wch: 12 }
  ]

  XLSX.writeFile(workbook, `Vencimientos_${new Date().toISOString().slice(0, 10)}.xlsx`)
}

onMounted(() => {
  fetchVencimientos()
})
</script>

<style scoped>
.font-bold {
  font-weight: 700;
}

.badge-total {
  font-size: 0.75rem;
  padding: 2px 8px;
  background: var(--accent-primary);
  color: white;
  border: 1px solid var(--accent-primary-hover);
  box-shadow: var(--inset-shadow);
  text-transform: uppercase;
  font-weight: bold;
}

.d-none-mobile {
  display: table-cell;
}
.d-only-mobile {
  display: none;
}

@media (max-width: 767px) {
  .d-none-mobile {
    display: none !important;
  }
  .d-only-mobile {
    display: inline-block !important;
  }
}

.days-remaining {
  display: inline-block;
  padding: 2px 6px;
  font-size: 0.75rem;
  font-family: monospace;
  font-weight: bold;
  border-radius: 0;
}

.status-tag {
  display: inline-block;
  padding: 1px 8px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  box-shadow: var(--inset-shadow);
  border-radius: 0;
}

.status-expired {
  background: #ffebe9 !important;
  color: #c9241b !important;
  border: 1px solid #ff8885 !important;
}

.status-today {
  background: #fff3c4 !important;
  color: #856404 !important;
  border: 1px solid #ffebaa !important;
}

.status-warning {
  background: #fff3c4 !important;
  color: #856404 !important;
  border: 1px solid #ffebaa !important;
}

.status-approaching {
  background: #e6f0ff !important;
  color: #004085 !important;
  border: 1px solid #b8daff !important;
}

.status-safe {
  background: #e6f4ea !important;
  color: #137333 !important;
  border: 1px solid #ceead6 !important;
}

.vencimientos-table tbody tr:hover {
  background-color: var(--bevel-light);
}

.clickable-row:hover {
  background-color: rgba(37, 99, 235, 0.05) !important;
}
</style>
