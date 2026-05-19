<template>
  <div class="page-container animate-fade">
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title">Gestión de Colaboradores</h2>
        <p class="page-description">Administra el personal del sistema.</p>
      </div>
      <div class="header-actions mt-2">
        <button class="btn btn-primary" @click="openModal()">
          <i class="ph ph-plus"></i> Nuevo Colaborador
        </button>
      </div>
    </div>

    <!-- Alertas -->
    <div v-if="alert.show" :class="['alert-box mb-4', alert.type]">
      {{ alert.message }}
    </div>

    <!-- Lista de Colaboradores -->
    <div class="card mt-4">
      <div class="table-container">
        <table v-if="!loading && colaboradores.length > 0">
          <thead>
            <tr>
              <th style="width: 80px;" class="text-center">ID</th>
              <th>Nombre del Colaborador</th>
              <th class="text-right" style="width: 150px;">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="col in colaboradores" :key="col.id">
              <td class="text-center"><strong>{{ col.id }}</strong></td>
              <td>{{ col.nombre }}</td>
              <td class="text-right">
                <div class="action-buttons" style="justify-content: flex-end;">
                  <button class="btn-icon btn-edit" @click="openModal(col)" title="Editar">
                    <i class="ph ph-pencil-simple"></i>
                  </button>
                  <button class="btn-icon btn-delete" @click="deleteColaborador(col.id)" title="Eliminar">
                    <i class="ph ph-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        
        <div v-if="!loading && colaboradores.length === 0" class="empty-state">
          <i class="ph ph-users icon-xl"></i>
          No hay colaboradores registrados.
        </div>
        
        <div v-if="loading" class="loading-state">
          <i class="ph ph-spinner spinner icon-xl"></i>
          Cargando colaboradores...
        </div>
      </div>
    </div>

    <!-- Modal Nuevo / Editar -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content animate-slide-up" style="max-width: 500px;">
        <div class="modal-header">
          <h3 class="modal-title">{{ isEditing ? 'Editar Colaborador' : 'Nuevo Colaborador' }}</h3>
          <button class="btn-icon" @click="closeModal">
            <i class="ph ph-x"></i>
          </button>
        </div>
        
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Nombre del Colaborador</label>
            <input 
              type="text" 
              class="form-input" 
              v-model="currentColaborador.nombre" 
              placeholder="Ej. Juan Pérez"
              @keyup.enter="saveColaborador"
              autofocus
            >
          </div>
        </div>
        
        <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1.5rem;">
          <button class="btn btn-secondary" @click="closeModal">Cancelar</button>
          <button class="btn btn-primary" @click="saveColaborador" :disabled="saving">
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

const colaboradores = ref([])
const loading = ref(true)
const saving = ref(false)
const alert = ref({ show: false, message: '', type: 'success' })

// Estado del Modal
const showModal = ref(false)
const isEditing = ref(false)
const currentColaborador = ref({ id: null, nombre: '' })

const showAlert = (msg, type = 'success') => {
  alert.value = { show: true, message: msg, type }
  setTimeout(() => { alert.value.show = false }, 3000)
}

const fetchColaboradores = async () => {
  loading.value = true
  try {
    const res = await fetch('/api/colaboradores')
    if (!res.ok) throw new Error('Error al cargar colaboradores')
    colaboradores.value = await res.json()
  } catch (error) {
    console.error(error)
    showAlert('Error al cargar colaboradores', 'error')
  } finally {
    loading.value = false
  }
}

const openModal = (col = null) => {
  if (col) {
    isEditing.value = true
    currentColaborador.value = { ...col }
  } else {
    isEditing.value = false
    currentColaborador.value = { id: null, nombre: '' }
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  currentColaborador.value = { id: null, nombre: '' }
}

const saveColaborador = async () => {
  if (!currentColaborador.value.nombre.trim()) {
    showAlert('El nombre es obligatorio', 'error')
    return
  }

  saving.value = true
  try {
    const url = isEditing.value 
      ? `/api/colaboradores/${currentColaborador.value.id}` 
      : '/api/colaboradores'
      
    const method = isEditing.value ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: currentColaborador.value.nombre })
    })

    if (!res.ok) throw new Error('Error al guardar el colaborador')

    showAlert(isEditing.value ? 'Colaborador actualizado' : 'Colaborador creado')
    closeModal()
    fetchColaboradores()
  } catch (error) {
    console.error(error)
    showAlert('Error al guardar', 'error')
  } finally {
    saving.value = false
  }
}

const deleteColaborador = async (id) => {
  if (!confirm('¿Estás seguro de eliminar este colaborador?')) return

  try {
    const res = await fetch(`/api/colaboradores/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Error al eliminar')
    showAlert('Colaborador eliminado')
    fetchColaboradores()
  } catch (error) {
    console.error(error)
    showAlert('Error al eliminar', 'error')
  }
}

onMounted(() => {
  fetchColaboradores()
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
