<template>
  <div class="page-container animate-fade">
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title">Gestión de Decomisos</h2>
        <p class="page-description">Visualiza y descarta mermas permanentes de productos (decomisos).</p>
      </div>
      <div class="header-actions mt-2">
        <button class="btn btn-secondary" @click="fetchDecomisos" :disabled="loading">
          <i class="ph ph-spinner spinner" v-if="loading"></i>
          <i class="ph ph-arrows-clockwise" v-else></i> Actualizar Datos
        </button>
      </div>
    </div>

    <!-- Indicador de Kilos Totales -->
    <div class="grid-summary mb-4" v-if="!loading">
      <div class="card summary-card">
        <div class="card-header" style="background-color: var(--accent-orange);">
          <span class="card-title">Resumen de Decomisos</span>
        </div>
        <div class="summary-content">
          <div class="summary-icon-box">
            <i class="ph ph-trash text-red"></i>
          </div>
          <div class="summary-details">
            <span class="summary-label">Kilos Totales en Decomiso</span>
            <h1 class="summary-value text-red">{{ data.Kilos_Totales || '0 kg' }}</h1>
          </div>
        </div>
      </div>
    </div>

    <!-- Mensajes de estado -->
    <div v-if="alert.show" :class="['alert-box mb-4', alert.type]">
      {{ alert.message }}
    </div>

    <!-- Tabla de Productos con Decomisos -->
    <div class="card">
      <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
        <span class="card-title">Productos en Decomiso (> 0 kg)</span>
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
              <th @click="sortBy('codigo')" class="sortable">
                Código 
                <i v-if="sortKey === 'codigo'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i>
              </th>
              <th @click="sortBy('nombre')" class="sortable">
                Nombre del Producto 
                <i v-if="sortKey === 'nombre'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i>
              </th>
              <th @click="sortBy('kilos')" class="sortable text-right">
                Kilos Decomiso 
                <i v-if="sortKey === 'kilos'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i>
              </th>
              <th class="text-center" style="width: 120px;">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in filteredAndSortedProductos" :key="p.codigo">
              <td><strong>{{ p.codigo }}</strong></td>
              <td>{{ p.nombre }}</td>
              <td class="text-right fw-bold text-red">{{ p.kilos.toFixed(3) }} kg</td>
              <td>
                <div style="display: flex; gap: 0.25rem; justify-content: center;">
                  <button class="btn btn-secondary text-red" style="min-height: 24px; padding: 0.1rem 0.5rem; font-size: 0.75rem;" title="Descontar de BBDD" @click="openDiscountModal(p)">
                    <i class="ph ph-minus-circle"></i> Descontar
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Carga -->
        <div v-if="loading" class="loading-state">
          <i class="ph ph-spinner spinner icon-xl"></i>
          Cargando decomisos...
        </div>

        <!-- Vacío -->
        <div v-if="!loading && filteredAndSortedProductos.length === 0" class="empty-state">
          <i class="ph ph-trash icon-xl"></i>
          No hay productos con decomisos registrados.
        </div>
      </div>
    </div>

    <!-- Modal Descontar Decomiso -->
    <Teleport to="body">
      <div v-if="showDiscountModal" class="modal-overlay" @mousedown.self="closeDiscountModal">
        <div class="modal-card" style="max-width: 380px;">
          <div class="modal-header" style="background: var(--accent-danger);">
            <h3 class="modal-title">Descontar Decomiso</h3>
            <button class="icon-btn" @click="closeDiscountModal"><i class="ph ph-x"></i></button>
          </div>
          <form @submit.prevent="handleDiscount">
            <div class="modal-body">
              <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                <div class="alert-box error" style="border-left-width: 4px; padding: 0.4rem; font-size: 0.75rem;">
                  <strong>Advertencia:</strong> Esta acción restará la cantidad especificada de decomiso permanentemente. Este stock no se sumará a ningún otro producto.
                </div>
                
                <div class="form-group">
                  <label class="form-label" style="font-size: 0.7rem;">Producto</label>
                  <input type="text" :value="`[${selectedProduct.codigo}] ${selectedProduct.nombre}`" class="form-control" disabled />
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
                  <div class="form-group">
                    <label class="form-label" style="font-size: 0.7rem;">Stock Decomiso</label>
                    <input type="text" :value="`${selectedProduct.kilos.toFixed(3)} kg`" class="form-control" disabled />
                  </div>

                  <div class="form-group">
                    <label class="form-label" style="font-size: 0.7rem;">Kilos a descartar *</label>
                    <input 
                      type="number" 
                      step="0.001" 
                      min="0.001" 
                      :max="selectedProduct.kilos" 
                      v-model="discountForm.kilos" 
                      class="form-control fw-bold" 
                      required 
                    />
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="closeDiscountModal">
                <i class="ph ph-x"></i> Cancelar
              </button>
              <button type="submit" class="btn btn-primary" style="background-color: var(--accent-danger);" :disabled="savingDiscount">
                <i class="ph ph-spinner spinner" v-if="savingDiscount"></i>
                <i class="ph ph-trash" v-else></i>
                {{ savingDiscount ? 'Descontando...' : 'Descartar Decomiso' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const data = ref({ Kilos_Totales: '0 kg', productos_con_decomisos: [] })
const loading = ref(true)
const alert = ref({ show: false, message: '', type: 'success' })

// Estado Modal Descuento
const showDiscountModal = ref(false)
const savingDiscount = ref(false)
const selectedProduct = ref(null)
const discountForm = ref({ kilos: 0 })

const searchQuery = ref('')
const sortKey = ref('kilos')
const sortOrder = ref(-1) // Mayor a menor decomiso

const showAlert = (msg, type = 'success') => {
  alert.value = { show: true, message: msg, type }
  setTimeout(() => { alert.value.show = false }, 3000)
}

const fetchDecomisos = async () => {
  loading.value = true
  try {
    const res = await fetch('/api/productos/decomisos')
    if (res.ok) {
      data.value = await res.json()
    } else {
      showAlert('Error al obtener datos de decomisos', 'error')
    }
  } catch (error) {
    console.error('Error fetching decomisos:', error)
    showAlert('Error de conexión con el servidor', 'error')
  } finally {
    loading.value = false
  }
}

// Métodos de Descuento
const openDiscountModal = (producto) => {
  selectedProduct.value = producto
  discountForm.value.kilos = producto.kilos // Pre-cargar todo el decomiso disponible
  showDiscountModal.value = true
}

const closeDiscountModal = () => {
  showDiscountModal.value = false
  selectedProduct.value = null
  discountForm.value.kilos = 0
}

const handleDiscount = async () => {
  if (!selectedProduct.value || discountForm.value.kilos <= 0) return

  savingDiscount.value = true
  try {
    const res = await fetch('/api/productos/descontar-decomiso', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        codigo: selectedProduct.value.codigo,
        kilos: parseFloat(discountForm.value.kilos)
      })
    })

    const result = await res.json()

    if (res.ok) {
      showAlert(`Descarte exitoso: se restaron ${parseFloat(discountForm.value.kilos).toFixed(3)} kg de decomiso`)
      closeDiscountModal()
      fetchDecomisos()
    } else {
      showAlert(result.error || result.mensaje || 'Error al descontar el decomiso', 'error')
    }
  } catch (error) {
    console.error('Error discounting decomiso:', error)
    showAlert('Error de conexión con el servidor', 'error')
  } finally {
    savingDiscount.value = false
  }
}

// Búsqueda y Ordenación Reactiva
const filteredAndSortedProductos = computed(() => {
  let result = [...(data.value.productos_con_decomisos || [])]

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
  fetchDecomisos()
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
  border-radius: 0;
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
</style>
