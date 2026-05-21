<template>
  <div class="page-container animate-fade">
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title">Conversión de Fraccionados</h2>
        <p class="page-description">Administra las plantillas de conversión y procesa la división de productos fraccionados en stock.</p>
      </div>
      <div class="header-actions mt-2" style="display: flex; gap: 0.5rem;">
        <button class="btn btn-secondary" @click="fetchFraccionados" :disabled="loadingFraccionados">
          <i class="ph ph-spinner spinner" v-if="loadingFraccionados"></i>
          <i class="ph ph-arrows-clockwise" v-else></i> Actualizar Conversiones
        </button>
        <button class="btn btn-primary" @click="openModal()">
          <i class="ph ph-plus"></i> Nueva Conversión
        </button>
      </div>
    </div>

    <!-- Alertas -->
    <div v-if="alert.show" :class="['alert-box mb-4', alert.type]">
      {{ alert.message }}
    </div>

    <!-- HISTORIAL: LISTADO DE FRACCIONADOS -->
    <div class="card">
      <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; background-color: #38761d;">
        <span class="card-title" style="color: white; font-weight: bold;">Historial de Conversiones (Fraccionados)</span>
        <div style="display: flex; align-items: center; gap: 0.3rem; background: var(--bg-window); padding: 0.1rem 0.3rem; box-shadow: var(--inset-shadow); height: 26px;">
          <i class="ph ph-magnifying-glass" style="color: var(--text-secondary); font-size: 0.8rem;"></i>
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="Buscar conversión..." 
            style="border: none; outline: none; font-size: 0.85rem; background: transparent; width: 140px; color: var(--text-primary);"
          />
          <button v-if="searchQuery" @click="searchQuery = ''" style="background: none; border: none; cursor: pointer; color: var(--text-muted); display: flex; align-items: center;">
            <i class="ph ph-x-circle"></i>
          </button>
        </div>
      </div>

      <div class="table-container" style="max-height: 520px; overflow-y: auto;">
        <table v-if="!loadingFraccionados && filteredAndSortedFraccionados.length > 0">
          <thead>
            <tr>
              <th @click="sortBy('id')" class="sortable">ID <i v-if="sortKey === 'id'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i></th>
              <th>Producto Original (Origen)</th>
              <th @click="sortBy('peso_a_descontar')" class="sortable text-right">Peso a Descontar <i v-if="sortKey === 'peso_a_descontar'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i></th>
              <th @click="sortBy('peso_a_fraccionar')" class="sortable text-right">Peso a Fraccionar <i v-if="sortKey === 'peso_a_fraccionar'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i></th>
              <th>Producto Fraccionado (Destino)</th>
              <th class="text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="f in filteredAndSortedFraccionados" :key="f.id">
              <td><strong>{{ f.id }}</strong></td>
              <td>
                <span class="fw-bold">{{ f.codigo_producto_original }}</span>
                <div class="text-muted text-xs">{{ f.ProductoOriginal?.nombre || 'Desconocido' }}</div>
              </td>
              <td class="text-right fw-bold text-red">{{ parseFloat(f.peso_a_descontar).toFixed(3) }} kg</td>
              <td class="text-right fw-bold text-blue">{{ parseFloat(f.peso_a_fraccionar).toFixed(3) }} kg</td>
              <td>
                <span class="fw-bold">{{ f.codigo_fraccionado }}</span>
                <div class="text-muted text-xs text-green">{{ f.ProductoFraccionado?.nombre || 'Desconocido' }}</div>
              </td>
              <td>
                <div style="display: flex; gap: 0.35rem; justify-content: center; align-items: center;">
                  <button 
                    class="btn btn-secondary text-green" 
                    style="min-height: 24px; padding: 0.1rem 0.5rem; font-size: 0.7rem; display: flex; align-items: center; gap: 0.2rem;" 
                    title="Procesar Conversión" 
                    @click="confirmProcesar(f)"
                    :disabled="parseFloat(f.peso_a_fraccionar) <= 0"
                  >
                    <i class="ph ph-gear"></i> Procesar
                  </button>
                  <button class="icon-btn" title="Editar" @click="openModal(f)">
                    <i class="ph ph-pencil-simple text-blue"></i>
                  </button>
                  <button class="icon-btn" title="Eliminar" @click="confirmDelete(f)">
                    <i class="ph ph-trash text-red"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Cargando -->
        <div v-if="loadingFraccionados" class="loading-state">
          <i class="ph ph-spinner spinner icon-xl"></i>
          Cargando historial de conversiones...
        </div>

        <!-- Historial Vacío -->
        <div v-if="!loadingFraccionados && filteredAndSortedFraccionados.length === 0" class="empty-state">
          <i class="ph ph-arrows-left-right icon-xl"></i>
          No se encontraron conversiones registradas.
        </div>
      </div>
    </div>

    <!-- Modal Formulario -->
    <Teleport to="body">
      <div v-if="showModal" class="modal-overlay" @mousedown.self="closeModal">
        <div class="modal-card" style="max-width: 500px;">
          <div class="modal-header" :style="isEditingFraccionado ? 'background-color: var(--accent-orange);' : 'background-color: var(--accent-success);'">
            <h3 class="modal-title" style="color: white; font-weight: bold;">
              {{ isEditingFraccionado ? 'Editar Conversión #' + editFraccionadoId : 'Nueva Conversión (Fraccionados)' }}
            </h3>
            <button class="icon-btn" style="color: white;" @click="closeModal"><i class="ph ph-x"></i></button>
          </div>
          <form @submit.prevent="submitFraccionadoForm">
            <div class="modal-body" style="display: flex; flex-direction: column; gap: 0.75rem;">
              
              <!-- Producto Original -->
              <div class="form-group">
                <label class="form-label">Producto Original (Origen) *</label>
                <div style="position: relative; display: flex; align-items: center;">
                  <i class="ph ph-magnifying-glass" style="position: absolute; left: 0.6rem; color: var(--text-muted); pointer-events: none;"></i>
                  <input 
                    type="text" 
                    v-model="origSearchQuery" 
                    list="catalog-products-list-orig" 
                    @input="handleOrigProductInput" 
                    class="form-control" 
                    placeholder="Escribe código o nombre para buscar..." 
                    required 
                    style="padding-left: 2rem; height: 32px;"
                  />
                </div>
                <datalist id="catalog-products-list-orig">
                  <option 
                    v-for="p in productos" 
                    :key="p.codigo" 
                    :value="p.codigo"
                  >
                    {{ p.nombre }}
                  </option>
                </datalist>
                
                <!-- Vista previa del producto seleccionado -->
                <div 
                  v-if="selectedOrigProduct" 
                  class="selected-product-badge mt-2 animate-fade"
                  style="display: flex; align-items: center; gap: 0.5rem; padding: 0.4rem 0.6rem; background-color: var(--accent-success-light); border: 1px solid var(--accent-success); font-size: 0.8rem; color: var(--text-primary);"
                >
                  <i class="ph ph-circle-wavy-check text-green" style="font-size: 1rem;"></i>
                  <span>
                    Seleccionado: <strong>{{ selectedOrigProduct.nombre }}</strong>
                  </span>
                </div>
              </div>

              <!-- Pesos y Conversión -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
                <div class="form-group">
                  <label class="form-label">Peso a Descontar (kg) *</label>
                  <input 
                    type="number" 
                    step="0.001" 
                    min="0" 
                    v-model.number="fraccionadoForm.peso_a_descontar" 
                    class="form-control fw-bold text-red" 
                    required 
                  />
                </div>

                <div class="form-group">
                  <label class="form-label">Peso a Fraccionar (kg) *</label>
                  <input 
                    type="number" 
                    step="0.001" 
                    min="0" 
                    v-model.number="fraccionadoForm.peso_a_fraccionar" 
                    class="form-control fw-bold text-blue" 
                    required 
                  />
                </div>
              </div>

              <!-- Producto Fraccionado Resultante -->
              <div class="form-group">
                <label class="form-label">Producto Fraccionado (Destino) *</label>
                <div style="position: relative; display: flex; align-items: center;">
                  <i class="ph ph-magnifying-glass" style="position: absolute; left: 0.6rem; color: var(--text-muted); pointer-events: none;"></i>
                  <input 
                    type="text" 
                    v-model="destSearchQuery" 
                    list="catalog-products-list-dest" 
                    @input="handleDestProductInput" 
                    class="form-control" 
                    placeholder="Escribe código o nombre para buscar..." 
                    required 
                    style="padding-left: 2rem; height: 32px;"
                  />
                </div>
                <datalist id="catalog-products-list-dest">
                  <option 
                    v-for="p in productos" 
                    :key="p.codigo" 
                    :value="p.codigo"
                  >
                    {{ p.nombre }}
                  </option>
                </datalist>
                
                <!-- Vista previa del producto seleccionado -->
                <div 
                  v-if="selectedDestProduct" 
                  class="selected-product-badge mt-2 animate-fade"
                  style="display: flex; align-items: center; gap: 0.5rem; padding: 0.4rem 0.6rem; background-color: var(--accent-success-light); border: 1px solid var(--accent-success); font-size: 0.8rem; color: var(--text-primary);"
                >
                  <i class="ph ph-circle-wavy-check text-green" style="font-size: 1rem;"></i>
                  <span>
                    Seleccionado: <strong>{{ selectedDestProduct.nombre }}</strong>
                  </span>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="closeModal">
                Cancelar
              </button>
              <button type="submit" class="btn btn-primary" style="background-color: var(--accent-success); border-color: var(--accent-success-hover);" :disabled="submittingFraccionado">
                <i class="ph ph-spinner spinner" v-if="submittingFraccionado"></i>
                <i class="ph ph-floppy-disk" v-else></i>
                {{ submittingFraccionado ? 'Guardando...' : (isEditingFraccionado ? 'Actualizar' : 'Convertir / Guardar') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Modal Confirmación Eliminar -->
    <Teleport to="body">
      <div v-if="itemToDelete" class="win-dialog-overlay" @mousedown.self="itemToDelete = null">
        <div class="win-dialog">
          <div class="win-dialog-titlebar">
            <span class="win-dialog-titlebar-text">Confirmar Eliminación</span>
            <button class="win-dialog-close" @click="itemToDelete = null"><i class="ph ph-x"></i></button>
          </div>
          <div class="win-dialog-body">
            <i class="ph ph-warning-circle win-dialog-icon text-red"></i>
            <p class="win-dialog-msg">
              ¿Estás seguro de que deseas eliminar el registro de conversión ID #<strong>{{ itemToDelete.id }}</strong> ({{ itemToDelete.codigo_producto_original }} -> {{ itemToDelete.codigo_fraccionado }})?<br><br>Esta acción no se puede deshacer.
            </p>
          </div>
          <div class="win-dialog-footer">
            <button class="win-dialog-btn win-dialog-btn-ok" @click="deleteItem">Sí</button>
            <button class="win-dialog-btn" @click="itemToDelete = null">No</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Modal Confirmación Procesar Conversión -->
    <Teleport to="body">
      <div v-if="itemToProcesar" class="win-dialog-overlay" @mousedown.self="itemToProcesar = null">
        <div class="win-dialog" style="max-width: 420px;">
          <div class="win-dialog-titlebar" style="background: var(--accent-success);">
            <span class="win-dialog-titlebar-text" style="color: white;">Confirmar Procesamiento</span>
            <button class="win-dialog-close" @click="itemToProcesar = null"><i class="ph ph-x"></i></button>
          </div>
          <div class="win-dialog-body">
            <i class="ph ph-gear win-dialog-icon text-green"></i>
            <p class="win-dialog-msg">
              ¿Estás seguro de que deseas procesar la conversión de <strong>{{ parseFloat(itemToProcesar.peso_a_fraccionar).toFixed(3) }} kg</strong>?<br><br>
              Esto sumará los kilos al campo <strong>kg_fraccionados</strong> del producto final <strong>{{ itemToProcesar.ProductoFraccionado?.nombre || itemToProcesar.codigo_fraccionado }}</strong> y restablecerá los pesos acumulados del origen y destino a 0 en esta plantilla.<br><br>
              Esta acción es atómica y no se puede deshacer.
            </p>
          </div>
          <div class="win-dialog-footer">
            <button class="win-dialog-btn win-dialog-btn-ok" style="background-color: var(--accent-success); color: white;" @click="handleProcesar" :disabled="processingFrac">
              <i class="ph ph-spinner spinner" v-if="processingFrac"></i>
              Sí, Procesar
            </button>
            <button class="win-dialog-btn" @click="itemToProcesar = null" :disabled="processingFrac">No</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// Datos
const fraccionados = ref([])
const productos = ref([])
const loadingFraccionados = ref(false)
const submittingFraccionado = ref(false)
const isEditingFraccionado = ref(false)
const editFraccionadoId = ref(null)
const itemToDelete = ref(null)
const itemToProcesar = ref(null)
const processingFrac = ref(false)
const showModal = ref(false)

const alert = ref({ show: false, message: '', type: 'success' })

const openModal = (item = null) => {
  if (item) {
    loadFraccionadoToForm(item)
  } else {
    resetFraccionadoForm()
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  resetFraccionadoForm()
}

// Formulario Conversiones / Fraccionados
const defaultFraccionadoForm = {
  codigo_producto_original: '',
  peso_a_fraccionar: 0,
  codigo_fraccionado: '',
  peso_a_descontar: 0
}

const fraccionadoForm = ref({ ...defaultFraccionadoForm })

// Autocomplete Preselección
const origSearchQuery = ref('')
const selectedOrigProduct = ref(null)

const destSearchQuery = ref('')
const selectedDestProduct = ref(null)

const handleOrigProductInput = () => {
  const code = origSearchQuery.value.trim()
  const found = productos.value.find(p => p.codigo === code)
  if (found) {
    selectedOrigProduct.value = found
    fraccionadoForm.value.codigo_producto_original = found.codigo
  } else {
    selectedOrigProduct.value = null
    fraccionadoForm.value.codigo_producto_original = ''
  }
}

const handleDestProductInput = () => {
  const code = destSearchQuery.value.trim()
  const found = productos.value.find(p => p.codigo === code)
  if (found) {
    selectedDestProduct.value = found
    fraccionadoForm.value.codigo_fraccionado = found.codigo
  } else {
    selectedDestProduct.value = null
    fraccionadoForm.value.codigo_fraccionado = ''
  }
}

// Búsqueda y Ordenación
const searchQuery = ref('')
const sortKey = ref('id')
const sortOrder = ref(-1) // Más reciente primero

const showAlert = (msg, type = 'success') => {
  alert.value = { show: true, message: msg, type }
  setTimeout(() => { alert.value.show = false }, 3500)
}

// Cargar Datos de Conversiones (Fraccionados)
const fetchFraccionados = async () => {
  loadingFraccionados.value = true
  try {
    const resProd = await fetch('/api/productos')
    if (resProd.ok) {
      productos.value = await resProd.json()
    }
    const resFrac = await fetch('/api/fraccionados')
    if (resFrac.ok) {
      fraccionados.value = await resFrac.json()
    } else {
      showAlert('Error al cargar historial de conversiones', 'error')
    }
  } catch (error) {
    console.error('Error fetching fraccionados:', error)
    showAlert('Error de conexión con el servidor', 'error')
  } finally {
    loadingFraccionados.value = false
  }
}

// CRUD: CONVERTIR / FRACCIONADOS
const submitFraccionadoForm = async () => {
  if (!fraccionadoForm.value.codigo_producto_original || !fraccionadoForm.value.codigo_fraccionado) {
    showAlert('Debe completar ambos productos (Origen y Destino)', 'error')
    return
  }

  submittingFraccionado.value = true
  const url = isEditingFraccionado.value ? `/api/fraccionados/${editFraccionadoId.value}` : '/api/fraccionados'
  const method = isEditingFraccionado.value ? 'PUT' : 'POST'

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        codigo_producto_original: fraccionadoForm.value.codigo_producto_original,
        peso_a_fraccionar: parseFloat(fraccionadoForm.value.peso_a_fraccionar) || 0,
        codigo_fraccionado: fraccionadoForm.value.codigo_fraccionado,
        peso_a_descontar: parseFloat(fraccionadoForm.value.peso_a_descontar) || 0
      })
    })

    const dataRes = await res.json()

    if (res.ok) {
      showAlert(isEditingFraccionado.value ? 'Conversión actualizada correctamente' : 'Conversión registrada exitosamente')
      closeModal()
      fetchFraccionados()
    } else {
      showAlert(dataRes.error || dataRes.mensaje || 'Error al guardar la conversión', 'error')
    }
  } catch (error) {
    console.error('Error saving fraccionado:', error)
    showAlert('Error de conexión con el servidor', 'error')
  } finally {
    submittingFraccionado.value = false
  }
}

const loadFraccionadoToForm = (item) => {
  isEditingFraccionado.value = true
  editFraccionadoId.value = item.id

  fraccionadoForm.value = {
    codigo_producto_original: item.codigo_producto_original,
    peso_a_fraccionar: parseFloat(item.peso_a_fraccionar),
    codigo_fraccionado: item.codigo_fraccionado,
    peso_a_descontar: parseFloat(item.peso_a_descontar) || 0
  }

  const matchedOrig = productos.value.find(p => p.codigo === item.codigo_producto_original)
  origSearchQuery.value = matchedOrig ? matchedOrig.codigo : item.codigo_producto_original
  selectedOrigProduct.value = matchedOrig || null

  const matchedDest = productos.value.find(p => p.codigo === item.codigo_fraccionado)
  destSearchQuery.value = matchedDest ? matchedDest.codigo : item.codigo_fraccionado
  selectedDestProduct.value = matchedDest || null
}

const cancelFraccionadoEdit = () => {
  closeModal()
}

const resetFraccionadoForm = () => {
  isEditingFraccionado.value = false
  editFraccionadoId.value = null
  fraccionadoForm.value = { ...defaultFraccionadoForm }
  origSearchQuery.value = ''
  destSearchQuery.value = ''
  selectedOrigProduct.value = null
  selectedDestProduct.value = null
}

// PROCESAMIENTO DE FRACCIONADOS
const confirmProcesar = (item) => {
  itemToProcesar.value = item
}

const handleProcesar = async () => {
  if (!itemToProcesar.value) return

  processingFrac.value = true
  try {
    const res = await fetch(`/api/fraccionados/${itemToProcesar.value.id}/procesar`, {
      method: 'POST'
    })
    const dataRes = await res.json()

    if (res.ok) {
      showAlert(`Fraccionamiento exitoso: Se sumaron ${parseFloat(itemToProcesar.value.peso_a_fraccionar).toFixed(3)} kg al stock fraccionado de ${dataRes.productoDestinoActualizado?.nombre || itemToProcesar.value.codigo_fraccionado}`)
      itemToProcesar.value = null
      fetchFraccionados()
    } else {
      showAlert(dataRes.error || dataRes.mensaje || 'Error al procesar la conversión', 'error')
    }
  } catch (error) {
    console.error('Error processing fraccionado:', error)
    showAlert('Error de conexión con el servidor', 'error')
  } finally {
    processingFrac.value = false
  }
}

// ELIMINACIÓN
const confirmDelete = (item) => {
  itemToDelete.value = item
}

const deleteItem = async () => {
  if (!itemToDelete.value) return

  try {
    const res = await fetch(`/api/fraccionados/${itemToDelete.value.id}`, { method: 'DELETE' })
    if (res.ok) {
      showAlert('Registro de conversión eliminado correctamente')
      fetchFraccionados()
    } else {
      showAlert('No se pudo eliminar el registro', 'error')
    }
  } catch (error) {
    console.error('Error deleting:', error)
    showAlert('Error de conexión', 'error')
  } finally {
    itemToDelete.value = null
  }
}

const sortBy = (key) => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value * -1
  } else {
    sortKey.value = key
    sortOrder.value = 1
  }
}

// Búsqueda y Ordenación Reactiva
const filteredAndSortedFraccionados = computed(() => {
  let result = [...fraccionados.value]

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    result = result.filter(f => {
      const idMatch = f.id ? f.id.toString().includes(query) : false
      const origCodeMatch = f.codigo_producto_original ? f.codigo_producto_original.toLowerCase().includes(query) : false
      const origNameMatch = f.ProductoOriginal?.nombre ? f.ProductoOriginal.nombre.toLowerCase().includes(query) : false
      const destCodeMatch = f.codigo_fraccionado ? f.codigo_fraccionado.toLowerCase().includes(query) : false
      const destNameMatch = f.ProductoFraccionado?.nombre ? f.ProductoFraccionado.nombre.toLowerCase().includes(query) : false
      return idMatch || origCodeMatch || origNameMatch || destCodeMatch || destNameMatch
    })
  }

  if (sortKey.value) {
    result.sort((a, b) => {
      let valA = a[sortKey.value]
      let valB = b[sortKey.value]

      if (valA === undefined || valA === null) valA = ''
      if (valB === undefined || valB === null) valB = ''

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

onMounted(() => {
  fetchFraccionados()
})
</script>

<style scoped>
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
