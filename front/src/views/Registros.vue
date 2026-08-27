<template>
  <div class="page-container animate-fade">
    <!-- Encabezado de la página -->
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title">Registros y Bitácora</h2>
        <p class="page-description">Historial de anotaciones, observaciones y eventos registrados por los usuarios.</p>
      </div>
      <div class="header-actions mt-2" style="display: flex; gap: 0.5rem;">
        <button class="btn btn-secondary" @click="fetchRegistros" :disabled="loading" style="display: flex; align-items: center; gap: 0.25rem;">
          <i class="ph ph-spinner spinner" v-if="loading"></i>
          <i class="ph ph-arrows-clockwise" v-else></i> Actualizar
        </button>
        <button class="btn btn-primary" @click="openModal" style="display: flex; align-items: center; gap: 0.25rem;">
          <i class="ph ph-plus-circle"></i> Nuevo Registro
        </button>
      </div>
    </div>

    <!-- Alertas -->
    <div v-if="alert.show" :class="['alert-box mb-4', alert.type]">
      {{ alert.message }}
    </div>

    <!-- Buscador y Métricas -->
    <div class="card mb-4">
      <div class="card-body" style="padding: 0.85rem 1rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
        <div style="display: flex; align-items: center; gap: 0.4rem; background: var(--bg-window); padding: 0.25rem 0.6rem; border: 1.5px solid var(--bevel-dark); width: 320px; max-width: 100%;">
          <i class="ph ph-magnifying-glass" style="color: var(--text-secondary); font-size: 1rem;"></i>
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="Buscar por texto o usuario..." 
            style="border: none; outline: none; background: transparent; width: 100%; color: var(--text-primary); font-size: 0.85rem; font-weight: 600;"
          />
          <button v-if="searchQuery" @click="searchQuery = ''" style="background: none; border: none; cursor: pointer; color: var(--text-muted); display: flex; align-items: center;">
            <i class="ph ph-x-circle" style="font-size: 1rem;"></i>
          </button>
        </div>

        <div style="font-size: 0.85rem; color: var(--text-secondary); font-weight: 600;">
          Total Registros: <strong style="color: var(--text-primary);">{{ filteredRegistros.length }}</strong>
        </div>
      </div>
    </div>

    <!-- Tabla / Lista de Registros -->
    <div class="card">
      <div class="table-container">
        <table v-if="!loading && filteredRegistros.length > 0" class="access-table" style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="width: 70px;" class="text-center"># ID</th>
              <th style="width: 150px;">Fecha y Hora</th>
              <th style="width: 160px;">Usuario Registro</th>
              <th style="min-width: 300px;">Texto / Contenido</th>
              <th style="width: 80px;" class="text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="reg in filteredRegistros" :key="reg.id">
              <td class="text-center" style="font-family: monospace; font-weight: bold; color: var(--text-muted);">
                #{{ reg.id }}
              </td>
              <td style="font-family: monospace; font-size: 0.82rem; font-weight: 600;">
                <i class="ph ph-calendar me-1" style="color: var(--text-secondary);"></i>
                {{ formatDateTime(reg.fecha) }}
              </td>
              <td>
                <span class="badge-user" style="display: inline-flex; align-items: center; gap: 0.25rem; font-size: 0.8rem; font-weight: 700; background: var(--bg-window); padding: 2px 8px; border: 1px solid var(--bevel-dark); color: var(--text-primary);">
                  <i class="ph ph-user text-blue"></i>
                  {{ reg.usuario_registro }}
                </span>
              </td>
              <td style="white-space: pre-wrap; font-size: 0.88rem; line-height: 1.45; color: var(--text-primary);">
                {{ reg.texto }}
              </td>
              <td class="text-center">
                <button class="btn-icon text-red" title="Eliminar registro" @click="confirmarEliminar(reg)">
                  <i class="ph ph-trash" style="font-size: 1.1rem;"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Estado Cargando -->
        <div v-if="loading" style="text-align: center; padding: 3rem 1rem; color: var(--text-secondary);">
          <i class="ph ph-spinner spinner" style="font-size: 2rem; display: block; margin-bottom: 0.5rem;"></i>
          <span>Cargando registros...</span>
        </div>

        <!-- Estado Vacío -->
        <div v-else-if="filteredRegistros.length === 0" style="text-align: center; padding: 3.5rem 1rem; color: var(--text-muted);">
          <i class="ph ph-note-pencil" style="font-size: 2.5rem; display: block; margin-bottom: 0.5rem; opacity: 0.5;"></i>
          <span v-if="searchQuery">No se encontraron registros que coincidan con "{{ searchQuery }}".</span>
          <span v-else>No hay registros almacenados. ¡Presiona <strong>"Nuevo Registro"</strong> para crear uno!</span>
        </div>
      </div>
    </div>

    <!-- MODAL NUEVO REGISTRO -->
    <Teleport to="body">
      <div v-if="showModal" class="win-dialog-overlay" @mousedown.self="showModal = false">
        <div class="win-dialog" style="max-width: 520px; width: 100%;">
          <div class="win-dialog-titlebar" style="background-color: #0b5394; color: white;">
            <span class="win-dialog-titlebar-text">
              <i class="ph ph-note-pencil me-1"></i> Crear Nuevo Registro
            </span>
            <button class="win-dialog-close" style="color: white;" @click="showModal = false"><i class="ph ph-x"></i></button>
          </div>
          
          <form @submit.prevent="guardarRegistro">
            <div class="win-dialog-body" style="padding: 1.25rem; display: flex; flex-direction: column; gap: 1rem;">
              
              <!-- Usuario Registro -->
              <div class="form-group" style="margin: 0;">
                <label class="form-label" style="font-size: 0.8rem; font-weight: 700; color: var(--text-primary);">
                  Usuario Registro *
                </label>
                <input 
                  type="text" 
                  v-model="form.usuario_registro" 
                  class="form-control"
                  required
                  placeholder="Nombre de usuario..."
                  style="font-weight: 700;"
                />
              </div>

              <!-- Texto / Anotación -->
              <div class="form-group" style="margin: 0;">
                <label class="form-label" style="font-size: 0.8rem; font-weight: 700; color: var(--text-primary);">
                  Texto / Observación *
                </label>
                <textarea 
                  v-model="form.texto" 
                  class="form-control"
                  rows="4"
                  required
                  placeholder="Escriba aquí el detalle de la observación o registro..."
                  style="font-size: 0.88rem; line-height: 1.45; resize: vertical;"
                ></textarea>
              </div>

            </div>

            <div class="win-dialog-footer" style="padding: 0.75rem 1.25rem;">
              <button type="submit" class="win-dialog-btn win-dialog-btn-ok" :disabled="saving">
                <i class="ph ph-spinner spinner me-1" v-if="saving"></i>
                <i class="ph ph-floppy-disk me-1" v-else></i> Guardar Registro
              </button>
              <button type="button" class="win-dialog-btn" @click="showModal = false" :disabled="saving">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- MODAL CONFIRMAR ELIMINACIÓN -->
    <Teleport to="body">
      <div v-if="showDeleteModal" class="win-dialog-overlay" @mousedown.self="showDeleteModal = false">
        <div class="win-dialog" style="max-width: 420px;">
          <div class="win-dialog-titlebar" style="background-color: #c9241b; color: white;">
            <span class="win-dialog-titlebar-text">Confirmar Eliminación</span>
            <button class="win-dialog-close" style="color: white;" @click="showDeleteModal = false"><i class="ph ph-x"></i></button>
          </div>
          <div class="win-dialog-body" style="padding: 1.25rem;">
            <i class="ph ph-warning-circle win-dialog-icon text-red" style="font-size: 2.2rem;"></i>
            <p class="win-dialog-msg" style="margin-top: 0.5rem; line-height: 1.5; font-size: 0.9rem;">
              ¿Estás seguro de que deseas eliminar el registro <strong>#{{ itemToDelete?.id }}</strong>?<br><br>Esta acción no se puede deshacer.
            </p>
          </div>
          <div class="win-dialog-footer">
            <button class="win-dialog-btn win-dialog-btn-ok" style="background: #c9241b; color: white;" @click="eliminarRegistro" :disabled="deleting">
              <i class="ph ph-spinner spinner me-1" v-if="deleting"></i>
              Sí, Eliminar
            </button>
            <button class="win-dialog-btn" @click="showDeleteModal = false" :disabled="deleting">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()

const registros = ref([])
const loading = ref(true)
const saving = ref(false)
const deleting = ref(false)
const searchQuery = ref('')

const showModal = ref(false)
const showDeleteModal = ref(false)
const itemToDelete = ref(null)

const form = ref({
  texto: '',
  usuario_registro: ''
})

const alert = ref({
  show: false,
  message: '',
  type: 'success'
})

const showAlert = (msg, type = 'success') => {
  alert.value = { show: true, message: msg, type }
  setTimeout(() => { alert.value.show = false }, 3500)
}

const formatDateTime = (dateStr) => {
  if (!dateStr) return '-'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    return `${day}/${month}/${year} ${hours}:${minutes}`
  } catch (e) {
    return dateStr
  }
}

const fetchRegistros = async () => {
  loading.value = true
  try {
    const res = await fetch('/api/registros')
    if (res.ok) {
      registros.value = await res.json()
    } else {
      showAlert('Error al descargar la lista de registros.', 'error')
    }
  } catch (error) {
    console.error('Error fetching registros:', error)
    showAlert('Error de conexión con el servidor.', 'error')
  } finally {
    loading.value = false
  }
}

const filteredRegistros = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return registros.value

  return registros.value.filter(r => {
    const textoMatch = r.texto ? r.texto.toLowerCase().includes(query) : false
    const userMatch = r.usuario_registro ? r.usuario_registro.toLowerCase().includes(query) : false
    return textoMatch || userMatch
  })
})

const openModal = () => {
  const userName = authStore.user?.usuario || authStore.user?.nombre || localStorage.getItem('usuario') || 'Usuario'
  form.value = {
    texto: '',
    usuario_registro: userName
  }
  showModal.value = true
}

const guardarRegistro = async () => {
  if (!form.value.texto || !form.value.texto.trim()) {
    showAlert('Debe escribir el texto del registro.', 'error')
    return
  }

  saving.value = true
  try {
    const res = await fetch('/api/registros', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value)
    })

    const data = await res.json()

    if (res.ok) {
      showAlert(data.mensaje || '¡Registro guardado exitosamente!', 'success')
      showModal.value = false
      await fetchRegistros()
    } else {
      showAlert(data.error || 'Error al guardar el registro.', 'error')
    }
  } catch (error) {
    console.error('Error al guardar registro:', error)
    showAlert('Error de conexión al guardar.', 'error')
  } finally {
    saving.value = false
  }
}

const confirmarEliminar = (reg) => {
  itemToDelete.value = reg
  showDeleteModal.value = true
}

const eliminarRegistro = async () => {
  if (!itemToDelete.value) return
  deleting.value = true
  try {
    const res = await fetch(`/api/registros/${itemToDelete.value.id}`, {
      method: 'DELETE'
    })
    const data = await res.json()
    if (res.ok) {
      showAlert(data.mensaje || 'Registro eliminado.', 'success')
      showDeleteModal.value = false
      itemToDelete.value = null
      await fetchRegistros()
    } else {
      showAlert(data.error || 'Error al eliminar registro.', 'error')
    }
  } catch (error) {
    console.error('Error al eliminar registro:', error)
    showAlert('Error de conexión al eliminar.', 'error')
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  fetchRegistros()
})
</script>

<style scoped>
.badge-user {
  box-shadow: var(--inset-shadow);
}
</style>
