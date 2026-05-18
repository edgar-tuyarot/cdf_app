<template>
  <div class="page-container animate-fade">
    <!-- Encabezado de la Vista -->
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title">Gestión de Pedidos</h2>
        <p class="page-description">Carga masiva de planillas de pedidos y consulta detallada del historial de órdenes.</p>
      </div>
      <div class="header-actions mt-2">
        <button class="btn btn-secondary" @click="fetchPedidos" :disabled="loading">
          <i class="ph ph-spinner spinner" v-if="loading"></i>
          <i class="ph ph-arrows-clockwise" v-else></i> Actualizar Lista
        </button>
      </div>
    </div>

    <!-- Mensajes de Alerta -->
    <div v-if="alert.show" :class="['alert-box mb-4', alert.type]">
      {{ alert.message }}
    </div>

    <div class="pedidos-grid">
      <!-- ============================================== -->
      <!-- COLUMNA IZQUIERDA: IMPORTADOR EXCEL            -->
      <!-- ============================================== -->
      <div class="card form-column">
        <div class="card-header" style="background-color: var(--accent-primary);">
          <span class="card-title">Carga Masiva (Excel)</span>
        </div>
        <div class="p-4" style="display: flex; flex-direction: column; gap: 1rem;">
          
          <p class="text-xs text-muted" style="line-height: 1.4;">
            Selecciona un archivo de planilla Excel (<strong>.xlsx</strong> o <strong>.xls</strong>). El sistema agrupará automáticamente los productos bajo sus respectivos códigos de pedido y omitirá de forma segura los pedidos ya registrados en la base de datos para evitar duplicaciones.
          </p>

          <!-- Input File Personalizado Retro -->
          <div class="file-dropzone" @click="triggerFileInput">
            <input 
              type="file" 
              ref="fileInput" 
              @change="onFileSelected" 
              accept=".xlsx, .xls" 
              style="display: none;" 
            />
            <i class="ph ph-file-xls text-blue" style="font-size: 2.5rem; margin-bottom: 0.5rem;"></i>
            <span class="fw-bold" style="font-size: 0.85rem;">
              {{ selectedFile ? selectedFile.name : 'Haz clic para seleccionar archivo' }}
            </span>
            <span class="text-xs text-muted mt-1" v-if="!selectedFile">
              Soporta planillas .xlsx y .xls
            </span>
            <span class="text-xs text-green fw-bold mt-1" v-else>
              {{ (selectedFile.size / 1024).toFixed(1) }} KB - Listo para subir
            </span>
          </div>

          <div style="display: flex; gap: 0.5rem;">
            <button 
              v-if="selectedFile" 
              type="button" 
              class="btn btn-secondary w-full" 
              @click="clearFileSelection" 
              :disabled="uploading"
            >
              Cancelar
            </button>
            <button 
              type="button" 
              class="btn btn-primary w-full" 
              :disabled="!selectedFile || uploading" 
              @click="uploadFile"
            >
              <i class="ph ph-spinner spinner" v-if="uploading"></i>
              <i class="ph ph-upload-simple" v-else></i>
              {{ uploading ? 'Subiendo...' : 'Subir y Procesar' }}
            </button>
          </div>

          <!-- Historial de Resultados de la Carga -->
          <div v-if="uploadResult" class="card" style="box-shadow: var(--inset-shadow); background: var(--bg-secondary); border-color: var(--bevel-dark);">
            <div class="card-header" style="background-color: var(--bevel-dark); padding: 0.2rem 0.5rem; display: flex; justify-content: space-between;">
              <span style="font-size: 0.75rem; font-weight: bold; color: white;">Resultado de Importación</span>
              <button @click="uploadResult = null" style="background: none; border: none; color: white; cursor: pointer; font-size: 0.7rem;"><i class="ph ph-x"></i></button>
            </div>
            <div class="p-3 text-xs" style="line-height: 1.5; color: var(--text-primary);">
              <div class="fw-bold mb-2 text-blue">{{ uploadResult.mensaje }}</div>
              <div style="display: grid; grid-template-columns: 1fr auto; gap: 0.25rem; border-top: 1px solid var(--bevel-light); padding-top: 0.25rem;">
                <span>Pedidos Nuevos Registrados:</span>
                <span class="fw-bold text-green">{{ uploadResult.pedidosRegistrados }}</span>
                <span>Pedidos Duplicados (Omitidos):</span>
                <span class="fw-bold text-orange">{{ uploadResult.pedidosOmitidos }}</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- ============================================== -->
      <!-- COLUMNA DERECHA: HISTORIAL DE PEDIDOS          -->
      <!-- ============================================== -->
      <div class="card list-column">
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
          <span class="card-title">Historial de Pedidos ({{ filteredAndSortedPedidos.length }})</span>
          <div style="display: flex; align-items: center; gap: 0.3rem; background: var(--bg-window); padding: 0.1rem 0.3rem; box-shadow: var(--inset-shadow); height: 26px;">
            <i class="ph ph-magnifying-glass" style="color: var(--text-secondary); font-size: 0.8rem;"></i>
            <input 
              type="text" 
              v-model="searchQuery" 
              placeholder="Buscar por código, sucursal..." 
              style="border: none; outline: none; font-size: 0.85rem; background: transparent; width: 180px; color: var(--text-primary);"
            />
            <button v-if="searchQuery" @click="searchQuery = ''" style="background: none; border: none; cursor: pointer; color: var(--text-muted); display: flex; align-items: center;">
              <i class="ph ph-x-circle"></i>
            </button>
          </div>
        </div>

        <div class="table-container" style="max-height: 600px; overflow-y: auto;">
          <table v-if="!loading && filteredAndSortedPedidos.length > 0">
            <thead>
              <tr>
                <th style="width: 40px;" class="text-center">Items</th>
                <th @click="sortBy('codigo')" class="sortable">Código / ID <i v-if="sortKey === 'codigo'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i></th>
                <th @click="sortBy('fecha')" class="sortable">Fecha <i v-if="sortKey === 'fecha'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i></th>
                <th @click="sortBy('sucursal')" class="sortable">Sucursal <i v-if="sortKey === 'sucursal'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i></th>
                <th @click="sortBy('estado')" class="sortable">Estado <i v-if="sortKey === 'estado'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i></th>
                <th class="text-center" style="width: 100px;">Productos</th>
              </tr>
            </thead>
            <tbody>
              <!-- Iteración de Pedidos -->
              <template v-for="p in filteredAndSortedPedidos" :key="p.id">
                <tr :class="{'bg-active-row': expandedPedidos[p.id]}">
                  <td class="text-center">
                    <button 
                      class="icon-btn" 
                      style="min-height: auto; padding: 0.25rem; font-size: 0.9rem;"
                      @click="togglePedidoExpand(p.id)"
                    >
                      <i :class="['ph', expandedPedidos[p.id] ? 'ph-caret-down' : 'ph-caret-right']"></i>
                    </button>
                  </td>
                  <td><strong>{{ p.codigo }}</strong></td>
                  <td>{{ formatDate(p.fecha) }}</td>
                  <td>{{ p.sucursal || '-' }}</td>
                  <td>
                    <span :class="['badge', getEstadoBadgeClass(p.estado)]">
                      {{ p.estado }}
                    </span>
                  </td>
                  <td class="text-center">
                    <span class="badge badge-secondary fw-bold" style="font-size: 0.75rem;">
                      {{ p.items ? p.items.length : 0 }} items
                    </span>
                  </td>
                </tr>

                <!-- Detalle Desplegable (Accordion) del Pedido -->
                <tr v-if="expandedPedidos[p.id]" class="detail-row">
                  <td colspan="6" style="padding: 0.5rem 1rem; background-color: var(--bg-secondary);">
                    <div class="card" style="box-shadow: var(--inset-shadow); border: 1px solid var(--bevel-dark); background: var(--bg-window);">
                      <div class="card-header" style="background-color: var(--bevel-dark); padding: 0.25rem 0.5rem; display: flex; justify-content: space-between;">
                        <span style="font-size: 0.75rem; font-weight: bold; color: white;">Productos de la Orden [{{ p.codigo }}]</span>
                      </div>
                      
                      <!-- Listado de Productos del Pedido -->
                      <table class="sub-table" style="width: 100%; border: none;">
                        <thead>
                          <tr style="background-color: var(--bg-secondary);">
                            <th style="font-size: 0.75rem; padding: 0.25rem 0.5rem;">Cód. Producto</th>
                            <th style="font-size: 0.75rem; padding: 0.25rem 0.5rem;">Descripción del Producto</th>
                            <th style="font-size: 0.75rem; padding: 0.25rem 0.5rem;" class="text-right">Pieza(s)</th>
                            <th style="font-size: 0.75rem; padding: 0.25rem 0.5rem;" class="text-right">Fracción (Unidades)</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="item in p.items" :key="item.id" style="border-bottom: 1px solid var(--bg-secondary);">
                            <td style="font-size: 0.75rem; padding: 0.3rem 0.5rem;">
                              <strong>{{ item.codigo_producto }}</strong>
                            </td>
                            <td style="font-size: 0.75rem; padding: 0.3rem 0.5rem; max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                              <span v-if="item.Producto?.nombre?.includes('AUTOCREADO')" class="text-orange" title="El producto fue auto-creado porque no existía en el catálogo inicial">
                                <i class="ph ph-warning-circle"></i> {{ item.Producto?.nombre }}
                              </span>
                              <span v-else>{{ item.Producto?.nombre || 'Sin nombre cargado' }}</span>
                            </td>
                            <td style="font-size: 0.75rem; padding: 0.3rem 0.5rem;" class="text-right fw-bold text-muted">
                              {{ item.pieza }}
                            </td>
                            <td style="font-size: 0.75rem; padding: 0.3rem 0.5rem;" class="text-right fw-bold text-blue">
                              {{ parseFloat(item.fraccion).toFixed(3) }} unidades
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>

          <!-- Cargando -->
          <div v-if="loading" class="loading-state">
            <i class="ph ph-spinner spinner icon-xl"></i>
            Cargando registros de pedidos...
          </div>

          <!-- Historial Vacío -->
          <div v-if="!loading && filteredAndSortedPedidos.length === 0" class="empty-state">
            <i class="ph ph-file-xls icon-xl"></i>
            No se encontraron pedidos registrados. ¡Importa una planilla Excel a la izquierda!
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// Estados reactivos
const pedidos = ref([])
const loading = ref(false)
const uploading = ref(false)
const selectedFile = ref(null)
const uploadResult = ref(null)
const expandedPedidos = ref({})
const alert = ref({ show: false, message: '', type: 'success' })

const fileInput = ref(null)

// Búsqueda y Ordenación
const searchQuery = ref('')
const sortKey = ref('fecha')
const sortOrder = ref(-1) // Más recientes primero por defecto

// Mensajes interactivos
const showAlert = (msg, type = 'success') => {
  alert.value = { show: true, message: msg, type }
  setTimeout(() => { alert.value.show = false }, 4000)
}

// Cargar pedidos desde API
const fetchPedidos = async () => {
  loading.value = true
  try {
    const res = await fetch('/api/pedidos')
    if (res.ok) {
      pedidos.value = await res.json()
    } else {
      showAlert('Error al descargar listado de pedidos', 'error')
    }
  } catch (error) {
    console.error('Error fetching pedidos:', error)
    showAlert('Error de conexión con el servidor', 'error')
  } finally {
    loading.value = false
  }
}

// Abrir Selector de Archivos al hacer click en la zona de drop
const triggerFileInput = () => {
  fileInput.value.click()
}

// Archivo Seleccionado
const onFileSelected = (e) => {
  const file = e.target.files[0]
  if (!file) return
  
  // Validar extensión
  const ext = file.name.split('.').pop().toLowerCase()
  if (ext !== 'xlsx' && ext !== 'xls') {
    showAlert('Por favor, selecciona únicamente archivos Excel (.xlsx o .xls)', 'error')
    clearFileSelection()
    return
  }

  selectedFile.value = file
}

const clearFileSelection = () => {
  selectedFile.value = null
  if (fileInput.value) fileInput.value.value = ''
}

// Subida de Archivo Excel FormData
const uploadFile = async () => {
  if (!selectedFile.value) return

  uploading.value = true
  uploadResult.value = null
  
  const formData = new FormData()
  formData.append('file', selectedFile.value)

  try {
    const res = await fetch('/api/pedidos/upload', {
      method: 'POST',
      body: formData // El navegador asigna el boundary y content-type multipart/form-data solo
    })

    const dataRes = await res.json()

    if (res.ok) {
      uploadResult.value = {
        mensaje: dataRes.mensaje || 'Carga completada con éxito.',
        pedidosRegistrados: dataRes.pedidosRegistrados ?? 0,
        pedidosOmitidos: dataRes.pedidosOmitidos ?? 0
      }
      
      showAlert('Planilla Excel cargada y procesada correctamente')
      clearFileSelection()
      fetchPedidos() // Recargar historial de pedidos
    } else {
      showAlert(dataRes.error || dataRes.mensaje || 'Ocurrió un error al procesar el Excel', 'error')
    }
  } catch (error) {
    console.error('Error uploading file:', error)
    showAlert('Error de red o conexión al subir el archivo', 'error')
  } finally {
    uploading.value = false
  }
}

// Expandir o Contraer items de Pedidos
const togglePedidoExpand = (id) => {
  expandedPedidos.value[id] = !expandedPedidos.value[id]
}

// Auxiliares
const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const parts = dateStr.split('T')[0].split('-')
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`
  }
  return dateStr
}

const getEstadoBadgeClass = (estado) => {
  if (estado === 'Pendiente') return 'badge-warning'
  if (estado === 'Completado') return 'badge-success'
  if (estado === 'Procesando') return 'badge-primary'
  return 'badge-secondary'
}

// Buscador predictivo reactivo
const filteredAndSortedPedidos = computed(() => {
  let result = [...pedidos.value]

  // Búsqueda interactiva (busca en código de pedido, sucursal o códigos de productos del pedido)
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    result = result.filter(p => {
      const codeMatch = p.codigo ? p.codigo.toLowerCase().includes(query) : false
      const sucursalMatch = p.sucursal ? p.sucursal.toLowerCase().includes(query) : false
      const statusMatch = p.estado ? p.estado.toLowerCase().includes(query) : false
      const itemMatch = p.items ? p.items.some(item => 
        item.codigo_producto.toLowerCase().includes(query) || 
        (item.Producto?.nombre && item.Producto.nombre.toLowerCase().includes(query))
      ) : false

      return codeMatch || sucursalMatch || statusMatch || itemMatch
    })
  }

  // Ordenación interactiva
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

const sortBy = (key) => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value * -1
  } else {
    sortKey.value = key
    sortOrder.value = 1
  }
}

onMounted(() => {
  fetchPedidos()
})
</script>

<style scoped>
.pedidos-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
  align-items: start;
}

@media (min-width: 992px) {
  .pedidos-grid {
    grid-template-columns: 4fr 8fr;
  }
}

.form-column {
  position: sticky;
  top: 0.5rem;
}

.list-column {
  min-height: 350px;
}

/* Dropzone de Carga de Archivos */
.file-dropzone {
  border: 2px dashed var(--bevel-dark);
  background: var(--bg-window);
  box-shadow: var(--inset-shadow);
  padding: 1.5rem;
  text-align: center;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.file-dropzone:hover {
  background-color: var(--bg-secondary);
  border-color: var(--accent-primary-hover);
}

.bg-active-row {
  background-color: var(--bg-secondary) !important;
}

/* Cabeceras de tabla interactivas */
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

/* Estilo Subtabla de Items en Acordeón */
.sub-table th {
  background-color: var(--bg-secondary) !important;
  color: var(--text-secondary);
  font-weight: bold;
  border-bottom: 1px solid var(--bevel-dark);
  border-top: none;
}

.sub-table td {
  border: none;
  background: transparent !important;
}

.sub-table tr:hover {
  background-color: var(--bg-secondary) !important;
}

.text-xs {
  font-size: 0.75rem;
}

.text-blue {
  color: var(--accent-primary) !important;
}

.text-orange {
  color: var(--accent-orange) !important;
}

.text-green {
  color: var(--accent-success) !important;
}
</style>
