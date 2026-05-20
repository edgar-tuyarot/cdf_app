<template>
  <div class="page-container animate-fade">
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title">Gestión de Productos</h2>
        <p class="page-description">Administra el catálogo de productos y sus detalles.</p>
      </div>
      <div class="header-actions mt-2" style="display: flex; gap: 0.5rem;">
        <input type="file" ref="fileInput" accept=".xlsx, .xls" style="display: none" @change="handleFileUpload" />
        <button class="btn btn-secondary" @click="triggerFileInput" :disabled="uploading">
          <i class="ph ph-spinner spinner" v-if="uploading"></i>
          <i class="ph ph-upload-simple" v-else></i> Subir Excel
        </button>
        <input type="file" ref="stockFileInput" accept=".xlsx, .xls" style="display: none" @change="handleStockFileUpload" />
        <button class="btn btn-secondary" style="background: #1a7f37; color: #fff; border: 1px solid #15692e;" @click="triggerStockFileInput" :disabled="uploadingStock">
          <i class="ph ph-spinner spinner" v-if="uploadingStock"></i>
          <i class="ph ph-package" v-else></i> Cargar Stock (Excel)
        </button>
        <button class="btn btn-primary" @click="openModal()">
          <i class="ph ph-plus"></i> Nuevo Producto
        </button>
      </div>
    </div>

    <!-- Mensajes de estado -->
    <div v-if="alert.show" :class="['alert-box mb-4', alert.type]">
      {{ alert.message }}
    </div>

    <!-- Tabla de Productos -->
    <div class="card">
      <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
        <span class="card-title">Listado de Productos</span>
        <div style="display: flex; align-items: center; gap: 0.3rem; background: var(--bg-window); padding: 0.1rem 0.3rem; box-shadow: var(--inset-shadow); height: 26px;">
          <i class="ph ph-magnifying-glass" style="color: var(--text-secondary); font-size: 0.9rem;"></i>
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="Buscar producto..." 
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
                Nombre 
                <i v-if="sortKey === 'nombre'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i>
              </th>
              <th @click="sortBy('kilos_block')" class="sortable text-right">
                Kilos Block 
                <i v-if="sortKey === 'kilos_block'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i>
              </th>
              <th @click="sortBy('peso_x_pieza')" class="sortable text-right">
                Peso x Pieza 
                <i v-if="sortKey === 'peso_x_pieza'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i>
              </th>
              <th @click="sortBy('cantidad_piezas')" class="sortable text-center">
                Cant. Piezas 
                <i v-if="sortKey === 'cantidad_piezas'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i>
              </th>
              <th @click="sortBy('vencimientos')" class="sortable text-center">
                Vencimientos 
                <i v-if="sortKey === 'vencimientos'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i>
              </th>
              <th @click="sortBy('kg_x_bolsita')" class="sortable text-right">
                Kg x Bolsita 
                <i v-if="sortKey === 'kg_x_bolsita'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i>
              </th>
              <th @click="sortBy('kg_fraccionados')" class="sortable text-right">
                Fraccionados 
                <i v-if="sortKey === 'kg_fraccionados'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i>
              </th>
              <th @click="sortBy('kg_decomiso')" class="sortable text-right">
                Decomiso 
                <i v-if="sortKey === 'kg_decomiso'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i>
              </th>
              <th @click="sortBy('kg_recorte')" class="sortable text-right">
                Recorte 
                <i v-if="sortKey === 'kg_recorte'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i>
              </th>
              <th class="text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in filteredAndSortedProductos" :key="p.codigo">
              <td><strong>{{ p.codigo }}</strong></td>
              <td>{{ p.nombre }}</td>
              <td class="text-right">{{ p.kilos_block }}</td>
              <td class="text-right">{{ p.peso_x_pieza }}</td>
              <td class="text-center">{{ p.cantidad_piezas }}</td>
              <td class="text-center">{{ p.vencimientos || '-' }}</td>
              <td class="text-right">{{ p.kg_x_bolsita }}</td>
              <td class="text-right">{{ p.kg_fraccionados }}</td>
              <td class="text-right">{{ p.kg_decomiso }}</td>
              <td class="text-right">{{ p.kg_recorte }}</td>
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

        <!-- Estado de Carga -->
        <div v-if="loading" class="loading-state">
          <i class="ph ph-spinner spinner icon-xl"></i>
          Cargando productos...
        </div>

        <!-- Estado Vacío -->
        <div v-if="!loading && filteredAndSortedProductos.length === 0" class="empty-state">
          <i class="ph ph-package icon-xl"></i>
          No hay productos que coincidan con la búsqueda.
        </div>
      </div>
    </div>

    <!-- Modal Formulario -->
    <Teleport to="body">
      <div v-if="showModal" class="modal-overlay" @mousedown.self="closeModal">
        <div class="modal-card">
          <div class="modal-header">
            <h3 class="modal-title">{{ isEditing ? 'Editar Producto' : 'Nuevo Producto' }}</h3>
            <button class="icon-btn" @click="closeModal"><i class="ph ph-x"></i></button>
          </div>
          <form @submit.prevent="saveProducto">
            <div class="modal-body">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-bottom: 0.5rem;">
                <div class="form-group" style="grid-column: span 2;">
                  <label class="form-label">Nombre del Producto *</label>
                  <input type="text" v-model="form.nombre" class="form-control" required />
                </div>
                
                <div class="form-group">
                  <label class="form-label">Código *</label>
                  <input type="text" v-model="form.codigo" class="form-control" :disabled="isEditing" required />
                </div>
                
                <div class="form-group">
                  <label class="form-label">Vencimientos</label>
                  <input type="text" v-model="form.vencimientos" class="form-control" placeholder="Ej: 04/09" />
                </div>

                <div class="form-group">
                  <label class="form-label">Kilos Block</label>
                  <input type="number" step="0.001" v-model="form.kilos_block" class="form-control" />
                </div>

                <div class="form-group">
                  <label class="form-label">Peso x Pieza</label>
                  <input type="number" step="0.001" v-model="form.peso_x_pieza" class="form-control" />
                </div>

                <div class="form-group">
                  <label class="form-label">Cant. Piezas</label>
                  <input type="number" v-model="form.cantidad_piezas" class="form-control" />
                </div>

                <div class="form-group">
                  <label class="form-label">Kg x Bolsita</label>
                  <input type="number" step="0.001" v-model="form.kg_x_bolsita" class="form-control" />
                </div>

                <div class="form-group">
                  <label class="form-label">Kg Fraccionados</label>
                  <input type="number" step="0.001" v-model="form.kg_fraccionados" class="form-control" />
                </div>

                <div class="form-group">
                  <label class="form-label">Kg Decomiso</label>
                  <input type="number" step="0.001" v-model="form.kg_decomiso" class="form-control" />
                </div>
                
                <div class="form-group" style="grid-column: span 2;">
                  <label class="form-label">Kg Recorte</label>
                  <input type="number" step="0.001" v-model="form.kg_recorte" class="form-control" />
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="closeModal">
                <i class="ph ph-x"></i> Cancelar
              </button>
              <button type="submit" class="btn btn-primary" :disabled="saving">
                <i class="ph ph-spinner spinner" v-if="saving"></i>
                <i class="ph ph-floppy-disk" v-else></i> 
                {{ saving ? 'Guardando...' : 'Guardar' }}
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
              ¿Estás seguro de que deseas eliminar el producto <strong>{{ itemToDelete.nombre }}</strong>?<br><br>Esta acción no se puede deshacer.
            </p>
          </div>
          <div class="win-dialog-footer">
            <button class="win-dialog-btn win-dialog-btn-ok" @click="deleteProducto">Sí</button>
            <button class="win-dialog-btn" @click="itemToDelete = null">No</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const productos = ref([])
const loading = ref(true)
const saving = ref(false)
const showModal = ref(false)
const isEditing = ref(false)
const itemToDelete = ref(null)
const uploading = ref(false)
const uploadingStock = ref(false)
const fileInput = ref(null)
const stockFileInput = ref(null)

const alert = ref({
  show: false,
  message: '',
  type: 'success'
})

const searchQuery = ref('')
const sortKey = ref('nombre')
const sortOrder = ref(1) // 1 = asc, -1 = desc

// Filtro y ordenación reactiva de productos
const filteredAndSortedProductos = computed(() => {
  let result = [...productos.value]

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

      // Valores por defecto
      if (valA === undefined || valA === null) valA = ''
      if (valB === undefined || valB === null) valB = ''

      // Verificamos si son numéricos
      const isNumeric = !isNaN(parseFloat(valA)) && isFinite(valA) && !isNaN(parseFloat(valB)) && isFinite(valB)

      if (isNumeric) {
        return (parseFloat(valA) - parseFloat(valB)) * sortOrder.value
      } else {
        return valA.toString().localeCompare(valB.toString(), undefined, { numeric: true, sensitivity: 'base' }) * sortOrder.value
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

const defaultForm = {
  codigo: '',
  nombre: '',
  kilos_block: 0,
  peso_x_pieza: 0,
  cantidad_piezas: 0,
  vencimientos: '',
  kg_x_bolsita: 0,
  kg_fraccionados: 0,
  kg_decomiso: 0,
  kg_recorte: 0
}

const form = ref({ ...defaultForm })

const showAlert = (msg, type = 'success') => {
  alert.value = { show: true, message: msg, type }
  setTimeout(() => { alert.value.show = false }, 3000)
}

const fetchProductos = async () => {
  loading.value = true
  try {
    const res = await fetch('/api/productos')
    if (res.ok) {
      productos.value = await res.json()
    } else {
      showAlert('Error al cargar productos', 'error')
    }
  } catch (error) {
    console.error('Error fetching productos:', error)
    showAlert('Error de conexión', 'error')
  } finally {
    loading.value = false
  }
}

const openModal = (producto = null) => {
  if (producto) {
    isEditing.value = true
    form.value = { ...producto }
  } else {
    isEditing.value = false
    form.value = { ...defaultForm }
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  form.value = { ...defaultForm }
}

const saveProducto = async () => {
  saving.value = true
  const url = isEditing.value ? `/api/productos/${form.value.codigo}` : '/api/productos'
  const method = isEditing.value ? 'PUT' : 'POST'
  
  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value)
    })
    
    if (res.ok) {
      showAlert(isEditing.value ? 'Producto actualizado' : 'Producto creado')
      closeModal()
      fetchProductos()
    } else {
      showAlert('Error al guardar producto', 'error')
    }
  } catch (error) {
    console.error('Error saving:', error)
    showAlert('Error de conexión', 'error')
  } finally {
    saving.value = false
  }
}

const confirmDelete = (prod) => {
  itemToDelete.value = prod
}

const deleteProducto = async () => {
  if (!itemToDelete.value) return
  
  try {
    const res = await fetch(`/api/productos/${itemToDelete.value.codigo}`, {
      method: 'DELETE'
    })
    if (res.ok) {
      showAlert('Producto eliminado')
      fetchProductos()
    } else {
      showAlert('Error al eliminar producto', 'error')
    }
  } catch (error) {
    console.error('Error deleting:', error)
    showAlert('Error de conexión', 'error')
  } finally {
    itemToDelete.value = null
  }
}

const triggerFileInput = () => {
  if (fileInput.value) {
    fileInput.value.click()
  }
}

const handleFileUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  uploading.value = true
  const formData = new FormData()
  formData.append("file", file)

  try {
    const res = await fetch("/api/productos/upload", {
      method: "POST",
      body: formData // No enviar headers como Content-Type, el navegador lo pone solo
    })
    
    const result = await res.json()
    if (res.ok) {
      showAlert(`Subida exitosa: ${result.mensaje || 'Productos cargados'}`)
      fetchProductos()
    } else {
      showAlert(`Error: ${result.error || 'No se pudo procesar el archivo'}`, 'error')
    }
  } catch (error) {
    console.error("Error subiendo el archivo:", error)
    showAlert('Error de conexión al subir archivo', 'error')
  } finally {
    uploading.value = false
    // Limpiar el input para permitir subir el mismo archivo de nuevo
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  }
}

const triggerStockFileInput = () => {
  if (stockFileInput.value) {
    stockFileInput.value.click()
  }
}

const handleStockFileUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  uploadingStock.value = true
  const formData = new FormData()
  formData.append('file', file)

  try {
    const res = await fetch('/api/productos/cargar-stock', {
      method: 'POST',
      body: formData
    })

    const result = await res.json()
    if (res.ok) {
      showAlert(`${result.mensaje}`)
      fetchProductos()
    } else {
      showAlert(`Error: ${result.error || 'No se pudo procesar el archivo'}`, 'error')
    }
  } catch (error) {
    console.error('Error subiendo stock:', error)
    showAlert('Error de conexión al subir archivo de stock', 'error')
  } finally {
    uploadingStock.value = false
    if (stockFileInput.value) {
      stockFileInput.value.value = ''
    }
  }
}

onMounted(() => {
  fetchProductos()
})
</script>

<style scoped>
/* Las clases de estilos globales de main.css se encargan del layout básico */
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
