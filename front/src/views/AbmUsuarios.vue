<script setup>
import { ref, onMounted, computed } from 'vue'
import { useWinDialog } from '../composables/useWinDialog'

const { winConfirm } = useWinDialog()

const usuarios = ref([])
const isLoading = ref(false)
const showModal = ref(false)
const isEditing = ref(false)
const expandedRows = ref(new Set())
const mensaje = ref({ tipo: '', texto: '' })

const form = ref({
  id: null,
  usuario: '',
  password: '',
  rol: 'Preparador'
})

const roles = ['Admin', 'Preparador']

const toggleRow = (id) => {
  if (expandedRows.value.has(id)) {
    expandedRows.value.delete(id)
  } else {
    expandedRows.value.add(id)
  }
}

const mostrarMensaje = (tipo, texto) => {
  mensaje.value = { tipo, texto }
  setTimeout(() => { mensaje.value = { tipo: '', texto: '' } }, 5000)
}

const cargarUsuarios = async () => {
  isLoading.value = true
  try {
    const res = await fetch('/api/usuarios')
    if (res.ok) {
      usuarios.value = await res.json()
    }
  } catch (error) {
    mostrarMensaje('error', 'Error al cargar usuarios')
  } finally {
    isLoading.value = false
  }
}

const abrirModal = (user = null) => {
  if (user) {
    isEditing.value = true
    form.value = { ...user, password: '' }
  } else {
    isEditing.value = false
    form.value = { id: null, usuario: '', password: '', rol: 'Preparador' }
  }
  showModal.value = true
}

const guardarUsuario = async () => {
  const url = isEditing.value ? `/api/usuarios/${form.value.id}` : '/api/usuarios'
  try {
    const res = await fetch(url, {
      method: isEditing.value ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value)
    })
    if (res.ok) {
      mostrarMensaje('success', 'Operación exitosa')
      showModal.value = false
      cargarUsuarios()
    }
  } catch (error) {
    mostrarMensaje('error', 'Error en el servidor')
  }
}

const eliminarUsuario = async (id) => {
  if (!await winConfirm('¿Eliminar usuario?', 'Eliminar')) return
  try {
    const res = await fetch(`/api/usuarios/${id}`, { method: 'DELETE' })
    if (res.ok) {
      mostrarMensaje('success', 'Usuario eliminado')
      cargarUsuarios()
    }
  } catch (error) {
    mostrarMensaje('error', 'No se pudo eliminar')
  }
}

onMounted(cargarUsuarios)
</script>

<template>
  <div class="page-container animate-fade">
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title">Usuarios</h2>
        <p class="page-description d-none-mobile">Gestiona roles y accesos.</p>
      </div>
      <button class="btn btn-primary" @click="abrirModal()">
        <i class="ph ph-user-plus"></i> <span class="d-none-mobile">Nuevo</span>
      </button>
    </div>

    <div v-if="mensaje.texto" class="alert-box" :class="mensaje.tipo">
      <span>{{ mensaje.texto }}</span>
    </div>

    <div class="card mt-4 no-padding-mobile">
      <div class="table-container">
        <table class="responsive-table">
          <thead>
            <tr>
              <th class="d-none-mobile">ID</th>
              <th>Usuario</th>
              <th class="d-none-mobile">Rol</th>
              <th class="text-center">Estado/Acción</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="u in usuarios" :key="u.id">
              <tr @click="toggleRow(u.id)" :class="{ 'row-expanded': expandedRows.has(u.id) }">
                <td class="d-none-mobile text-muted">#{{ u.id }}</td>
                <td>
                  <div class="user-cell">
                    <span class="fw-bold">{{ u.usuario }}</span>
                    <span class="d-only-mobile text-xs text-muted">{{ u.rol }}</span>
                  </div>
                </td>
                <td class="d-none-mobile">
                  <span class="badge" :class="u.rol === 'Admin' ? 'badge-primary' : 'badge-outline'">{{ u.rol }}</span>
                </td>
                <td class="text-center">
                  <button class="expand-btn d-only-mobile">
                    <i class="ph" :class="expandedRows.has(u.id) ? 'ph-caret-up' : 'ph-caret-down'"></i>
                  </button>
                  <div class="d-none-mobile table-actions">
                    <button class="icon-btn" @click.stop="abrirModal(u)"><i class="ph ph-pencil"></i></button>
                    <button class="icon-btn text-danger" @click.stop="eliminarUsuario(u.id)"><i class="ph ph-trash"></i></button>
                  </div>
                </td>
              </tr>
              
              <!-- Detalles Móvil -->
              <tr v-if="expandedRows.has(u.id)" class="detail-row d-only-mobile">
                <td colspan="2">
                  <div class="detail-content animate-slide-down">
                    <div class="detail-info">
                      <p><strong>ID:</strong> #{{ u.id }}</p>
                      <p><strong>Rol:</strong> {{ u.rol }}</p>
                    </div>
                    <div class="detail-actions">
                      <button class="btn btn-outline flex-1" @click.stop="abrirModal(u)">
                        <i class="ph ph-pencil"></i> Editar
                      </button>
                      <button class="btn btn-danger-outline flex-1" @click.stop="eliminarUsuario(u.id)">
                        <i class="ph ph-trash"></i> Eliminar
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Form (Responsivo) -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal-card animate-slide-in">
        <div class="modal-header">
          <h3 class="modal-title">{{ isEditing ? 'Editar' : 'Nuevo' }} Usuario</h3>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Usuario</label>
            <input type="text" v-model="form.usuario" class="form-control">
          </div>
          <div class="form-group mt-3">
            <label class="form-label">Password</label>
            <input type="password" v-model="form.password" class="form-control" placeholder="••••••••">
          </div>
          <div class="form-group mt-3">
            <label class="form-label">Rol</label>
            <select v-model="form.rol" class="form-control">
              <option v-for="r in roles" :key="r">{{ r }}</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" @click="showModal = false">Cancelar</button>
          <button class="btn btn-primary" @click="guardarUsuario">Guardar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.responsive-table tr { cursor: pointer; }
.row-expanded { background: rgba(59, 130, 246, 0.05); }

.detail-row td { padding: 0 !important; }
.detail-content { padding: 1.25rem; background: rgba(15, 23, 42, 0.3); border-bottom: 1px solid var(--glass-border); }
.detail-info { margin-bottom: 1rem; font-size: 0.9rem; }
.detail-actions { display: flex; gap: 0.75rem; }

.flex-1 { flex: 1; }
.btn-danger-outline { color: #f87171; border: 1px solid rgba(239, 68, 68, 0.2); background: transparent; }

.d-none-mobile { display: none; }
.d-only-mobile { display: block; }

@media (min-width: 768px) {
  .d-none-mobile { display: table-cell; }
  .d-only-mobile { display: none !important; }
  .responsive-table tr { cursor: default; }
  .table-actions { display: flex; gap: 0.5rem; justify-content: center; }
}

.animate-slide-down { animation: slideDown 0.2s ease-out; }
@keyframes slideDown { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
</style>
