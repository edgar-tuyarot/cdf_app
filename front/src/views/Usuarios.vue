<template>
  <div class="page-container animate-fade">
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title">Gestión de Usuarios del Sistema</h2>
        <p class="page-description">Administra los usuarios con acceso de inicio de sesión y sus ubicaciones asociadas.</p>
      </div>
      <div class="header-actions mt-2">
        <button class="btn btn-primary" @click="openModal()">
          <i class="ph ph-user-plus"></i> Nuevo Usuario
        </button>
      </div>
    </div>

    <!-- Alertas -->
    <div v-if="alert.show" :class="['alert-box mb-4', alert.type]">
      {{ alert.message }}
    </div>

    <!-- Lista de Usuarios -->
    <div class="card mt-4">
      <div class="table-container">
        <table v-if="!loading && usuarios.length > 0">
          <thead>
            <tr>
              <th style="width: 80px;" class="text-center">ID</th>
              <th>Nombre de Usuario</th>
              <th>Rol</th>
              <th>Ubicación Asignada</th>
              <th class="text-right" style="width: 150px;">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in usuarios" :key="user.id">
              <td class="text-center"><strong>{{ user.id }}</strong></td>
              <td>{{ user.nombre }}</td>
              <td>
                <span class="badge" style="background-color: var(--accent-primary-light); color: var(--accent-primary); border: 1px solid var(--accent-primary);">
                  {{ user.rol }}
                </span>
              </td>
              <td>
                <span v-if="user.Ubicacion" class="badge" style="background-color: #e2f0d9; color: #385723; border: 1px solid #c5e0b4;">
                  <i class="ph ph-map-pin"></i> [{{ user.Ubicacion.numero }}] {{ user.Ubicacion.nombre }}
                </span>
                <span v-else class="text-muted" style="font-style: italic;">Sin ubicación asignada</span>
              </td>
              <td class="text-right">
                <div class="action-buttons" style="justify-content: flex-end; gap: 0.25rem;">
                  <button class="btn-icon btn-edit" @click="openModal(user)" title="Editar">
                    <i class="ph ph-pencil-simple"></i>
                  </button>
                  <button 
                    class="btn-icon btn-delete" 
                    @click="deleteUsuario(user)" 
                    title="Eliminar"
                    :disabled="user.nombre === 'admin'"
                    :style="user.nombre === 'admin' ? 'opacity: 0.4; cursor: not-allowed;' : ''"
                  >
                    <i class="ph ph-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        
        <div v-if="!loading && usuarios.length === 0" class="empty-state">
          <i class="ph ph-users icon-xl"></i>
          No hay usuarios registrados.
        </div>
        
        <div v-if="loading" class="loading-state">
          <i class="ph ph-spinner spinner icon-xl"></i>
          Cargando usuarios...
        </div>
      </div>
    </div>

    <!-- Modal Nuevo / Editar -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content animate-slide-up" style="max-width: 500px;">
        <div class="modal-header">
          <h3 class="modal-title">{{ isEditing ? 'Editar Usuario' : 'Nuevo Usuario' }}</h3>
          <button class="btn-icon" @click="closeModal">
            <i class="ph ph-x"></i>
          </button>
        </div>
        
        <div class="modal-body" style="display: flex; flex-direction: column; gap: 1rem;">
          <div class="form-group">
            <label class="form-label">Nombre de Usuario *</label>
            <input 
              type="text" 
              class="form-input" 
              v-model="currentUsuario.nombre" 
              placeholder="Ej. juan.perez"
              required
              :disabled="isEditing && currentUsuario.nombre === 'admin'"
              autofocus
            >
          </div>

          <div class="form-group">
            <label class="form-label">
              Contraseña <span v-if="!isEditing">*</span>
              <span v-else style="font-size: 0.75rem; color: var(--text-muted);"> (dejar en blanco para mantener)</span>
            </label>
            <input 
              type="password" 
              class="form-input" 
              v-model="currentUsuario.contrasena" 
              placeholder="Contraseña de acceso"
              :required="!isEditing"
            >
          </div>

          <div class="form-group">
            <label class="form-label">Rol del Usuario *</label>
            <select class="form-input" v-model="currentUsuario.rol" required :disabled="isEditing && currentUsuario.nombre === 'admin'">
              <option value="" disabled>Selecciona un rol</option>
              <option v-for="r in rolesDisponibles" :key="r" :value="r">{{ r }}</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Ubicación Asociada</label>
            <select class="form-input" v-model="currentUsuario.id_ubicacion">
              <option :value="null">Sin ubicación asignada</option>
              <option v-for="ub in ubicaciones" :key="ub.id" :value="ub.id">
                [{{ ub.numero }}] {{ ub.nombre }}
              </option>
            </select>
          </div>
        </div>
        
        <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1.5rem;">
          <button class="btn btn-secondary" @click="closeModal">Cancelar</button>
          <button class="btn btn-primary" @click="saveUsuario" :disabled="saving">
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

const usuarios = ref([])
const ubicaciones = ref([])
const loading = ref(false)
const saving = ref(false)
const showModal = ref(false)
const isEditing = ref(false)

const rolesDisponibles = [
  'Admin',
  'Referente',
  'Preparador',
  'Feteador',
  'Envasador',
  'Colaborador',
  'Usuario',
  'Sucursal'
]

const currentUsuario = ref({
  id: null,
  nombre: '',
  contrasena: '',
  rol: '',
  id_ubicacion: null
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

const fetchUsuarios = async () => {
  loading.value = true
  try {
    const res = await fetch('/api/usuarios')
    if (res.ok) {
      usuarios.value = await res.json()
    } else {
      showAlert('Error al cargar usuarios', 'error')
    }
  } catch (error) {
    console.error('Error:', error)
    showAlert('Error de conexión', 'error')
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

const openModal = (usuario = null) => {
  if (usuario) {
    isEditing.value = true
    currentUsuario.value = {
      id: usuario.id,
      nombre: usuario.nombre,
      contrasena: '', // No traer la contraseña al editar por seguridad
      rol: usuario.rol,
      id_ubicacion: usuario.id_ubicacion
    }
  } else {
    isEditing.value = false
    currentUsuario.value = {
      id: null,
      nombre: '',
      contrasena: '',
      rol: '',
      id_ubicacion: null
    }
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const saveUsuario = async () => {
  if (!currentUsuario.value.nombre.trim() || !currentUsuario.value.rol) {
    showAlert('Por favor, completa todos los campos requeridos', 'error')
    return
  }
  if (!isEditing.value && !currentUsuario.value.contrasena.trim()) {
    showAlert('La contraseña es requerida para un usuario nuevo', 'error')
    return
  }

  saving.value = true
  const method = isEditing.value ? 'PUT' : 'POST'
  const url = isEditing.value ? `/api/usuarios/${currentUsuario.value.id}` : '/api/usuarios'

  const payload = { ...currentUsuario.value }
  if (isEditing.value && !payload.contrasena.trim()) {
    delete payload.contrasena // No enviar contraseña si quedó en blanco
  }

  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (res.ok) {
      showAlert(isEditing.value ? 'Usuario actualizado correctamente' : 'Usuario creado correctamente')
      closeModal()
      fetchUsuarios()
    } else {
      const errData = await res.json()
      showAlert(errData.error || 'Error al guardar el usuario', 'error')
    }
  } catch (error) {
    console.error('Error:', error)
    showAlert('Error de conexión al guardar', 'error')
  } finally {
    saving.value = false
  }
}

const deleteUsuario = async (usuario) => {
  if (usuario.nombre === 'admin') {
    showAlert('No se puede eliminar el usuario administrador por defecto', 'error')
    return
  }

  if (await winConfirm(`¿Estás seguro de que deseas eliminar al usuario "${usuario.nombre}"?`, 'Eliminar Usuario')) {
    try {
      const res = await fetch(`/api/usuarios/${usuario.id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        showAlert('Usuario eliminado correctamente')
        fetchUsuarios()
      } else {
        const errData = await res.json()
        showAlert(errData.error || 'Error al eliminar el usuario', 'error')
      }
    } catch (error) {
      console.error('Error:', error)
      showAlert('Error de conexión al eliminar', 'error')
    }
  }
}

onMounted(() => {
  fetchUsuarios()
  fetchUbicaciones()
})
</script>

<style scoped>
.page-container {
  padding: 0.5rem;
}
</style>
