<template>
  <div class="page-container animate-fade">
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title">Gestión de Sucursales</h2>
        <p class="page-description">Administra las sucursales vinculadas en el sistema.</p>
      </div>
      <div class="header-actions mt-2">
        <button class="btn btn-primary" @click="openModal()">
          <i class="ph ph-plus"></i> Nueva Sucursal
        </button>
      </div>
    </div>

    <!-- Alertas -->
    <div v-if="alert.show" :class="['alert-box mb-4', alert.type]">
      {{ alert.message }}
    </div>

    <!-- Lista de Sucursales -->
    <div class="card mt-4">
      <div class="table-container">
        <table v-if="!loading && sucursales.length > 0">
          <thead>
            <tr>
              <th style="width: 80px;" class="text-center">ID</th>
              <th style="width: 100px;" class="text-center">Número</th>
              <th>Nombre de la Sucursal</th>
              <th>Dirección</th>
              <th>Email</th>
              <th>Ubicación</th>
              <th class="text-right" style="width: 150px;">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="suc in sucursales" :key="suc.id">
              <td class="text-center"><strong>{{ suc.id }}</strong></td>
              <td class="text-center"><span class="badge" style="background-color: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--border-color);">{{ suc.numero || '-' }}</span></td>
              <td>{{ suc.sucursal }}</td>
              <td>{{ suc.direccion || 'Sin dirección registrada' }}</td>
              <td>{{ suc.email || 'Sin email registrado' }}</td>
              <td>
                <span class="badge" style="background-color: var(--bg-secondary); color: var(--accent-primary); border: 1px solid var(--border-color);" v-if="suc.Ubicacion">
                  {{ suc.Ubicacion.nombre }}
                </span>
                <span class="text-muted text-xs" v-else>Ninguna / Global</span>
              </td>
              <td class="text-right">
                  <div class="action-buttons" style="justify-content: flex-end; gap: 0.25rem;">
                    <button class="btn-icon" @click="openPermisosModal(suc)" title="Habilitar Productos" style="color: var(--accent-primary);">
                      <i class="ph ph-list-checks" style="font-size: 1.15rem;"></i>
                    </button>
                    <button class="btn-icon btn-edit" @click="openModal(suc)" title="Editar">
                      <i class="ph ph-pencil-simple"></i>
                    </button>
                    <button class="btn-icon btn-delete" @click="deleteSucursal(suc.id)" title="Eliminar">
                      <i class="ph ph-trash"></i>
                    </button>
                  </div>
              </td>
            </tr>
          </tbody>
        </table>
        
        <div v-if="!loading && sucursales.length === 0" class="empty-state">
          <i class="ph ph-storefront icon-xl"></i>
          No hay sucursales registradas.
        </div>
        
        <div v-if="loading" class="loading-state">
          <i class="ph ph-spinner spinner icon-xl"></i>
          Cargando sucursales...
        </div>
      </div>
    </div>

    <!-- Modal Nuevo / Editar -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content animate-slide-up" style="max-width: 500px;">
        <div class="modal-header">
          <h3 class="modal-title">{{ isEditing ? 'Editar Sucursal' : 'Nueva Sucursal' }}</h3>
          <button class="btn-icon" @click="closeModal">
            <i class="ph ph-x"></i>
          </button>
        </div>
        
        <div class="modal-body" style="display: flex; flex-direction: column; gap: 1rem;">
          <div class="form-group">
            <label class="form-label">Nombre de la Sucursal *</label>
            <input 
              type="text" 
              class="form-input" 
              v-model="currentSucursal.sucursal" 
              placeholder="Ej. Sucursal Flores"
              required
              autofocus
            >
          </div>

          <div class="form-group">
            <label class="form-label">Número de Sucursal</label>
            <input 
              type="number" 
              class="form-input" 
              v-model.number="currentSucursal.numero" 
              placeholder="Ej. 104"
            >
          </div>

          <div class="form-group">
            <label class="form-label">Dirección</label>
            <input 
              type="text" 
              class="form-input" 
              v-model="currentSucursal.direccion" 
              placeholder="Ej. Av. Rivadavia 1234"
            >
          </div>

          <div class="form-group">
            <label class="form-label">Email</label>
            <input 
              type="email" 
              class="form-input" 
              v-model="currentSucursal.email" 
              placeholder="Ej. sucursal.flores@example.com"
            >
          </div>

          <div class="form-group">
            <label class="form-label">Ubicación (Centro de Distribución)</label>
            <select class="form-input" v-model="currentSucursal.id_ubicacion">
              <option :value="null">Ninguna / Global</option>
              <option v-for="ub in ubicaciones" :key="ub.id" :value="ub.id">
                {{ ub.nombre }} (Ubicación N° {{ ub.numero }})
              </option>
            </select>
          </div>
        </div>
        
        <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1.5rem;">
          <button class="btn btn-secondary" @click="closeModal">Cancelar</button>
          <button class="btn btn-primary" @click="saveSucursal" :disabled="saving">
            <i class="ph ph-spinner spinner" v-if="saving"></i>
            <i class="ph ph-floppy-disk" v-else></i> 
            {{ isEditing ? 'Actualizar' : 'Guardar' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Permisos de Productos -->
    <div v-if="showPermisosModal" class="modal-overlay" @click.self="closePermisosModal">
      <div class="modal-content animate-slide-up" style="max-width: 600px; display: flex; flex-direction: column; max-height: 85vh; padding: 1.5rem; box-sizing: border-box;">
        <div class="modal-header" style="margin-bottom: 1rem;">
          <h3 class="modal-title">Habilitar Productos: {{ currentSucursal.sucursal }}</h3>
          <button class="btn-icon" @click="closePermisosModal">
            <i class="ph ph-x"></i>
          </button>
        </div>
        
        <div style="margin-bottom: 1rem; display: flex; gap: 0.5rem; width: 100%;">
          <!-- Buscador de productos en el modal -->
          <div style="display: flex; align-items: center; gap: 0.3rem; background: var(--bg-window); padding: 0.4rem 0.6rem; box-shadow: var(--inset-shadow); border-radius: 0; border: 1px solid var(--border-color); flex: 1;">
            <i class="ph ph-magnifying-glass" style="color: var(--text-secondary); font-size: 0.9rem;"></i>
            <input 
              type="text" 
              v-model="searchProductQuery" 
              placeholder="Buscar producto por nombre o código..." 
              style="border: none; outline: none; font-size: 0.85rem; background: transparent; width: 100%; color: var(--text-primary);"
            />
          </div>
          <button class="btn btn-secondary btn-sm" @click="toggleSelectAllPermisos" style="font-size: 0.75rem; white-space: nowrap;">
            {{ allPermisosSelected ? 'Desmarcar Todos' : 'Marcar Todos' }}
          </button>
        </div>

        <div class="modal-body" style="flex: 1; overflow-y: auto; padding-right: 0.5rem; display: flex; flex-direction: column; gap: 0.5rem; max-height: 50vh;">
          <div v-if="loadingPermisos" class="loading-state text-center" style="padding: 2rem 0;">
            <i class="ph ph-spinner spinner icon-xl text-primary"></i>
            <p class="text-xs text-muted mt-2">Cargando catálogo de productos...</p>
          </div>

          <div v-else-if="filteredProductPermisos.length === 0" class="empty-state text-center" style="padding: 2rem 0;">
            No se encontraron productos.
          </div>

          <div v-else v-for="prod in filteredProductPermisos" :key="prod.codigo" 
               style="display: flex; align-items: center; justify-content: space-between; padding: 0.5rem; border-bottom: 1px solid var(--bevel-light); cursor: pointer;"
               @click="prod.habilitado = !prod.habilitado"
          >
            <div style="display: flex; flex-direction: column; gap: 0.1rem; text-align: left;">
              <strong style="font-size: 0.85rem; color: var(--text-primary);">{{ prod.nombre }}</strong>
              <span style="font-size: 0.72rem; color: var(--text-muted); font-family: monospace;">{{ prod.codigo }}</span>
            </div>
            <input 
              type="checkbox" 
              v-model="prod.habilitado" 
              @click.stop
              style="width: 18px; height: 18px; cursor: pointer;"
            />
          </div>
        </div>
        
        <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1.5rem; border-top: 1px solid var(--border-color); padding-top: 1rem;">
          <button class="btn btn-secondary" @click="closePermisosModal">Cancelar</button>
          <button class="btn btn-primary" @click="savePermisos" :disabled="savingPermisos">
            <i class="ph ph-spinner spinner" v-if="savingPermisos"></i>
            <i class="ph ph-floppy-disk" v-else></i> 
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useWinDialog } from '../composables/useWinDialog'

const { winConfirm } = useWinDialog()

const sucursales = ref([])
const ubicaciones = ref([])
const loading = ref(true)
const saving = ref(false)
const alert = ref({ show: false, message: '', type: 'success' })

// Estado del Modal
const showModal = ref(false)
const isEditing = ref(false)
const currentSucursal = ref({ id: null, sucursal: '', numero: null, direccion: '', email: '', id_ubicacion: null })

const showAlert = (msg, type = 'success') => {
  alert.value = { show: true, message: msg, type }
  setTimeout(() => { alert.value.show = false }, 3000)
}

const fetchSucursales = async () => {
  loading.value = true
  try {
    const res = await fetch('/api/sucursales')
    if (!res.ok) throw new Error('Error al cargar sucursales')
    sucursales.value = await res.json()
  } catch (error) {
    console.error(error)
    showAlert('Error al cargar sucursales', 'error')
  } finally {
    loading.value = false
  }
}

const fetchUbicaciones = async () => {
  try {
    const res = await fetch('/api/ubicaciones')
    if (res.ok) {
      ubicaciones.value = await res.json()
    }
  } catch (error) {
    console.error('Error al cargar ubicaciones:', error)
  }
}

const openModal = (suc = null) => {
  if (suc) {
    isEditing.value = true
    currentSucursal.value = { ...suc }
  } else {
    isEditing.value = false
    currentSucursal.value = { id: null, sucursal: '', numero: null, direccion: '', email: '', id_ubicacion: null }
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  currentSucursal.value = { id: null, sucursal: '', numero: null, direccion: '', email: '', id_ubicacion: null }
}

const saveSucursal = async () => {
  if (!currentSucursal.value.sucursal.trim()) {
    showAlert('El nombre de la sucursal es obligatorio', 'error')
    return
  }

  saving.value = true
  try {
    const url = isEditing.value 
      ? `/api/sucursales/${currentSucursal.value.id}` 
      : '/api/sucursales'
      
    const method = isEditing.value ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sucursal: currentSucursal.value.sucursal,
        numero: currentSucursal.value.numero,
        direccion: currentSucursal.value.direccion,
        email: currentSucursal.value.email,
        id_ubicacion: currentSucursal.value.id_ubicacion
      })
    })

    if (!res.ok) throw new Error('Error al guardar la sucursal')

    showAlert(isEditing.value ? 'Sucursal actualizada' : 'Sucursal creada')
    closeModal()
    fetchSucursales()
  } catch (error) {
    console.error(error)
    showAlert('Error al guardar', 'error')
  } finally {
    saving.value = false
  }
}

const deleteSucursal = async (id) => {
  if (!await winConfirm('¿Estás seguro de eliminar esta sucursal?', 'Eliminar Sucursal')) return

  try {
    const res = await fetch(`/api/sucursales/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Error al eliminar')
    showAlert('Sucursal eliminada')
    fetchSucursales()
  } catch (error) {
    console.error(error)
    showAlert('Error al eliminar', 'error')
  }
}

// Estados y funciones para la gestión de permisos de productos
const showPermisosModal = ref(false)
const loadingPermisos = ref(false)
const savingPermisos = ref(false)
const productPermisos = ref([])
const searchProductQuery = ref('')

const filteredProductPermisos = computed(() => {
  const q = searchProductQuery.value.trim().toLowerCase()
  if (!q) return productPermisos.value
  return productPermisos.value.filter(p => 
    p.nombre?.toLowerCase().includes(q) || p.codigo?.toLowerCase().includes(q)
  )
})

const allPermisosSelected = computed(() => {
  if (productPermisos.value.length === 0) return false
  return productPermisos.value.every(p => p.habilitado)
})

const toggleSelectAllPermisos = () => {
  const targetVal = !allPermisosSelected.value
  productPermisos.value.forEach(p => {
    p.habilitado = targetVal
  })
}

const openPermisosModal = async (suc) => {
  currentSucursal.value = { ...suc }
  showPermisosModal.value = true
  loadingPermisos.value = true
  searchProductQuery.value = ''
  try {
    const res = await fetch(`/api/sucursales/${suc.id}/productos`)
    if (res.ok) {
      productPermisos.value = await res.json()
    } else {
      throw new Error('Error al cargar productos habilitados')
    }
  } catch (error) {
    console.error(error)
    showAlert('Error al cargar permisos de productos', 'error')
    closePermisosModal()
  } finally {
    loadingPermisos.value = false
  }
}

const closePermisosModal = () => {
  showPermisosModal.value = false
  productPermisos.value = []
  searchProductQuery.value = ''
}

const savePermisos = async () => {
  savingPermisos.value = true
  try {
    const codigosHabilitados = productPermisos.value
      .filter(p => p.habilitado)
      .map(p => p.codigo)

    const res = await fetch(`/api/sucursales/${currentSucursal.value.id}/productos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigos: codigosHabilitados })
    })

    if (!res.ok) throw new Error('Error al guardar permisos')

    showAlert('Permisos de productos actualizados correctamente')
    closePermisosModal()
  } catch (error) {
    console.error(error)
    showAlert('Error al guardar permisos de productos', 'error')
  } finally {
    savingPermisos.value = false
  }
}

onMounted(() => {
  fetchSucursales()
  fetchUbicaciones()
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
}
.modal-content {
  background-color: var(--bg-window);
  border-radius: 0;
  padding: 1.5rem;
  width: 90%;
  box-shadow: 0 10px 25px rgba(0,0,0,0.2);
  border: 1px solid var(--border-color);
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 1rem;
}
.modal-title {
  margin: 0;
  font-size: 1.25rem;
  color: var(--text-primary);
}
</style>
