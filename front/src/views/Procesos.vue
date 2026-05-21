<template>
  <div class="page-container animate-fade">
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title">Gestión de Procesos</h2>
        <p class="page-description">Registra y administra los procesos generales (Fraccionamiento, Envasado, Picada, Decomisos).</p>
      </div>
      <div class="header-actions mt-2" style="display: flex; gap: 0.5rem;">
        <button class="btn btn-secondary" @click="fetchInitialData" :disabled="loadingData">
          <i class="ph ph-spinner spinner" v-if="loadingData"></i>
          <i class="ph ph-arrows-clockwise" v-else></i> Actualizar Procesos
        </button>
        <button class="btn btn-primary" @click="openModal()">
          <i class="ph ph-plus"></i> Nuevo Proceso
        </button>
      </div>
    </div>

    <!-- Alertas -->
    <div v-if="alert.show" :class="['alert-box mb-4', alert.type]">
      {{ alert.message }}
    </div>

    <!-- HISTORIAL: LISTADO DE PROCESOS -->
    <div class="card">
      <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
        <span class="card-title" style="color: white; font-weight: bold;">Historial de Procesos</span>
        <div style="display: flex; align-items: center; gap: 0.3rem; background: var(--bg-window); padding: 0.1rem 0.3rem; box-shadow: var(--inset-shadow); height: 26px;">
          <i class="ph ph-magnifying-glass" style="color: var(--text-secondary); font-size: 0.8rem;"></i>
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="Buscar proceso..." 
            style="border: none; outline: none; font-size: 0.85rem; background: transparent; width: 140px; color: var(--text-primary);"
          />
          <button v-if="searchQuery" @click="searchQuery = ''" style="background: none; border: none; cursor: pointer; color: var(--text-muted); display: flex; align-items: center;">
            <i class="ph ph-x-circle"></i>
          </button>
        </div>
      </div>

      <div class="table-container" style="max-height: 520px; overflow-y: auto;">
        <table v-if="!loadingData && filteredAndSortedProcesos.length > 0">
          <thead>
            <tr>
              <th @click="sortBy('id')" class="sortable">ID <i v-if="sortKey === 'id'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i></th>
              <th @click="sortBy('fecha')" class="sortable">Fecha <i v-if="sortKey === 'fecha'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i></th>
              <th @click="sortBy('proceso')" class="sortable">Proceso <i v-if="sortKey === 'proceso'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i></th>
              <th @click="sortBy('colaborador')" class="sortable">Colaborador <i v-if="sortKey === 'colaborador'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i></th>
              <th>Producto</th>
              <th class="text-right">Detalles</th>
              <th class="text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in filteredAndSortedProcesos" :key="p.id">
              <td><strong>{{ p.id }}</strong></td>
              <td>{{ formatDate(p.fecha) }}</td>
              <td>
                <span :class="['badge', getBadgeType(p.proceso)]">{{ p.proceso }}</span>
              </td>
              <td>{{ p.Colaborador?.nombre || p.colaborador || 'Sin Colaborador' }}</td>
              <td>
                <span class="text-xs" :title="p.codigo">
                  <strong>{{ p.codigo }}</strong> - {{ p.Producto?.nombre || 'Desconocido' }}
                </span>
              </td>
              <td class="text-right" style="font-size: 0.75rem; white-space: nowrap; line-height: 1.3;">
                <div>Pzs: {{ p.piezas }} | Bruto: {{ parseFloat(p.peso_bruto).toFixed(3) }} kg</div>
                <div class="text-muted">Rec: {{ parseFloat(p.recorte).toFixed(3) }} | Dec: {{ parseFloat(p.decomiso).toFixed(3) }}</div>
                <div class="text-blue">Desc: {{ parseFloat(p.kg_a_desc).toFixed(3) }} | Sum: {{ parseFloat(p.kg_a_sumar).toFixed(3) }}</div>
              </td>
              <td>
                <div style="display: flex; gap: 0.25rem; justify-content: center;">
                  <button class="icon-btn" title="Editar" @click="openModal(p)">
                    <i class="ph ph-pencil-simple text-blue"></i>
                  </button>
                  <button class="icon-btn" title="Eliminar" @click="confirmDelete(p)">
                    <i class="ph ph-trash text-red"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Cargando -->
        <div v-if="loadingData" class="loading-state">
          <i class="ph ph-spinner spinner icon-xl"></i>
          Cargando historial de procesos...
        </div>

        <!-- Historial Vacío -->
        <div v-if="!loadingData && filteredAndSortedProcesos.length === 0" class="empty-state">
          <i class="ph ph-arrows-clockwise icon-xl"></i>
          No se encontraron procesos registrados.
        </div>
      </div>
    </div>


    <!-- Modal Formulario -->
    <Teleport to="body">
      <div v-if="showModal" class="modal-overlay" @mousedown.self="closeModal">
        <div class="modal-card" style="max-width: 500px;">
          <div class="modal-header" :style="isEditing ? 'background-color: var(--accent-orange);' : ''">
            <h3 class="modal-title" style="color: white; font-weight: bold;">
              {{ isEditing ? 'Editar Proceso #' + editId : 'Registrar Nuevo Proceso' }}
            </h3>
            <button class="icon-btn" style="color: white;" @click="closeModal"><i class="ph ph-x"></i></button>
          </div>
          <form @submit.prevent="submitForm">
            <div class="modal-body" style="display: flex; flex-direction: column; gap: 0.75rem;">
              
              <div class="form-group">
                <label class="form-label">Colaborador *</label>
                <select v-model="form.colaborador_id" class="form-control" required style="padding: 0 0.25rem;">
                  <option :value="null" disabled>Seleccione un colaborador</option>
                  <option v-for="c in colaboradores" :key="c.id" :value="c.id">
                    {{ c.nombre }}
                  </option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Tipo de Proceso *</label>
                <select v-model="form.proceso" class="form-control" required style="padding: 0 0.25rem;">
                  <option value="Fraccionamiento">Fraccionamiento</option>
                  <option value="Envasado">Envasado</option>
                  <option value="Picada">Picada</option>
                  <option value="Decomiso Directo">Decomiso Directo</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Fecha del Proceso</label>
                <input type="date" v-model="form.fecha" class="form-control" />
              </div>

              <!-- Selector Autocomplete de Producto -->
              <div class="form-group">
                <label class="form-label">Producto Asociado *</label>
                <div style="position: relative; display: flex; align-items: center;">
                  <i class="ph ph-magnifying-glass" style="position: absolute; left: 0.6rem; color: var(--text-muted); pointer-events: none;"></i>
                  <input 
                    type="text" 
                    v-model="productSearch" 
                    list="catalog-products-list-main" 
                    @input="handleProductInput" 
                    class="form-control" 
                    placeholder="Escribe código o nombre para buscar..." 
                    required 
                    style="padding-left: 2rem; height: 32px;"
                  />
                </div>
                <datalist id="catalog-products-list-main">
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
                  v-if="selectedMainProduct" 
                  class="selected-product-badge mt-2 animate-fade"
                  style="display: flex; align-items: center; gap: 0.5rem; padding: 0.4rem 0.6rem; background-color: var(--accent-success-light); border: 1px solid var(--accent-success); font-size: 0.8rem; color: var(--text-primary);"
                >
                  <i class="ph ph-circle-wavy-check text-green" style="font-size: 1rem;"></i>
                  <span>
                    Seleccionado: <strong>{{ selectedMainProduct.nombre }}</strong>
                  </span>
                </div>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
                <div class="form-group">
                  <label class="form-label">Piezas</label>
                  <input type="number" min="0" v-model.number="form.piezas" class="form-control" />
                </div>

                <div class="form-group">
                  <label class="form-label">Peso Bruto (kg)</label>
                  <input type="number" step="0.001" min="0" v-model.number="form.peso_bruto" class="form-control" />
                </div>

                <div class="form-group">
                  <label class="form-label">Recorte (kg)</label>
                  <input type="number" step="0.001" min="0" v-model.number="form.recorte" class="form-control" />
                </div>

                <div class="form-group">
                  <label class="form-label">Decomiso (kg)</label>
                  <input type="number" step="0.001" min="0" v-model.number="form.decomiso" class="form-control" />
                </div>

                <div class="form-group">
                  <label class="form-label">Kg a Descontar</label>
                  <input type="number" step="0.001" v-model.number="form.kg_a_desc" class="form-control" disabled />
                </div>

                <div class="form-group">
                  <label class="form-label">Kg a Sumar</label>
                  <input type="number" step="0.001" min="0" v-model.number="form.kg_a_sumar" class="form-control" />
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="closeModal">
                Cancelar
              </button>
              <button type="submit" class="btn btn-primary" :disabled="submitting">
                <i class="ph ph-spinner spinner" v-if="submitting"></i>
                <i class="ph ph-floppy-disk" v-else></i>
                {{ submitting ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Registrar') }}
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
              ¿Estás seguro de que deseas eliminar el registro de proceso de <strong>{{ itemToDelete.proceso }}</strong> del colaborador <strong>{{ itemToDelete.colaborador }}</strong>?<br><br>Esta acción no se puede deshacer.
            </p>
          </div>
          <div class="win-dialog-footer">
            <button class="win-dialog-btn win-dialog-btn-ok" @click="deleteItem">Sí</button>
            <button class="win-dialog-btn" @click="itemToDelete = null">No</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()

// Datos
const procesos = ref([])
const productos = ref([])
const colaboradores = ref([])
const loadingData = ref(true)
const submitting = ref(false)
const isEditing = ref(false)
const editId = ref(null)
const itemToDelete = ref(null)
const showModal = ref(false)

const alert = ref({ show: false, message: '', type: 'success' })

const openModal = (proceso = null) => {
  if (proceso) {
    loadProcesoToForm(proceso)
  } else {
    resetForm()
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  resetForm()
}

// Formulario Procesos Generales
const getTodayString = () => new Date().toISOString().split('T')[0]

const defaultForm = {
  colaborador_id: null,
  proceso: 'Fraccionamiento',
  fecha: getTodayString(),
  codigo: '',
  piezas: 0,
  peso_bruto: 0,
  recorte: 0,
  decomiso: 0,
  kg_a_desc: 0,
  kg_a_sumar: 0
}

const form = ref({ ...defaultForm })

// Autocomplete Preselección (Nueva Lógica)
const productSearch = ref('')
const selectedMainProduct = ref(null)

const handleProductInput = () => {
  const code = productSearch.value.trim()
  const found = productos.value.find(p => p.codigo === code)
  if (found) {
    selectedMainProduct.value = found
    form.value.codigo = found.codigo
  } else {
    selectedMainProduct.value = null
    form.value.codigo = ''
  }
}

// Watcher para calcular automáticamente "Kg a Descontar" = peso_bruto - (decomiso + recorte)
watch(
  () => [form.value.peso_bruto, form.value.decomiso, form.value.recorte],
  ([bruto, decomiso, recorte]) => {
    const valBruto = parseFloat(bruto) || 0
    const valDecomiso = parseFloat(decomiso) || 0
    const valRecorte = parseFloat(recorte) || 0
    const calc = valBruto - (valDecomiso + valRecorte)
    form.value.kg_a_desc = parseFloat(calc.toFixed(3))
  }
)

// Búsqueda y Ordenación
const searchQuery = ref('')
const sortKey = ref('id')
const sortOrder = ref(-1) // Más reciente primero

const showAlert = (msg, type = 'success') => {
  alert.value = { show: true, message: msg, type }
  setTimeout(() => { alert.value.show = false }, 3500)
}

const fetchColaboradores = async () => {
  try {
    const res = await fetch('/api/colaboradores')
    if (res.ok) {
      colaboradores.value = await res.json()
      if (colaboradores.value.length > 0 && !form.value.colaborador_id && !isEditing.value) {
        const userMatched = colaboradores.value.find(c => c.nombre.toLowerCase() === (authStore.user?.usuario || '').toLowerCase())
        form.value.colaborador_id = userMatched ? userMatched.id : colaboradores.value[0].id
      }
    }
  } catch (error) {
    console.error('Error fetching colaboradores:', error)
  }
}

// Cargar Datos Iniciales de Procesos
const fetchInitialData = async () => {
  loadingData.value = true
  try {
    await fetchColaboradores()
    const resProd = await fetch('/api/productos')
    if (resProd.ok) {
      productos.value = await resProd.json()
    }
    const resProc = await fetch('/api/procesos')
    if (resProc.ok) {
      procesos.value = await resProc.json()
    } else {
      showAlert('Error al cargar historial de procesos', 'error')
    }
  } catch (error) {
    console.error('Error fetching data:', error)
    showAlert('Error de conexión con el servidor', 'error')
  } finally {
    loadingData.value = false
  }
}

// CRUD: PROCESOS GENERALES
const submitForm = async () => {
  if (!form.value.codigo) {
    showAlert('Debe seleccionar un producto válido', 'error')
    return
  }

  submitting.value = true
  const url = isEditing.value ? `/api/procesos/${editId.value}` : '/api/procesos'
  const method = isEditing.value ? 'PUT' : 'POST'

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value)
    })

    const dataRes = await res.json()

    if (res.ok) {
      showAlert(isEditing.value ? 'Proceso actualizado correctamente' : 'Proceso registrado exitosamente')
      closeModal()
      fetchInitialData()
    } else {
      showAlert(dataRes.error || 'Ocurrió un error al procesar la solicitud', 'error')
    }
  } catch (error) {
    console.error('Error saving process:', error)
    showAlert('Error de conexión con el servidor', 'error')
  } finally {
    submitting.value = false
  }
}

const loadProcesoToForm = (proceso) => {
  isEditing.value = true
  editId.value = proceso.id
  
  form.value = {
    colaborador_id: proceso.colaborador_id,
    proceso: proceso.proceso,
    fecha: proceso.fecha ? proceso.fecha.split('T')[0] : getTodayString(),
    codigo: proceso.codigo,
    piezas: proceso.piezas,
    peso_bruto: parseFloat(proceso.peso_bruto),
    recorte: parseFloat(proceso.recorte),
    decomiso: parseFloat(proceso.decomiso),
    kg_a_desc: parseFloat(proceso.kg_a_desc),
    kg_a_sumar: parseFloat(proceso.kg_a_sumar)
  }

  const matched = productos.value.find(p => p.codigo === proceso.codigo)
  productSearch.value = matched ? matched.codigo : proceso.codigo
  selectedMainProduct.value = matched || null
}

const cancelEdit = () => {
  closeModal()
}

const resetForm = () => {
  isEditing.value = false
  editId.value = null
  form.value = { 
    ...defaultForm, 
    fecha: getTodayString() 
  }
  if (colaboradores.value.length > 0) {
    const userMatched = colaboradores.value.find(c => c.nombre.toLowerCase() === (authStore.user?.usuario || '').toLowerCase())
    form.value.colaborador_id = userMatched ? userMatched.id : colaboradores.value[0].id
  }
  productSearch.value = ''
  selectedMainProduct.value = null
}

// ELIMINACIÓN
const confirmDelete = (item) => {
  itemToDelete.value = item
}

const deleteItem = async () => {
  if (!itemToDelete.value) return

  try {
    const res = await fetch(`/api/procesos/${itemToDelete.value.id}`, { method: 'DELETE' })
    if (res.ok) {
      showAlert('Registro de proceso eliminado correctamente')
      fetchInitialData()
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

// Auxiliares y Formateos
const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const parts = dateStr.split('T')[0].split('-')
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`
  }
  return dateStr
}

const getBadgeType = (tipo) => {
  if (tipo === 'Fraccionamiento') return 'badge-primary'
  if (tipo === 'Envasado') return 'badge-success'
  if (tipo === 'Picada') return 'badge-warning'
  if (tipo === 'Decomiso Directo') return 'badge-danger'
  return ''
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
const filteredAndSortedProcesos = computed(() => {
  let result = [...procesos.value]

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    result = result.filter(p => {
      const idMatch = p.id ? p.id.toString().includes(query) : false
      const colabName = p.Colaborador?.nombre || p.colaborador || ''
      const colabMatch = colabName.toLowerCase().includes(query)
      const procMatch = p.proceso ? p.proceso.toLowerCase().includes(query) : false
      const codMatch = p.codigo ? p.codigo.toLowerCase().includes(query) : false
      const prodNameMatch = p.Producto?.nombre ? p.Producto.nombre.toLowerCase().includes(query) : false
      return idMatch || colabMatch || procMatch || codMatch || prodNameMatch
    })
  }

  if (sortKey.value) {
    result.sort((a, b) => {
      let valA = a[sortKey.value]
      let valB = b[sortKey.value]

      if (sortKey.value === 'colaborador') {
        valA = a.Colaborador?.nombre || a.colaborador || ''
        valB = b.Colaborador?.nombre || b.colaborador || ''
      }

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
  fetchInitialData()
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
