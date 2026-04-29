<script setup>
import { ref, onMounted } from 'vue'
import { useWinDialog } from '../composables/useWinDialog'

const { winConfirm } = useWinDialog()

const activeTab = ref('colaboradores') // 'colaboradores' | 'productos' | 'sucursales'

// --- ESTADO COLABORADORES ---
const colaboradores = ref([])
const loadingColab = ref(false)
const showFormColab = ref(false)
const formColab = ref({ id_colaborador: null, nombre: '', puesto: '' })
const isEditingColab = ref(false)

// --- ESTADO PRODUCTOS ---
const productos = ref([])
const loadingProd = ref(false)
const showFormProd = ref(false)
const showUploadProd = ref(false)
const formProd = ref({ codigo_interno: '', codigo_proveedor: '', descripcion: '', categoria: '' })
const selectedFile = ref(null)
const isUploading = ref(false)

// --- ESTADO SUCURSALES ---
const sucursales = ref([])
const loadingSuc = ref(false)
const showFormSuc = ref(false)
const formSuc = ref({ id_sucursal: null, nombre: '', ubicacion: '' })
const isEditingSuc = ref(false)

// --- MENSAJES ---
const mensaje = ref({ tipo: '', texto: '' }) // tipo: 'success' | 'error'

const mostrarMensaje = (tipo, texto) => {
  mensaje.value = { tipo, texto }
  setTimeout(() => { mensaje.value = { tipo: '', texto: '' } }, 4000)
}

// ==========================================
// MÉTODOS PARA COLABORADORES
// ==========================================
const cargarColaboradores = async () => {
  loadingColab.value = true
  try {
    const res = await fetch('/api/colaboradores')
    if (res.ok) colaboradores.value = await res.json()
  } catch (error) {
    console.error(error)
  } finally {
    loadingColab.value = false
  }
}

const abrirNuevoColaborador = () => {
  isEditingColab.value = false
  formColab.value = { id_colaborador: null, nombre: '', puesto: '' }
  showFormColab.value = true
}

const editarColaborador = (colab) => {
  isEditingColab.value = true
  formColab.value = { ...colab }
  showFormColab.value = true
}

const guardarColaborador = async () => {
  const url = isEditingColab.value 
    ? `/api/colaboradores/${formColab.value.id_colaborador}` 
    : '/api/colaboradores'
  const method = isEditingColab.value ? 'PUT' : 'POST'

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: formColab.value.nombre,
        puesto: formColab.value.puesto
      })
    })

    if (res.ok) {
      mostrarMensaje('success', `Colaborador ${isEditingColab.value ? 'actualizado' : 'creado'} con éxito.`)
      showFormColab.value = false
      cargarColaboradores()
    } else {
      mostrarMensaje('error', 'Error al guardar el colaborador.')
    }
  } catch (error) {
    console.error(error)
    mostrarMensaje('error', 'Error de red al guardar colaborador.')
  }
}

// ==========================================
// MÉTODOS PARA PRODUCTOS
// ==========================================
const cargarProductos = async () => {
  loadingProd.value = true
  try {
    const res = await fetch('/api/productos')
    if (res.ok) productos.value = await res.json()
  } catch (error) {
    console.error(error)
  } finally {
    loadingProd.value = false
  }
}

const abrirNuevoProducto = () => {
  showUploadProd.value = false
  formProd.value = { codigo_interno: '', codigo_proveedor: '', descripcion: '', categoria: '' }
  showFormProd.value = true
}

const abrirCargaMasiva = () => {
  showFormProd.value = false
  selectedFile.value = null
  showUploadProd.value = true
}

const handleFileUpload = (event) => {
  const file = event.target.files[0] || event.dataTransfer?.files[0]
  if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
    selectedFile.value = file
  } else {
    mostrarMensaje('error', 'Por favor, selecciona un archivo CSV válido.')
  }
}

const subirCSV = async () => {
  if (!selectedFile.value) return
  isUploading.value = true

  const formData = new FormData()
  formData.append('file', selectedFile.value)

  try {
    const res = await fetch('/api/upload/productos', {
      method: 'POST',
      body: formData // No se envía Content-Type, el navegador lo calcula para FormData
    })

    const data = await res.json()

    if (res.ok) {
      mostrarMensaje('success', `Carga exitosa. ${data.filas_insertadas || 0} productos insertados.`)
      showUploadProd.value = false
      cargarProductos()
    } else {
      mostrarMensaje('error', data.error || 'Error al subir el archivo CSV.')
    }
  } catch (error) {
    console.error(error)
    mostrarMensaje('error', 'Error de red durante la carga masiva.')
  } finally {
    isUploading.value = false
    selectedFile.value = null
  }
}

const guardarProducto = async () => {
  try {
    const res = await fetch('/api/productos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formProd.value)
    })

    if (res.ok) {
      mostrarMensaje('success', 'Producto creado con éxito.')
      showFormProd.value = false
      cargarProductos()
    } else {
      mostrarMensaje('error', 'Error al guardar el producto.')
    }
  } catch (error) {
    console.error(error)
    mostrarMensaje('error', 'Error de red al guardar producto.')
  }
}

// ==========================================
// MÉTODOS PARA SUCURSALES
// ==========================================
const cargarSucursales = async () => {
  loadingSuc.value = true
  try {
    const res = await fetch('/api/sucursales')
    if (res.ok) sucursales.value = await res.json()
  } catch (error) {
    console.error(error)
  } finally {
    loadingSuc.value = false
  }
}

const abrirNuevaSucursal = () => {
  isEditingSuc.value = false
  formSuc.value = { id_sucursal: null, nombre: '', ubicacion: '' }
  showFormSuc.value = true
}

const editarSucursal = (suc) => {
  isEditingSuc.value = true
  formSuc.value = { ...suc }
  showFormSuc.value = true
}

const guardarSucursal = async () => {
  const url = isEditingSuc.value 
    ? `/api/sucursales/${formSuc.value.id_sucursal}` 
    : '/api/sucursales'
  const method = isEditingSuc.value ? 'PUT' : 'POST'

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: formSuc.value.nombre,
        ubicacion: formSuc.value.ubicacion
      })
    })

    if (res.ok) {
      mostrarMensaje('success', `Sucursal ${isEditingSuc.value ? 'actualizada' : 'creada'} con éxito.`)
      showFormSuc.value = false
      cargarSucursales()
    } else {
      mostrarMensaje('error', 'Error al guardar la sucursal.')
    }
  } catch (error) {
    console.error(error)
    mostrarMensaje('error', 'Error de red al guardar sucursal.')
  }
}

const eliminarSucursal = async (id) => {
  if (!await winConfirm('¿Estás seguro de eliminar esta sucursal?', 'Eliminar Sucursal')) return
  try {
    const res = await fetch(`/api/sucursales/${id}`, { method: 'DELETE' })
    if (res.ok) {
      mostrarMensaje('success', 'Sucursal eliminada.')
      cargarSucursales()
    } else {
      mostrarMensaje('error', 'Error al eliminar sucursal.')
    }
  } catch (error) {
    console.error(error)
  }
}

onMounted(() => {
  cargarColaboradores()
  cargarProductos()
  cargarSucursales()
})
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title">ABM Datos Globales</h2>
        <p class="page-description">Gestión de Catálogos y Maestros del Sistema (Productos, Fiambreros y Sucursales).</p>
      </div>
    </div>

    <!-- Pestañas -->
    <div class="tabs">
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'colaboradores' }"
        @click="activeTab = 'colaboradores'"
      >
        <i class="ph-users"></i> Colaboradores
      </button>
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'productos' }"
        @click="activeTab = 'productos'"
      >
        <i class="ph-package"></i> Productos
      </button>
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'sucursales' }"
        @click="activeTab = 'sucursales'"
      >
        <i class="ph-storefront"></i> Sucursales
      </button>
    </div>

    <!-- Mensajes de Sistema -->
    <div v-if="mensaje.texto" class="alert" :class="mensaje.tipo === 'success' ? 'alert-success' : 'alert-danger'">
      <i :class="mensaje.tipo === 'success' ? 'ph-check-circle' : 'ph-warning-circle'"></i>
      {{ mensaje.texto }}
    </div>

    <!-- ========================================== -->
    <!-- PANEL COLABORADORES -->
    <!-- ========================================== -->
    <div v-show="activeTab === 'colaboradores'" class="panel-content">
      
      <!-- Listado -->
      <div v-if="!showFormColab" class="card">
        <div class="card-header">
          <h3 class="card-title">Listado de Colaboradores</h3>
          <button class="btn btn-primary btn-sm" @click="abrirNuevoColaborador">
            <i class="ph-plus"></i> Nuevo Colaborador
          </button>
        </div>
        <div class="table-container">
          <div v-if="loadingColab" class="loading-state">Cargando...</div>
          <table v-else>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Puesto</th>
                <th class="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="colab in colaboradores" :key="colab.id_colaborador">
                <td class="text-muted">#{{ colab.id_colaborador }}</td>
                <td class="fw-medium">{{ colab.nombre }}</td>
                <td><span class="badge badge-primary">{{ colab.puesto }}</span></td>
                <td class="text-right">
                  <button class="icon-btn" @click="editarColaborador(colab)" title="Editar">
                    <i class="ph-pencil-simple"></i>
                  </button>
                </td>
              </tr>
              <tr v-if="colaboradores.length === 0">
                <td colspan="4" class="text-center text-muted py-4">No hay colaboradores registrados.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Formulario Colaborador -->
      <div v-if="showFormColab" class="card form-card">
        <div class="card-header">
          <h3 class="card-title">{{ isEditingColab ? 'Editar Colaborador' : 'Nuevo Colaborador' }}</h3>
          <button class="btn btn-outline btn-sm" @click="showFormColab = false">Cancelar</button>
        </div>
        <form @submit.prevent="guardarColaborador" class="p-4">
          <div class="form-row">
            <div class="form-group flex-1">
              <label class="form-label">Nombre Completo</label>
              <input type="text" class="form-control" v-model="formColab.nombre" required placeholder="Ej: Carlos Alberto">
            </div>
            <div class="form-group flex-1">
              <label class="form-label">Puesto</label>
              <input type="text" class="form-control" v-model="formColab.puesto" required placeholder="Ej: Fiambrero">
            </div>
          </div>
          <div class="form-actions mt-4">
            <button type="submit" class="btn btn-primary">
              <i class="ph-floppy-disk"></i> Guardar
            </button>
          </div>
        </form>
      </div>

    </div>

    <!-- ========================================== -->
    <!-- PANEL PRODUCTOS -->
    <!-- ========================================== -->
    <div v-show="activeTab === 'productos'" class="panel-content">
      
      <!-- Listado -->
      <div v-if="!showFormProd && !showUploadProd" class="card">
        <div class="card-header">
          <h3 class="card-title">Listado de Productos</h3>
          <div class="header-actions-group">
            <button class="btn btn-outline btn-sm" @click="abrirCargaMasiva">
              <i class="ph-upload-simple"></i> Carga Masiva (CSV)
            </button>
            <button class="btn btn-primary btn-sm" @click="abrirNuevoProducto">
              <i class="ph-plus"></i> Nuevo Producto
            </button>
          </div>
        </div>
        <div class="table-container">
          <div v-if="loadingProd" class="loading-state">Cargando...</div>
          <table v-else>
            <thead>
              <tr>
                <th>Cód. Int.</th>
                <th>Cód. Prov.</th>
                <th>Descripción</th>
                <th>Categoría</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="prod in productos" :key="prod.id_producto">
                <td class="fw-medium text-blue">{{ prod.codigo_interno }}</td>
                <td class="text-muted">{{ prod.codigo_proveedor || '-' }}</td>
                <td class="fw-medium">{{ prod.descripcion }}</td>
                <td><span class="badge badge-warning">{{ prod.categoria }}</span></td>
              </tr>
              <tr v-if="productos.length === 0">
                <td colspan="4" class="text-center text-muted py-4">No hay productos registrados.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Área de Carga Masiva (Drag & Drop) -->
      <div v-if="showUploadProd" class="card form-card">
        <div class="card-header">
          <h3 class="card-title">Carga Masiva de Productos (CSV)</h3>
          <button class="btn btn-outline btn-sm" @click="showUploadProd = false">Cancelar</button>
        </div>
        <div class="p-4">
          <div 
            class="dropzone" 
            @dragover.prevent 
            @drop.prevent="handleFileUpload"
            :class="{ 'has-file': selectedFile }"
          >
            <input 
              type="file" 
              id="csvFileInput" 
              accept=".csv" 
              class="hidden-input" 
              @change="handleFileUpload"
            >
            <label for="csvFileInput" class="dropzone-label">
              <div v-if="!selectedFile" class="dropzone-content">
                <i class="ph-file-csv upload-icon"></i>
                <h4>Arrastra tu archivo CSV aquí</h4>
                <p>o haz clic para buscar en tu computadora</p>
              </div>
              <div v-else class="dropzone-content success-content">
                <i class="ph-check-circle file-ready-icon"></i>
                <h4>Archivo listo para subir</h4>
                <p class="file-name">{{ selectedFile.name }} ({{ (selectedFile.size / 1024).toFixed(2) }} KB)</p>
              </div>
            </label>
          </div>
          
          <div class="form-actions mt-4 text-center">
            <button 
              class="btn btn-primary btn-block" 
              :disabled="!selectedFile || isUploading"
              @click="subirCSV"
            >
              <i v-if="isUploading" class="ph-spinner spinner"></i>
              <i v-else class="ph-cloud-arrow-up"></i>
              {{ isUploading ? 'Procesando...' : 'Iniciar Carga Masiva' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Formulario Producto (Manual) -->
      <div v-if="showFormProd" class="card form-card">
        <div class="card-header">
          <h3 class="card-title">Nuevo Producto</h3>
          <button class="btn btn-outline btn-sm" @click="showFormProd = false">Cancelar</button>
        </div>
        <form @submit.prevent="guardarProducto" class="p-4">
          <div class="form-row">
            <div class="form-group flex-1">
              <label class="form-label">Código Interno</label>
              <input type="text" class="form-control" v-model="formProd.codigo_interno" required placeholder="Ej: 1010">
            </div>
            <div class="form-group flex-1">
              <label class="form-label">Código Proveedor</label>
              <input type="text" class="form-control" v-model="formProd.codigo_proveedor" placeholder="Opcional">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group flex-2">
              <label class="form-label">Descripción</label>
              <input type="text" class="form-control" v-model="formProd.descripcion" required placeholder="Ej: NUEVO PRODUCTO X KG">
            </div>
            <div class="form-group flex-1">
              <label class="form-label">Categoría</label>
              <input type="text" class="form-control" v-model="formProd.categoria" required placeholder="Ej: FIAM">
            </div>
          </div>
          <div class="form-actions mt-4">
            <button type="submit" class="btn btn-primary">
              <i class="ph-floppy-disk"></i> Guardar Producto
            </button>
          </div>
        </form>
      </div>

    </div>

    <!-- ========================================== -->
    <!-- PANEL SUCURSALES -->
    <!-- ========================================== -->
    <div v-show="activeTab === 'sucursales'" class="panel-content">
      
      <!-- Listado -->
      <div v-if="!showFormSuc" class="card">
        <div class="card-header">
          <h3 class="card-title">Listado de Sucursales</h3>
          <button class="btn btn-primary btn-sm" @click="abrirNuevaSucursal">
            <i class="ph-plus"></i> Nueva Sucursal
          </button>
        </div>
        <div class="table-container">
          <div v-if="loadingSuc" class="loading-state">Cargando...</div>
          <table v-else>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Ubicación</th>
                <th class="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="suc in sucursales" :key="suc.id_sucursal">
                <td class="text-muted">#{{ suc.id_sucursal }}</td>
                <td class="fw-medium">{{ suc.nombre }}</td>
                <td>{{ suc.ubicacion }}</td>
                <td class="text-right">
                  <button class="icon-btn" @click="editarSucursal(suc)" title="Editar">
                    <i class="ph-pencil-simple"></i>
                  </button>
                  <button class="icon-btn text-danger" @click="eliminarSucursal(suc.id_sucursal)" title="Eliminar">
                    <i class="ph-trash"></i>
                  </button>
                </td>
              </tr>
              <tr v-if="sucursales.length === 0">
                <td colspan="4" class="text-center text-muted py-4">No hay sucursales registradas.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Formulario Sucursal -->
      <div v-if="showFormSuc" class="card form-card">
        <div class="card-header">
          <h3 class="card-title">{{ isEditingSuc ? 'Editar Sucursal' : 'Nueva Sucursal' }}</h3>
          <button class="btn btn-outline btn-sm" @click="showFormSuc = false">Cancelar</button>
        </div>
        <form @submit.prevent="guardarSucursal" class="p-4">
          <div class="form-row">
            <div class="form-group flex-1">
              <label class="form-label">Nombre de Sucursal</label>
              <input type="text" class="form-control" v-model="formSuc.nombre" required placeholder="Ej: Sucursal Centro">
            </div>
            <div class="form-group flex-1">
              <label class="form-label">Ubicación / Dirección</label>
              <input type="text" class="form-control" v-model="formSuc.ubicacion" required placeholder="Ej: Av. Principal 123">
            </div>
          </div>
          <div class="form-actions mt-4">
            <button type="submit" class="btn btn-primary">
              <i class="ph-floppy-disk"></i> Guardar Sucursal
            </button>
          </div>
        </form>
      </div>

    </div>

  </div>
</template>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 0.5rem;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.page-description {
  color: var(--text-secondary);
}

.tabs {
  display: flex;
  gap: 0.5rem;
  border-bottom: 1px solid var(--glass-border);
  margin-bottom: 1rem;
}

.tab-btn {
  padding: 0.75rem 1.5rem;
  background: transparent;
  color: var(--text-secondary);
  border: none;
  border-bottom: 2px solid transparent;
  font-weight: 500;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.tab-btn:hover {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.02);
}

.tab-btn.active {
  color: var(--accent-primary);
  border-bottom-color: var(--accent-primary);
}

.panel-content {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}

.form-row {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.flex-1 { flex: 1; }
.flex-2 { flex: 2; }

.btn-sm {
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
}

.icon-btn {
  background: transparent;
  color: var(--text-secondary);
  font-size: 1.25rem;
  padding: 0.25rem;
  border-radius: var(--border-radius-sm);
  transition: all 0.2s;
}

.icon-btn:hover {
  background: var(--bg-tertiary);
  color: var(--accent-primary);
}

.text-danger {
  color: var(--accent-danger) !important;
}

.alert {
  padding: 0.75rem 1rem;
  border-radius: var(--border-radius-md);
  margin-bottom: 1rem;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.alert-success { background-color: rgba(16, 185, 129, 0.1); color: var(--accent-success); border: 1px solid rgba(16, 185, 129, 0.2); }
.alert-danger { background-color: rgba(239, 68, 68, 0.1); color: var(--accent-danger); border: 1px solid rgba(239, 68, 68, 0.2); }

.text-right { text-align: right; }
.text-center { text-align: center; }
.text-muted { color: var(--text-muted); }
.text-blue { color: var(--accent-primary); }
.fw-medium { font-weight: 500; }
.py-4 { padding-top: 1.5rem; padding-bottom: 1.5rem; }
.p-4 { padding: 1.5rem; }
.mt-4 { margin-top: 1rem; }

.loading-state {
  padding: 2rem;
  text-align: center;
  color: var(--text-muted);
}

.header-actions-group {
  display: flex;
  gap: 0.5rem;
}

.dropzone {
  border: 2px dashed var(--glass-border);
  border-radius: var(--border-radius-lg);
  padding: 3rem 2rem;
  text-align: center;
  transition: all 0.3s ease;
  background-color: rgba(0, 0, 0, 0.1);
  position: relative;
}

.dropzone:hover, .dropzone.has-file {
  border-color: var(--accent-primary);
  background-color: rgba(59, 130, 246, 0.05);
}

.dropzone.has-file {
  border-color: var(--accent-success);
  background-color: rgba(16, 185, 129, 0.05);
}

.hidden-input {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
}

.dropzone-label {
  display: block;
  cursor: pointer;
  width: 100%;
  height: 100%;
}

.dropzone-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.upload-icon {
  font-size: 3rem;
  color: var(--text-muted);
  margin-bottom: 0.5rem;
}

.file-ready-icon {
  font-size: 3rem;
  color: var(--accent-success);
  margin-bottom: 0.5rem;
}

.dropzone-content h4 {
  font-size: 1.125rem;
  color: var(--text-primary);
  font-weight: 600;
}

.dropzone-content p {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.file-name {
  color: var(--accent-success) !important;
  font-weight: 500;
}

.btn-block {
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
