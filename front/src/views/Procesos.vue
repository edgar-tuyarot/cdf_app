<template>
  <div class="page-container animate-fade">
    <!-- Header de Página -->
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title">Gestión de Procesos</h2>
        <p class="page-description">Registra y administra los procesos generales (Fraccionamiento, Envasado, Picada, Decomisos).</p>
      </div>
      <div class="header-actions mt-2" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
        <button class="btn btn-secondary" @click="fetchInitialData" :disabled="loadingData">
          <i class="ph ph-spinner spinner" v-if="loadingData"></i>
          <i class="ph ph-arrows-clockwise" v-else></i> Actualizar Procesos
        </button>
        <button v-if="!showModal" class="btn btn-primary" @click="openModal()">
          <i class="ph ph-plus"></i> Nuevo Proceso
        </button>
      </div>
    </div>

    <!-- Alertas -->
    <div v-if="alert.show" :class="['alert-box mb-4', alert.type]">
      {{ alert.message }}
    </div>

    <!-- VISTA 1: HISTORIAL DE PROCESOS (Cuando NO estamos creando/editando un proceso) -->
    <div v-if="!showModal" class="card">
      <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; background-color: #0f172a; padding: 0.75rem 1rem;">
        <span class="card-title" style="color: white; font-weight: bold; font-size: 0.95rem;">
          Historial de Procesos
        </span>
        
        <div style="display: flex; align-items: center; gap: 0.85rem; flex-wrap: wrap;">
          <!-- Checkbox Aumentado Ligeramente -->
          <div v-if="isColaborador" style="display: flex; align-items: center; gap: 0.45rem; font-size: 0.85rem; color: white;">
            <input 
              type="checkbox" 
              id="toggle-my-proc" 
              v-model="showOnlyMyProcesos" 
              style="cursor: pointer; width: 18px; height: 18px; accent-color: var(--accent-primary);" 
            />
            <label for="toggle-my-proc" style="cursor: pointer; user-select: none; font-weight: 700;">Ver solo mis procesos</label>
          </div>

          <!-- Cuadro de Búsqueda Aumentado Ligeramente -->
          <div style="display: flex; align-items: center; gap: 0.35rem; background: var(--bg-window); padding: 0.2rem 0.5rem; border: 1.5px solid var(--bevel-dark); height: 34px; min-width: 220px; flex: 1;">
            <i class="ph ph-magnifying-glass" style="color: var(--text-secondary); font-size: 1rem;"></i>
            <input 
              type="text" 
              v-model="searchQuery" 
              placeholder="Buscar por código, producto o id..." 
              style="border: none; outline: none; font-size: 0.88rem; font-weight: 600; background: transparent; width: 100%; color: var(--text-primary);"
            />
            <button v-if="searchQuery" @click="searchQuery = ''" style="background: none; border: none; cursor: pointer; color: var(--text-muted); display: flex; align-items: center;">
              <i class="ph ph-x-circle" style="font-size: 1rem;"></i>
            </button>
          </div>
        </div>
      </div>

      <div class="table-container" style="max-height: 540px; overflow-y: auto;">
        <!-- VISTA DE TABLA (ESCRITORIO) -->
        <table v-if="!loadingData && filteredAndSortedProcesos.length > 0" class="desktop-table access-table">
          <thead>
            <tr>
              <th @click="sortBy('id')" class="sortable">ID <i v-if="sortKey === 'id'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i></th>
              <th @click="sortBy('fecha')" class="sortable">Fecha <i v-if="sortKey === 'fecha'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i></th>
              <th>Producto</th>
              <th @click="sortBy('piezas')" class="sortable text-right">Piezas <i v-if="sortKey === 'piezas'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i></th>
              <th @click="sortBy('peso_bruto')" class="sortable text-right">Bruto (kg) <i v-if="sortKey === 'peso_bruto'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i></th>
              <th @click="sortBy('recorte')" class="sortable text-right">Recorte (kg) <i v-if="sortKey === 'recorte'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i></th>
              <th @click="sortBy('decomiso')" class="sortable text-right">Decomiso (kg) <i v-if="sortKey === 'decomiso'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i></th>
              <th @click="sortBy('kg_a_desc')" class="sortable text-right">Descontar (kg) <i v-if="sortKey === 'kg_a_desc'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i></th>
              <th @click="sortBy('kg_a_sumar')" class="sortable text-right">Sumar (kg) <i v-if="sortKey === 'kg_a_sumar'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in filteredAndSortedProcesos" :key="p.id" @click="openModal(p)" style="cursor: pointer;">
              <td><strong>{{ p.id }}</strong></td>
              <td>{{ formatDate(p.fecha) }}</td>
              <td>
                <span class="text-xs" :title="p.codigo">
                  <strong>{{ p.codigo }}</strong> - {{ p.Producto?.nombre || 'Desconocido' }}
                </span>
              </td>
              <td class="text-right"><strong>{{ p.piezas }}</strong></td>
              <td class="text-right">{{ parseFloat(p.peso_bruto).toFixed(3) }}</td>
              <td class="text-right text-muted">{{ parseFloat(p.recorte).toFixed(3) }}</td>
              <td class="text-right text-muted">{{ parseFloat(p.decomiso).toFixed(3) }}</td>
              <td class="text-right text-red">{{ parseFloat(p.kg_a_desc).toFixed(3) }}</td>
              <td class="text-right text-green" style="font-weight: bold;">{{ parseFloat(p.kg_a_sumar).toFixed(3) }}</td>
            </tr>
          </tbody>
        </table>

        <!-- VISTA DE TARJETAS (MÓVIL) -->
        <div v-if="!loadingData && filteredAndSortedProcesos.length > 0" class="mobile-cards-container">
          <div v-for="p in filteredAndSortedProcesos" :key="p.id" class="mobile-process-card">
            <div class="card-row header-row">
              <span class="process-id">Proceso #{{ p.id }}</span>
              <span class="process-date">{{ formatDate(p.fecha) }}</span>
            </div>

            <div class="card-row origin-row" style="margin-top: 0.25rem;">
              <span :class="['badge generator-badge', getGeneradorBadgeClass(p.Generador?.tipo || 'colaborador')]">
                <i :class="['ph', getGeneradorIcon(p.Generador?.tipo || 'colaborador')]"></i>
                {{ getGeneradorName(p) }}
              </span>
            </div>

            <div class="card-row product-row" style="margin-top: 0.35rem;">
              <strong class="product-code" style="margin-right: 0.25rem;">[{{ p.codigo }}]</strong>
              <span class="product-name truncate-name" style="font-size: 0.82rem; font-weight: bold;">{{ p.Producto?.nombre || 'Desconocido' }}</span>
            </div>

            <div class="card-row details-row" style="margin-top: 0.5rem;">
              <div class="detail-item"><strong>Pzs:</strong> {{ p.piezas }}</div>
              <div class="detail-item"><strong>Bruto:</strong> {{ parseFloat(p.peso_bruto).toFixed(3) }} kg</div>
              <div class="detail-item"><strong>Rec:</strong> {{ parseFloat(p.recorte).toFixed(3) }} kg</div>
              <div class="detail-item"><strong>Dec:</strong> {{ parseFloat(p.decomiso).toFixed(3) }} kg</div>
              <div class="detail-item highlight-desc">
                <strong>Kg a Descontar:</strong> {{ parseFloat(p.kg_a_desc).toFixed(3) }} kg
              </div>
              <div class="detail-item highlight-sum">
                <strong>Kg a Sumar:</strong> {{ parseFloat(p.kg_a_sumar).toFixed(3) }} kg
              </div>
            </div>

            <div class="card-row actions-row" style="margin-top: 0.5rem;">
              <button class="btn-action edit-btn" title="Editar" @click="openModal(p)">
                <i class="ph ph-pencil-simple"></i> Editar
              </button>
              <button class="btn-action delete-btn" title="Eliminar" @click="confirmDelete(p)">
                <i class="ph ph-trash"></i> Eliminar
              </button>
            </div>
          </div>
        </div>

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

    <!-- VISTA 2: FORMULARIO DE REGISTRO EN PÁGINA COMPLETA (NO MODAL) -->
    <div v-else class="animate-fade">
      <!-- Encabezado de Creación / Edición en Vista Completa -->
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 1rem; padding: 0.75rem 1rem; background: #0f172a; color: white; border-left: 4px solid var(--accent-primary);">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <button class="btn btn-secondary" @click="closeModal" style="display: flex; align-items: center; gap: 0.35rem; font-weight: bold;">
            <i class="ph ph-arrow-left" style="font-size: 1.1rem; color: var(--accent-primary);"></i> Volver al Listado
          </button>
          <h3 style="margin: 0; font-size: 1.1rem; font-weight: bold; color: white;">
            {{ isEditing ? 'Editar Proceso #' + editId : 'Registrar Nuevo Proceso' }}
          </h3>
        </div>
        <button v-if="isEditing" type="button" class="btn btn-danger" @click="confirmDeleteFromModal">
          <i class="ph ph-trash"></i> Eliminar Registro
        </button>
      </div>

      <div class="card" style="padding: 1.25rem;">
        <form @submit.prevent="submitForm" style="display: flex; flex-direction: column; gap: 1.25rem;">
          
          <!-- FILA 1: DATOS DEL PROCESAMIENTO -->
          <div v-if="!isColaborador" class="modal-section">
            <span class="modal-section-title">1. Datos del Procesamiento</span>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
              <div class="form-group">
                <label class="form-label">Tipo de Origen *</label>
                <select v-model="form.generador_tipo" class="form-control" required @change="handleTipoOrigenChange">
                  <option value="colaborador">👤 Colaborador</option>
                  <option value="sucursal">🏬 Sucursal</option>
                  <option value="proveedor">🚚 Proveedor</option>
                </select>
              </div>

              <div class="form-group animate-fade">
                <label class="form-label">Origen / Entidad *</label>
                <select ref="origenInput" v-model="form.id_asociado" class="form-control" required>
                  <option :value="null" disabled>Seleccione una opción</option>
                  <template v-if="form.generador_tipo === 'colaborador'">
                    <option v-for="c in colaboradores" :key="c.id" :value="c.id">
                      {{ c.nombre }}
                    </option>
                  </template>
                  <template v-else-if="form.generador_tipo === 'sucursal'">
                    <option v-for="s in sucursales" :key="s.id" :value="s.id">
                      {{ s.sucursal }} {{ s.numero ? '#' + s.numero : '' }}
                    </option>
                  </template>
                  <template v-else-if="form.generador_tipo === 'proveedor'">
                    <option v-for="pr in proveedores" :key="pr.id" :value="pr.id">
                      {{ pr.nombre }}
                    </option>
                  </template>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Fecha del Proceso</label>
                <input type="date" v-model="form.fecha" class="form-control" />
              </div>
            </div>
          </div>

          <!-- FILA 2: DATOS DEL PRODUCTO -->
          <div class="modal-section">
            <span class="modal-section-title">2. Datos del Producto</span>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
              <!-- Selector Autocomplete de Producto -->
              <div class="form-group" style="grid-column: span 2;">
                <label class="form-label">Producto Asociado *</label>
                <div style="position: relative; display: flex; align-items: center;">
                  <i class="ph ph-magnifying-glass" style="position: absolute; left: 0.65rem; color: var(--text-muted); pointer-events: none; font-size: 1.1rem;"></i>
                  <input 
                    type="text" 
                    v-model="productSearch" 
                    list="catalog-products-list-main" 
                    @input="handleProductInput" 
                    class="form-control" 
                    placeholder="Buscar por código o nombre..." 
                    required 
                    style="padding-left: 2.2rem; height: 38px; font-size: 0.9rem;"
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
                  style="display: flex; align-items: center; gap: 0.5rem; padding: 0.4rem 0.65rem; background-color: var(--accent-primary-light); border: 1.5px solid var(--accent-primary); font-size: 0.85rem; color: var(--text-primary);"
                >
                  <i class="ph ph-circle-wavy-check text-green" style="font-size: 1.1rem;"></i>
                  <span class="truncate-name">
                    Seleccionado: <strong>{{ selectedMainProduct.nombre }}</strong>
                  </span>
                </div>
              </div>

              <div class="form-group" style="grid-column: span 2;">
                <label class="form-label">Peso Bruto (kg) *</label>
                <input type="number" step="0.001" min="0.001" v-model.number="form.peso_bruto" class="form-control" required style="height: 38px; font-size: 0.9rem;" placeholder="Ej: 12.500" />
              </div>
            </div>
          </div>

          <!-- FILA 3: DATOS DE PESOS -->
          <div class="modal-section">
            <span class="modal-section-title">
              3. Datos de los Pesos
            </span>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 0.75rem;">
              <div class="form-group">
                <label class="form-label">Recorte (kg)</label>
                <input type="number" step="0.001" min="0" v-model.number="form.recorte" class="form-control" style="height: 38px;" />
              </div>

              <div class="form-group">
                <label class="form-label">Decomiso (kg)</label>
                <input type="number" step="0.001" min="0" v-model.number="form.decomiso" class="form-control" style="height: 38px;" />
              </div>

              <div class="form-group">
                <label class="form-label">Peso Envasado (kg)</label>
                <input 
                  type="number" 
                  step="0.001" 
                  min="0" 
                  v-model.number="pesoEnvasadoConBandeja" 
                  class="form-control" 
                  placeholder="0.000"
                  style="height: 38px;"
                />
              </div>

              <div class="form-group">
                <label class="form-label">Peso Bandeja (kg)</label>
                <input type="number" step="0.001" min="0" v-model.number="form.peso_bandeja" class="form-control" style="height: 38px;" />
              </div>
            </div>

            <!-- Kg a Sumar Final (Neto a Inventariar) -->
            <div style="margin-top: 1rem; padding: 0.75rem 1rem; background-color: var(--bg-secondary); border: 1.5px solid var(--bevel-dark); display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: bold; font-size: 0.9rem; color: var(--text-secondary);">Kg a Sumar Final (Neto):</span>
              <span style="font-weight: 850; font-size: 1.25rem; color: var(--accent-success);">{{ form.kg_a_sumar.toFixed(3) }} kg</span>
            </div>

            <input type="hidden" v-model.number="form.kg_a_desc" />
          </div>

          <!-- Acciones de Formulario (Botón Cancelar regresa a la vista anterior) -->
          <div style="display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 0.5rem;">
            <button type="button" class="btn btn-secondary" @click="closeModal" style="height: 38px; padding: 0 1.25rem;">
              <i class="ph ph-arrow-left"></i> Cancelar
            </button>
            <button type="submit" class="btn btn-primary" :disabled="submitting" style="height: 38px; padding: 0 1.5rem;">
              <i class="ph ph-spinner spinner" v-if="submitting"></i>
              <i class="ph ph-floppy-disk" v-else></i>
              {{ submitting ? 'Guardando...' : (isEditing ? 'Actualizar Proceso' : 'Registrar Proceso') }}
            </button>
          </div>
        </form>
      </div>
    </div>

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
              ¿Estás seguro de que deseas eliminar el registro de proceso de <strong>{{ itemToDelete.proceso }}</strong> de <strong>{{ getGeneradorName(itemToDelete) }}</strong>?<br><br>Esta acción no se puede deshacer y se revertirá el stock si fue confirmado.
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
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useAuthStore } from '../stores/auth'
import { calcularPiezasProducto } from '../utils/calculoPiezas'

const authStore = useAuthStore()

// Datos
const procesos = ref([])
const productos = ref([])
const colaboradores = ref([])
const sucursales = ref([])
const proveedores = ref([])
const origenInput = ref(null)
const loadingData = ref(true)
const submitting = ref(false)
const isEditing = ref(false)
const editId = ref(null)
const itemToDelete = ref(null)
const showModal = ref(false)

const isColaborador = computed(() => authStore.user?.rol?.toLowerCase() === 'colaborador')
const showOnlyMyProcesos = ref(true)

const getMatchedCollaboratorId = () => {
  if (colaboradores.value.length === 0) return null
  const username = (authStore.user?.usuario || '').toLowerCase().trim()
  if (!username) return colaboradores.value[0].id

  const exact = colaboradores.value.find(c => c.nombre.toLowerCase().trim() === username)
  if (exact) return exact.id

  const partial = colaboradores.value.find(c => {
    const name = c.nombre.toLowerCase().trim()
    return name.includes(username) || username.includes(name)
  })
  if (partial) return partial.id

  return colaboradores.value[0].id
}

watch(colaboradores, (newVal) => {
  if (isColaborador.value && !form.value.id_asociado && newVal.length > 0) {
    form.value.generador_tipo = 'colaborador'
    form.value.id_asociado = getMatchedCollaboratorId()
  }
})

const alert = ref({ show: false, message: '', type: 'success' })
const pesoEnvasadoConBandeja = ref(0)

const openModal = (proceso = null) => {
  if (proceso) {
    loadProcesoToForm(proceso)
  } else {
    resetForm()
  }
  showModal.value = true
  nextTick(() => {
    origenInput.value?.focus()
  })
}

const closeModal = () => {
  showModal.value = false
  resetForm()
}

const getTodayString = () => new Date().toISOString().split('T')[0]

const defaultForm = {
  generador_tipo: 'colaborador',
  id_asociado: null,
  proceso: 'Fraccionamiento',
  fecha: getTodayString(),
  codigo: '',
  piezas: 0,
  peso_bruto: 0,
  recorte: 0,
  decomiso: 0,
  peso_bandeja: 0,
  kg_a_desc: 0,
  kg_a_sumar: 0,
  pendiente: false
}

const form = ref({ ...defaultForm })

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

watch(
  () => [form.value.peso_bruto, form.value.recorte, form.value.decomiso],
  ([bruto, recorte, decomiso]) => {
    const valBruto = parseFloat(bruto) || 0
    const valRecorte = parseFloat(recorte) || 0
    const valDecomiso = parseFloat(decomiso) || 0
    
    const calc = valBruto - (valRecorte + valDecomiso)
    form.value.kg_a_desc = parseFloat(calc.toFixed(3))
    
    pesoEnvasadoConBandeja.value = parseFloat(Math.max(0, calc).toFixed(3))
  }
)

watch(
  () => [pesoEnvasadoConBandeja.value, form.value.peso_bandeja],
  ([envasadoRaw, bandeja]) => {
    const valEnvasado = parseFloat(envasadoRaw) || 0
    const valBandeja = parseFloat(bandeja) || 0
    form.value.kg_a_sumar = parseFloat(Math.max(0, valEnvasado - valBandeja).toFixed(3))
  }
)

const searchQuery = ref('')
const sortKey = ref('id')
const sortOrder = ref(-1)

const showAlert = (msg, type = 'success') => {
  alert.value = { show: true, message: msg, type }
  setTimeout(() => { alert.value.show = false }, 3500)
}

const fetchColaboradores = async () => {
  try {
    const res = await fetch('/api/colaboradores')
    if (res.ok) {
      colaboradores.value = await res.json()
    }
  } catch (error) {
    console.error('Error fetching colaboradores:', error)
  }
}

const fetchSucursales = async () => {
  try {
    const res = await fetch('/api/sucursales')
    if (res.ok) {
      sucursales.value = await res.json()
    }
  } catch (error) {
    console.error('Error fetching sucursales:', error)
  }
}

const fetchProveedores = async () => {
  try {
    const res = await fetch('/api/proveedores')
    if (res.ok) {
      proveedores.value = await res.json()
    }
  } catch (error) {
    console.error('Error fetching proveedores:', error)
  }
}

const fetchInitialData = async () => {
  loadingData.value = true
  try {
    await Promise.all([
      fetchColaboradores(),
      fetchSucursales(),
      fetchProveedores()
    ])
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

const submitForm = async () => {
  if (!form.value.codigo) {
    showAlert('Debe seleccionar un producto válido', 'error')
    return
  }
  if (!form.value.id_asociado) {
    showAlert('Debe seleccionar un origen válido', 'error')
    return
  }
  if (!form.value.peso_bruto || form.value.peso_bruto <= 0) {
    showAlert('El Peso Bruto es obligatorio y debe ser mayor a 0 kg', 'error')
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

const handleTipoOrigenChange = () => {
  form.value.id_asociado = null
  if (isColaborador.value) {
    form.value.generador_tipo = 'colaborador'
    form.value.id_asociado = getMatchedCollaboratorId()
  } else if (form.value.generador_tipo === 'colaborador' && colaboradores.value.length > 0) {
    const userMatched = colaboradores.value.find(c => c.nombre.toLowerCase() === (authStore.user?.usuario || '').toLowerCase())
    form.value.id_asociado = userMatched ? userMatched.id : colaboradores.value[0].id
  } else if (form.value.generador_tipo === 'sucursal' && sucursales.value.length > 0) {
    form.value.id_asociado = sucursales.value[0].id
  } else if (form.value.generador_tipo === 'proveedor' && proveedores.value.length > 0) {
    form.value.id_asociado = proveedores.value[0].id
  }
}

const getGeneradorName = (p) => {
  if (!p.Generador) return p.colaborador || 'Desconocido'
  if (p.Generador.tipo === 'colaborador') return p.Generador.colaborador?.nombre || 'Desconocido'
  if (p.Generador.tipo === 'sucursal') return p.Generador.sucursal?.sucursal || 'Desconocido'
  if (p.Generador.tipo === 'proveedor') return p.Generador.proveedor?.nombre || 'Desconocido'
  return 'Desconocido'
}

const getGeneradorIcon = (tipo) => {
  if (tipo === 'colaborador') return 'ph-user'
  if (tipo === 'sucursal') return 'ph-storefront'
  if (tipo === 'proveedor') return 'ph-handshake'
  return 'ph-question'
}

const getGeneradorBadgeClass = (tipo) => {
  if (tipo === 'colaborador') return 'badge-colab'
  if (tipo === 'sucursal') return 'badge-sucursal'
  if (tipo === 'proveedor') return 'badge-proveedor'
  return ''
}

const loadProcesoToForm = (proceso) => {
  isEditing.value = true
  editId.value = proceso.id
  
  const valBruto = parseFloat(proceso.peso_bruto) || 0
  const valRecorte = parseFloat(proceso.recorte) || 0
  const valDecomiso = parseFloat(proceso.decomiso) || 0
  const valSumar = parseFloat(proceso.kg_a_sumar) || 0
  const calculatedBandeja = Math.max(0, (valBruto - (valRecorte + valDecomiso)) - valSumar)
  pesoEnvasadoConBandeja.value = parseFloat((valSumar + calculatedBandeja).toFixed(3))

  form.value = {
    generador_tipo: proceso.Generador?.tipo || 'colaborador',
    id_asociado: proceso.Generador?.id_asociado || proceso.colaborador_id || null,
    proceso: proceso.proceso,
    fecha: proceso.fecha ? proceso.fecha.split('T')[0] : getTodayString(),
    codigo: proceso.codigo,
    piezas: proceso.piezas,
    peso_bruto: valBruto,
    recorte: valRecorte,
    decomiso: valDecomiso,
    peso_bandeja: parseFloat(calculatedBandeja.toFixed(3)),
    kg_a_desc: parseFloat(proceso.kg_a_desc),
    kg_a_sumar: valSumar,
    pendiente: proceso.pendiente || false
  }

  const matched = productos.value.find(p => p.codigo === proceso.codigo)
  productSearch.value = matched ? matched.codigo : proceso.codigo
  selectedMainProduct.value = matched || null
}

const resetForm = () => {
  isEditing.value = false
  editId.value = null
  form.value = { 
    ...defaultForm, 
    fecha: getTodayString() 
  }
  pesoEnvasadoConBandeja.value = 0
  handleTipoOrigenChange()
  productSearch.value = ''
  selectedMainProduct.value = null
}

const confirmDelete = (item) => {
  itemToDelete.value = item
}

const confirmDeleteFromModal = () => {
  const p = procesos.value.find(pr => pr.id === editId.value)
  if (p) {
    closeModal()
    confirmDelete(p)
  }
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

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const parts = dateStr.split('T')[0].split('-')
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`
  }
  return dateStr
}

const sortBy = (key) => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value * -1
  } else {
    sortKey.value = key
    sortOrder.value = 1
  }
}

const filteredAndSortedProcesos = computed(() => {
  let result = procesos.value.filter(p => p.proceso === 'Fraccionamiento')

  if (isColaborador.value && showOnlyMyProcesos.value) {
    const username = (authStore.user?.usuario || '').toLowerCase().trim()
    result = result.filter(p => {
      const genName = getGeneradorName(p).toLowerCase().trim()
      return genName.includes(username) || username.includes(genName)
    })
  }

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    result = result.filter(p => {
      const idMatch = p.id ? p.id.toString().includes(query) : false
      const genName = getGeneradorName(p)
      const colabMatch = genName.toLowerCase().includes(query)
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
        valA = getGeneradorName(a)
        valB = getGeneradorName(b)
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

.generator-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.15rem 0.45rem;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 0;
  line-height: 1.2;
}

.badge-colab {
  background-color: var(--accent-primary-light, #e0f2fe);
  color: var(--accent-primary, #0284c7);
  border: 1px solid var(--accent-primary-hover, #bae6fd);
}

.badge-sucursal {
  background-color: var(--accent-warning-light, #fef3c7);
  color: var(--accent-warning, #d97706);
  border: 1px solid var(--accent-warning-hover, #fde68a);
}

.badge-proveedor {
  background-color: var(--accent-success-light, #ecfdf5);
  color: var(--accent-success, #059669);
  border: 1px solid var(--accent-success-hover, #a7f3d0);
}

.modal-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background-color: var(--bg-window);
  border: 1.5px solid var(--bevel-dark);
  border-radius: 0;
}

.modal-section-title {
  font-size: 0.78rem;
  font-weight: 850;
  text-transform: uppercase;
  color: var(--text-secondary);
  letter-spacing: 0.05em;
  border-bottom: 1.5px dashed var(--bevel-dark);
  padding-bottom: 0.25rem;
  margin-bottom: 0.35rem;
}

.desktop-table {
  display: table;
  width: 100%;
}
.mobile-cards-container {
  display: none;
}

@media (max-width: 768px) {
  .desktop-table {
    display: none;
  }
  .mobile-cards-container {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 0.25rem;
  }
}

.mobile-process-card {
  background: var(--bg-secondary);
  border: 2px solid var(--bevel-dark);
  border-radius: 0;
  padding: 0.75rem;
  box-shadow: var(--raised-shadow);
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.mobile-process-card:hover {
  border-color: var(--accent-primary);
}

.card-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.header-row {
  border-bottom: 1px dashed var(--bevel-dark);
  padding-bottom: 0.35rem;
  font-size: 0.8rem;
  font-weight: bold;
}

.process-id {
  color: var(--text-primary);
}

.process-date {
  color: var(--text-muted);
}

.product-row {
  justify-content: flex-start;
  font-size: 0.85rem;
}

.product-code {
  color: var(--accent-primary);
}

.product-name {
  color: var(--text-primary);
  font-weight: 500;
}

.details-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.35rem;
  background: rgba(0, 0, 0, 0.04);
  padding: 0.5rem;
  border-radius: 0;
  font-size: 0.75rem;
}

.detail-item {
  color: var(--text-primary);
}

.highlight-desc {
  color: var(--accent-danger);
  grid-column: span 2;
  font-weight: 600;
}

.highlight-sum {
  color: var(--accent-success);
  grid-column: span 2;
  font-weight: 600;
}

.actions-row {
  margin-top: 0.35rem;
  border-top: 1px dashed var(--bevel-dark);
  padding-top: 0.5rem;
  justify-content: flex-end;
  gap: 0.5rem;
}

.btn-action {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.35rem 0.6rem;
  font-size: 0.75rem;
  font-weight: 600;
  border: 1px solid var(--bevel-dark);
  background: var(--bg-window);
  cursor: pointer;
  box-shadow: var(--raised-shadow);
  color: var(--text-primary);
}

.btn-action:active {
  box-shadow: var(--inset-shadow);
}

.edit-btn {
  color: var(--accent-primary);
  border-color: var(--accent-primary);
}

.delete-btn {
  color: var(--accent-danger);
  border-color: var(--accent-danger);
}

.desktop-table th,
.desktop-table td {
  padding: 6px 8px !important;
}

.desktop-table tbody tr:hover {
  background-color: var(--bevel-dark, rgba(0, 0, 0, 0.03)) !important;
}
</style>
