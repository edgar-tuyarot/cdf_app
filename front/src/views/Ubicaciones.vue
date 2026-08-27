<template>
  <div class="page-container animate-fade">
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title">Gestión de Ubicaciones</h2>
        <p class="page-description">Administra los depósitos o centros de distribución (CD) del sistema.</p>
      </div>
      <div class="header-actions mt-2">
        <button class="btn btn-primary" @click="openModal()">
          <i class="ph ph-plus"></i> Nueva Ubicación
        </button>
      </div>
    </div>

    <!-- Alertas -->
    <div v-if="alert.show" :class="['alert-box mb-4', alert.type]">
      {{ alert.message }}
    </div>

    <!-- Lista de Ubicaciones -->
    <div class="card mt-4">
      <div class="table-container">
        <table v-if="!loading && ubicaciones.length > 0">
          <thead>
            <tr>
              <th style="width: 80px;" class="text-center">ID</th>
              <th style="width: 120px;" class="text-center">Número</th>
              <th>Nombre de la Ubicación</th>
              <th class="text-right" style="width: 150px;">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="ub in ubicaciones" :key="ub.id">
              <td class="text-center"><strong>{{ ub.id }}</strong></td>
              <td class="text-center">
                <span class="badge" style="background-color: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--border-color);">
                  {{ ub.numero }}
                </span>
              </td>
              <td>{{ ub.nombre }}</td>
              <td class="text-right">
                <div class="action-buttons" style="justify-content: flex-end; gap: 0.25rem;">
                  <button class="btn-icon btn-edit" @click="openModal(ub)" title="Editar">
                    <i class="ph ph-pencil-simple"></i>
                  </button>
                  <button class="btn-icon btn-delete" @click="deleteUbicacion(ub)" title="Eliminar">
                    <i class="ph ph-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        
        <div v-if="!loading && ubicaciones.length === 0" class="empty-state">
          <i class="ph ph-map-pin icon-xl"></i>
          No hay ubicaciones registradas.
        </div>
        
        <div v-if="loading" class="loading-state">
          <i class="ph ph-spinner spinner icon-xl"></i>
          Cargando ubicaciones...
        </div>
      </div>
    </div>

    <!-- Modal Nuevo / Editar -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content animate-slide-up" style="max-width: 500px;">
        <div class="modal-header">
          <h3 class="modal-title">{{ isEditing ? 'Editar Ubicación' : 'Nueva Ubicación' }}</h3>
          <button class="btn-icon" @click="closeModal">
            <i class="ph ph-x"></i>
          </button>
        </div>
        
        <div class="modal-body" style="display: flex; flex-direction: column; gap: 1rem;">
          <div class="form-group">
            <label class="form-label">Número de Ubicación *</label>
            <input 
              type="number" 
              class="form-input" 
              v-model.number="currentUbicacion.numero" 
              placeholder="Ej. 1"
              required
              autofocus
            >
          </div>

          <div class="form-group">
            <label class="form-label">Nombre de la Ubicación *</label>
            <input 
              type="text" 
              class="form-input" 
              v-model="currentUbicacion.nombre" 
              placeholder="Ej. CD Chaco"
              required
            >
          </div>
        </div>
        
        <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1.5rem;">
          <button class="btn btn-secondary" @click="closeModal">Cancelar</button>
          <button class="btn btn-primary" @click="saveUbicacion" :disabled="saving">
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
import { useWinDialog } from '../composables/useWinDialog'

const { winConfirm } = useWinDialog()

const ubicaciones = ref([])
const loading = ref(false)
const saving = ref(false)
const showModal = ref(false)
const isEditing = ref(false)

const currentUbicacion = ref({
  id: null,
  numero: null,
  nombre: ''
})

const alert = ref({
  show: false,
  message: '',
  type: 'success'
})

const showAlert = (message, type = 'success') => {
  alert.value.message = message
  alert.value.type = type
  alert.value.show = true
  setTimeout(() => {
    alert.value.show = false
  }, 4000)
}

const fetchUbicaciones = async () => {
  loading.value = true
  try {
    const res = await fetch('/api/ubicaciones')
    if (res.ok) {
      ubicaciones.value = await res.json()
    } else {
      showAlert('Error al cargar ubicaciones', 'error')
    }
  } catch (error) {
    console.error('Error:', error)
    showAlert('Error de conexión', 'error')
  } finally {
    loading.value = false
  }
}

const openModal = (ubicacion = null) => {
  if (ubicacion) {
    isEditing.value = true
    currentUbicacion.value = { ...ubicacion }
  } else {
    isEditing.value = false
    currentUbicacion.value = {
      id: null,
      numero: null,
      nombre: ''
    }
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const saveUbicacion = async () => {
  if (currentUbicacion.value.numero === null || currentUbicacion.value.numero === undefined || !currentUbicacion.value.nombre.trim()) {
    showAlert('Por favor, completa todos los campos requeridos', 'error')
    return
  }

  saving.value = true
  const method = isEditing.value ? 'PUT' : 'POST'
  const url = isEditing.value ? `/api/ubicaciones/${currentUbicacion.value.id}` : '/api/ubicaciones'

  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(currentUbicacion.value)
    })

    if (res.ok) {
      showAlert(isEditing.value ? 'Ubicación actualizada correctamente' : 'Ubicación creada correctamente')
      closeModal()
      fetchUbicaciones()
    } else {
      const errData = await res.json()
      showAlert(errData.error || 'Error al guardar la ubicación', 'error')
    }
  } catch (error) {
    console.error('Error:', error)
    showAlert('Error de conexión al guardar', 'error')
  } finally {
    saving.value = false
  }
}

const deleteUbicacion = async (ubicacion) => {
  if (await winConfirm(`¿Estás seguro de que deseas eliminar la ubicación "${ubicacion.nombre}"?`, 'Eliminar Ubicación')) {
    try {
      const res = await fetch(`/api/ubicaciones/${ubicacion.id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        showAlert('Ubicación eliminada correctamente')
        fetchUbicaciones()
      } else {
        const errData = await res.json()
        showAlert(errData.error || 'Error al eliminar la ubicación', 'error')
      }
    } catch (error) {
      console.error('Error:', error)
      showAlert('Error de conexión al eliminar', 'error')
    }
  }
}

onMounted(() => {
  fetchUbicaciones()
})
</script>

<style scoped>
/* Estilos coherentes con el diseño retro Windows 98 */
.page-container {
  padding: 0.5rem;
}
</style>
