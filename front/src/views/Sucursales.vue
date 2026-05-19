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
              <th class="text-right" style="width: 150px;">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="suc in sucursales" :key="suc.id">
              <td class="text-center"><strong>{{ suc.id }}</strong></td>
              <td class="text-center"><span class="badge" style="background-color: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--border-color);">{{ suc.numero || '-' }}</span></td>
              <td>{{ suc.sucursal }}</td>
              <td>{{ suc.direccion || 'Sin dirección registrada' }}</td>
              <td class="text-right">
                <div class="action-buttons" style="justify-content: flex-end;">
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const sucursales = ref([])
const loading = ref(true)
const saving = ref(false)
const alert = ref({ show: false, message: '', type: 'success' })

// Estado del Modal
const showModal = ref(false)
const isEditing = ref(false)
const currentSucursal = ref({ id: null, sucursal: '', numero: null, direccion: '' })

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

const openModal = (suc = null) => {
  if (suc) {
    isEditing.value = true
    currentSucursal.value = { ...suc }
  } else {
    isEditing.value = false
    currentSucursal.value = { id: null, sucursal: '', numero: null, direccion: '' }
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  currentSucursal.value = { id: null, sucursal: '', numero: null, direccion: '' }
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
        direccion: currentSucursal.value.direccion
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
  if (!confirm('¿Estás seguro de eliminar esta sucursal?')) return

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

onMounted(() => {
  fetchSucursales()
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
  border-radius: 12px;
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
