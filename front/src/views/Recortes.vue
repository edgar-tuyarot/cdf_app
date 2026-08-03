<template>
  <div class="page-container animate-fade">
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title">Control de Recortes</h2>
        <p class="page-description">Visualiza el consolidado de recortes y mermas por producto.</p>
      </div>
      <div class="header-actions mt-2" style="display: flex; gap: 0.5rem;">
        <button 
          v-if="selectedItems.length > 0" 
          class="btn btn-primary animate-fade" 
          style="background-color: var(--accent-success);" 
          @click="openBulkConvertModal"
        >
          <i class="ph ph-arrows-left-right"></i> Convertir Lote ({{ selectedItems.length }})
        </button>
        <button class="btn btn-secondary" @click="fetchRecortes" :disabled="loading">
          <i class="ph ph-spinner spinner" v-if="loading"></i>
          <i class="ph ph-arrows-clockwise" v-else></i> Actualizar Datos
        </button>
      </div>
    </div>

    <!-- Indicador de Kilos Totales -->
    <div class="grid-summary mb-4" v-if="!loading">
      <div class="card summary-card">
        <div class="card-header">
          <span class="card-title">Resumen de Mermas</span>
        </div>
        <div class="summary-content">
          <div class="summary-icon-box">
            <i class="ph ph-scissors text-red"></i>
          </div>
          <div class="summary-details">
            <span class="summary-label">Kilos Totales Acumulados</span>
            <h1 class="summary-value text-red">{{ data.Kilos_Totales || '0 kg' }}</h1>
          </div>
        </div>
      </div>
    </div>

    <!-- Mensajes de estado -->
    <div v-if="alert.show" :class="['alert-box mb-4', alert.type]">
      {{ alert.message }}
    </div>

    <!-- Tabla de Productos con Recortes -->
    <div class="card">
      <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
        <span class="card-title">Productos con Recortes (> 0 kg)</span>
        <div style="display: flex; align-items: center; gap: 0.3rem; background: var(--bg-window); padding: 0.1rem 0.3rem; box-shadow: var(--inset-shadow); height: 26px;">
          <i class="ph ph-magnifying-glass" style="color: var(--text-secondary); font-size: 0.9rem;"></i>
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="Buscar..." 
            style="border: none; outline: none; font-size: 0.8rem; background: transparent; width: 150px; color: var(--text-primary);"
          />
          <button v-if="searchQuery" @click="searchQuery = ''" style="background: none; border: none; cursor: pointer; color: var(--text-muted); display: flex; align-items: center;">
            <i class="ph ph-x-circle"></i>
          </button>
        </div>
      </div>
      <div class="table-container">
        <table v-if="!loading && filteredAndSortedProductos.length > 0">
          <thead>
            <tr>
              <th style="width: 40px; text-align: center;">
                <input 
                  type="checkbox" 
                  v-model="selectAll" 
                  @change="toggleSelectAll" 
                />
              </th>
              <th @click="sortBy('codigo')" class="sortable">
                Código 
                <i v-if="sortKey === 'codigo'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i>
              </th>
              <th @click="sortBy('nombre')" class="sortable">
                Nombre del Producto 
                <i v-if="sortKey === 'nombre'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i>
              </th>
              <th @click="sortBy('kilos')" class="sortable text-right">
                Kilos Recorte 
                <i v-if="sortKey === 'kilos'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i>
              </th>
              <th class="text-center" style="width: 100px;">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in filteredAndSortedProductos" :key="p.codigo" :class="{ 'selected-row': selectedItems.includes(p.codigo) }">
              <td style="text-align: center;">
                <input 
                  type="checkbox" 
                  :value="p.codigo" 
                  v-model="selectedItems" 
                  @change="updateSelectAllState" 
                />
              </td>
              <td><strong>{{ p.codigo }}</strong></td>
              <td>{{ p.nombre }}</td>
              <td class="text-right fw-bold text-red">{{ p.kilos.toFixed(3) }} kg</td>
              <td>
                <div style="display: flex; gap: 0.25rem; justify-content: center;">
                  <button class="btn btn-secondary text-green" style="min-height: 24px; padding: 0.1rem 0.5rem; font-size: 0.75rem;" title="Convertir a Picada" @click="openConvertModal(p)">
                    <i class="ph ph-arrows-left-right"></i> Convertir
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Carga -->
        <div v-if="loading" class="loading-state">
          <i class="ph ph-spinner spinner icon-xl"></i>
          Cargando recortes...
        </div>

        <!-- Modal Confirmación Eliminar o Procesos Alternativos -->    <!-- Modal Convertir Recorte -->
    <Teleport to="body">
      <div v-if="showConvertModal" class="modal-overlay" @mousedown.self="closeConvertModal">
        <div class="modal-card" style="max-width: 400px;">
          <div class="modal-header" style="background: var(--accent-success);">
            <h3 class="modal-title">
              {{ itemsToConvert.length > 1 ? 'Convertir Lote a Picaditas' : 'Convertir Recorte a Picaditas' }}
            </h3>
            <button class="icon-btn" @click="closeConvertModal"><i class="ph ph-x"></i></button>
          </div>
          <form @submit.prevent="handleConvert">
            <div class="modal-body">
              <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                <div class="alert-box success" style="border-left-width: 4px; padding: 0.4rem; font-size: 0.75rem;">
                  Los recortes convertidos se descontarán de los productos origen y se sumarán automáticamente al stock calculado de <strong>7718 - FIAM PICADITAS X KG</strong>.
                </div>
                
                <!-- Si es un solo producto -->
                <div v-if="itemsToConvert.length === 1">
                  <div class="form-group">
                    <label class="form-label" style="font-size: 0.7rem;">Producto Origen</label>
                    <input type="text" :value="`[${itemsToConvert[0].codigo}] ${itemsToConvert[0].nombre}`" class="form-control" disabled />
                  </div>

                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
                    <div class="form-group">
                      <label class="form-label" style="font-size: 0.7rem;">Disponible para convertir</label>
                      <input type="text" :value="`${itemsToConvert[0].kilos.toFixed(3)} kg`" class="form-control" disabled />
                    </div>

                    <div class="form-group">
                      <label class="form-label" style="font-size: 0.7rem;">Kilos a convertir *</label>
                      <input 
                        type="number" 
                        step="0.001" 
                        min="0.001" 
                        :max="itemsToConvert[0].kilos" 
                        v-model="convertForm.kilos" 
                        class="form-control fw-bold" 
                        required 
                      />
                    </div>
                  </div>
                </div>

                <!-- Si son varios productos (Lote) -->
                <div v-else>
                  <label class="form-label" style="font-size: 0.7rem;">Lote de productos a convertir ({{ itemsToConvert.length }})</label>
                  <div style="max-height: 160px; overflow-y: auto; border: 1px solid var(--bevel-dark); border-radius: var(--border-radius-sm); margin-bottom: 0.5rem; background: var(--bg-window); box-shadow: var(--inset-shadow);">
                    <table style="width: 100%; font-size: 0.75rem; border-collapse: collapse;">
                      <thead>
                        <tr style="background: var(--bg-secondary); border-bottom: 1px solid var(--bevel-dark); position: sticky; top: 0; z-index: 1;">
                          <th style="padding: 4px; text-align: left;">Código</th>
                          <th style="padding: 4px; text-align: left;">Nombre</th>
                          <th style="padding: 4px; text-align: right;">Kilos</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="item in itemsToConvert" :key="item.codigo" style="border-bottom: 1px solid var(--bg-secondary);">
                          <td style="padding: 4px; font-weight: bold;">{{ item.codigo }}</td>
                          <td style="padding: 4px; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ item.nombre }}</td>
                          <td style="padding: 4px; text-align: right; color: var(--accent-success); font-weight: bold;">{{ item.kilos.toFixed(3) }} kg</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div class="form-group">
                    <label class="form-label" style="font-size: 0.7rem;">Total Kilos a Convertir</label>
                    <input type="text" :value="`${totalKilosToConvert.toFixed(3)} kg`" class="form-control fw-bold text-green" disabled />
                  </div>
                </div>

                <!-- Número de Comprobante obligatorio -->
                <div class="form-group">
                  <label class="form-label font-bold" style="font-size: 0.75rem;">Número de Comprobante *</label>
                  <input 
                    type="text" 
                    v-model="convertForm.comprobante" 
                    placeholder="Ej: C-0001-4567" 
                    class="form-control" 
                    required 
                  />
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="closeConvertModal">
                <i class="ph ph-x"></i> Cancelar
              </button>
              <button type="submit" class="btn btn-primary" style="background-color: var(--accent-success);" :disabled="savingConvert || !convertForm.comprobante.trim()">
                <i class="ph ph-spinner spinner" v-if="savingConvert"></i>
                <i class="ph ph-arrows-left-right" v-else></i>
                {{ savingConvert ? 'Convirtiendo...' : (itemsToConvert.length > 1 ? 'Confirmar Conversión Lote' : 'Convertir a Picadas') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
        <div v-if="!loading && filteredAndSortedProductos.length === 0" class="empty-state">
          <i class="ph ph-scissors icon-xl"></i>
          No hay productos con recortes registrados.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()

const data = ref({ Kilos_Totales: '0 kg', productos_con_recortes: [] })
const loading = ref(true)
const alert = ref({ show: false, message: '', type: 'success' })

// Selección por Lote
const selectedItems = ref([])
const selectAll = ref(false)

// Estado conversión
const showConvertModal = ref(false)
const savingConvert = ref(false)
const itemsToConvert = ref([])
const convertForm = ref({ kilos: 0, comprobante: '' })

const searchQuery = ref('')
const sortKey = ref('kilos')
const sortOrder = ref(-1) // Por defecto de mayor a menor cantidad de recortes

const showAlert = (msg, type = 'success') => {
  alert.value = { show: true, message: msg, type }
  setTimeout(() => { alert.value.show = false }, 3500)
}

const fetchRecortes = async () => {
  loading.value = true
  selectedItems.value = []
  selectAll.value = false
  try {
    const res = await fetch('/api/productos/recortes')
    if (res.ok) {
      data.value = await res.json()
    } else {
      showAlert('Error al obtener datos de recortes', 'error')
    }
  } catch (error) {
    console.error('Error fetching recortes:', error)
    showAlert('Error de conexión con el servidor', 'error')
  } finally {
    loading.value = false
  }
}

// Métodos de Selección
const toggleSelectAll = () => {
  if (selectAll.value) {
    selectedItems.value = filteredAndSortedProductos.value.map(p => p.codigo)
  } else {
    selectedItems.value = []
  }
}

const updateSelectAllState = () => {
  const visibleCodes = filteredAndSortedProductos.value.map(p => p.codigo)
  if (visibleCodes.length === 0) {
    selectAll.value = false
    return
  }
  selectAll.value = visibleCodes.every(code => selectedItems.value.includes(code))
}

// Métodos de Conversión
const openConvertModal = (producto) => {
  itemsToConvert.value = [{
    codigo: producto.codigo,
    nombre: producto.nombre,
    kilos: producto.kilos
  }]
  convertForm.value.kilos = producto.kilos // Default all available
  convertForm.value.comprobante = ''
  showConvertModal.value = true
}

const openBulkConvertModal = () => {
  if (selectedItems.value.length === 0) return
  itemsToConvert.value = filteredAndSortedProductos.value
    .filter(p => selectedItems.value.includes(p.codigo))
    .map(p => ({
      codigo: p.codigo,
      nombre: p.nombre,
      kilos: p.kilos
    }))
  convertForm.value.kilos = 0 // No se usa en lote
  convertForm.value.comprobante = ''
  showConvertModal.value = true
}

const closeConvertModal = () => {
  showConvertModal.value = false
  itemsToConvert.value = []
  convertForm.value.kilos = 0
  convertForm.value.comprobante = ''
}

const totalKilosToConvert = computed(() => {
  return itemsToConvert.value.reduce((sum, item) => sum + (parseFloat(item.kilos) || 0), 0)
})

const handleConvert = async () => {
  if (itemsToConvert.value.length === 0) return
  if (!convertForm.value.comprobante.trim()) {
    showAlert('El número de comprobante es obligatorio', 'error')
    return
  }
  
  savingConvert.value = true
  try {
    let payloadItems = []
    if (itemsToConvert.value.length === 1) {
      payloadItems = [{
        codigo: itemsToConvert.value[0].codigo,
        kilos: parseFloat(convertForm.value.kilos)
      }]
    } else {
      payloadItems = itemsToConvert.value.map(item => ({
        codigo: item.codigo,
        kilos: parseFloat(item.kilos)
      }))
    }

    const res = await fetch('/api/productos/convertir-recorte', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        items: payloadItems,
        comprobante: convertForm.value.comprobante.trim(),
        usuario: authStore.user?.nombre || 'Sistema'
      })
    })

    const result = await res.json()

    if (res.ok) {
      const msg = itemsToConvert.value.length === 1
        ? `Conversión exitosa: se crearon picadas desde ${itemsToConvert.value[0].nombre}`
        : `Conversión de lote exitosa: se procesaron ${itemsToConvert.value.length} productos`
      showAlert(msg)
      closeConvertModal()
      fetchRecortes()
    } else {
      showAlert(result.error || result.mensaje || 'Error al procesar la conversión', 'error')
    }
  } catch (error) {
    console.error('Error converting:', error)
    showAlert('Error de conexión con el servidor', 'error')
  } finally {
    savingConvert.value = false
  }
}

// Búsqueda y Ordenación Reactiva
const filteredAndSortedProductos = computed(() => {
  let result = [...(data.value.productos_con_recortes || [])]

  // Búsqueda
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    result = result.filter(p => {
      const codigoMatch = p.codigo ? p.codigo.toString().toLowerCase().includes(query) : false
      const nombreMatch = p.nombre ? p.nombre.toLowerCase().includes(query) : false
      return codigoMatch || nombreMatch
    })
  }

  // Ordenación
  if (sortKey.value) {
    result.sort((a, b) => {
      let valA = a[sortKey.value]
      let valB = b[sortKey.value]

      if (valA === undefined || valA === null) valA = 0
      if (valB === undefined || valB === null) valB = 0

      const isNumeric = !isNaN(parseFloat(valA)) && isFinite(valA) && !isNaN(parseFloat(valB)) && isFinite(valB)

      if (isNumeric) {
        return (parseFloat(valA) - parseFloat(valB)) * sortOrder.value
      } else {
        return valA.toString().localeCompare(valB.toString(), undefined, { numeric: true }) * sortOrder.value
      }
    })
  }

  return result
})

const sortBy = (key) => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value * -1
  } else {
    sortKey.value = key
    sortOrder.value = 1
  }
}

onMounted(() => {
  fetchRecortes()
})
</script>

<style scoped>
.grid-summary {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.5rem;
}

@media (min-width: 768px) {
  .grid-summary {
    grid-template-columns: 12fr;
  }
}

.summary-card {
  margin-bottom: 0;
}

.summary-content {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding: 1rem 1.5rem;
  background: var(--bg-secondary);
}

.summary-icon-box {
  width: 48px;
  height: 48px;
  background: var(--bg-window);
  border: 1px solid var(--bg-tertiary);
  box-shadow: var(--inset-shadow);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  border-radius: var(--border-radius-md);
}

.summary-details {
  display: flex;
  flex-direction: column;
}

.summary-label {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.summary-value {
  font-size: 2rem;
  font-weight: 800;
  line-height: 1.1;
  margin-top: 0.15rem;
}

th.sortable {
  cursor: pointer;
  user-select: none;
}

th.sortable:hover {
  background-color: var(--accent-primary-hover);
}

th i {
  margin-left: 0.25rem;
  font-size: 0.8rem;
  vertical-align: middle;
}
tr.selected-row {
  background-color: rgba(16, 185, 129, 0.08); /* Soft green for selected recortes */
}
</style>
