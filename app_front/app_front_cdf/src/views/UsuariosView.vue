<script setup>
import { ref, onMounted } from 'vue'
import BaseCard from '../components/BaseCard.vue'
import BaseButton from '../components/BaseButton.vue'
import BaseInput from '../components/BaseInput.vue'
import BaseSelect from '../components/BaseSelect.vue'

const usuarios = ref([])
const roles = ref([]) // To be populated later
const isLoading = ref(false)
const isSubmitting = ref(false)
const showForm = ref(false)
const isEditing = ref(false)
const message = ref({ text: '', type: '' })

const form = ref({
  id: null,
  username: '',
  password: '',
  rolId: ''
})

const fetchUsuarios = async () => {
  isLoading.value = true
  try {
    const res = await fetch('/api/usuarios')
    if (res.ok) {
      usuarios.value = await res.json()
    }
  } catch (error) {
    console.error('Error fetching users:', error)
  } finally {
    isLoading.value = false
  }
}

const fetchRoles = async () => {
  try {
    const res = await fetch('/api/roles')
    if (res.ok) {
      const data = await res.json()
      roles.value = data.map(r => ({ value: r.id, label: r.nombre }))
    }
  } catch (error) {
    console.error('Error fetching roles:', error)
  }
}

onMounted(() => {
  fetchUsuarios()
  fetchRoles()
})

const openCreate = () => {
  isEditing.value = false
  form.value = { id: null, username: '', password: '', rolId: '' }
  showForm.value = true
}

const openEdit = (user) => {
  isEditing.value = true
  form.value = { 
    id: user.id, 
    username: user.username, 
    rolId: user.rolId,
    password: '' // Keep empty to not update unless specified
  }
  showForm.value = true
}

const saveUsuario = async () => {
  isSubmitting.value = true
  message.value = { text: '', type: '' }
  
  const url = isEditing.value ? `/api/usuarios/${form.value.id}` : '/api/usuarios'
  const method = isEditing.value ? 'PUT' : 'POST'
  
  const payload = {
    username: form.value.username,
    rolId: Number(form.value.rolId)
  }
  
  if (form.value.password) {
    payload.password = form.value.password
  }

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    
    if (res.ok) {
      message.value = { text: `Usuario ${isEditing.value ? 'actualizado' : 'creado'} correctamente.`, type: 'success' }
      setTimeout(() => {
        showForm.value = false
        fetchUsuarios()
      }, 1500)
    } else {
      const data = await res.json().catch(() => ({}))
      message.value = { text: data.message || 'Error al guardar el usuario.', type: 'error' }
    }
  } catch (error) {
    message.value = { text: 'Error de conexión.', type: 'error' }
  } finally {
    isSubmitting.value = false
  }
}

const deleteUsuario = async (id) => {
  if (!confirm('¿Estás seguro de eliminar este usuario?')) return
  
  try {
    const res = await fetch(`/api/usuarios/${id}`, { method: 'DELETE' })
    if (res.ok) {
      fetchUsuarios()
    }
  } catch (error) {
    console.error('Error deleting user:', error)
  }
}
</script>

<template>
  <div class="usuarios-view">
    <header class="view-header">
      <div class="header-content">
        <h2>Usuarios</h2>
        <p>Gestión de accesos y roles del sistema</p>
      </div>
      <BaseButton v-if="!showForm" @click="openCreate">
        <span class="material-icons">person_add</span> Nuevo Usuario
      </BaseButton>
    </header>

    <!-- FORM CARD -->
    <BaseCard v-if="showForm" class="fade-in">
      <template #header>
        <h3>{{ isEditing ? 'Editar' : 'Nuevo' }} Usuario</h3>
      </template>
      
      <form @submit.prevent="saveUsuario" class="modern-form">
        <BaseInput v-model="form.username" label="Nombre de Usuario *" placeholder="Ej: edgar_admin" required />
        
        <BaseInput 
          v-model="form.password" 
          label="Contraseña" 
          type="password" 
          :placeholder="isEditing ? 'Dejar en blanco para no cambiar' : 'Escribe una clave segura'" 
          :required="!isEditing" 
        />
        
        <BaseSelect 
          v-model="form.rolId" 
          label="Rol *" 
          placeholder="Selecciona un rol"
          :options="roles"
          required
        />
        
        <div v-if="message.text" :class="['alert', message.type]">
          {{ message.text }}
        </div>

        <div class="form-actions">
          <BaseButton variant="outline" type="button" @click="showForm = false">Cancelar</BaseButton>
          <BaseButton variant="primary" type="submit" :disabled="isSubmitting">
            {{ isSubmitting ? 'Guardando...' : 'Guardar Usuario' }}
          </BaseButton>
        </div>
      </form>
    </BaseCard>

    <!-- LIST CARD -->
    <BaseCard v-else>
      <div class="table-container">
        <table class="modern-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Usuario</th>
              <th>Rol</th>
              <th class="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="usuarios.length === 0 && !isLoading">
              <td colspan="4" class="text-center text-muted">No hay usuarios registrados.</td>
            </tr>
            <tr v-for="user in usuarios" :key="user.id">
              <td>#{{ user.id }}</td>
              <td><strong>{{ user.username }}</strong></td>
              <td>
                <span class="badge-rol">{{ user.rolNombre || 'Sin Rol' }}</span>
              </td>
              <td class="text-right">
                <div class="actions-group">
                  <button class="icon-btn edit" @click="openEdit(user)" title="Editar">
                    <span class="material-icons">edit</span>
                  </button>
                  <button class="icon-btn delete" @click="deleteUsuario(user.id)" title="Eliminar">
                    <span class="material-icons">delete</span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </BaseCard>
  </div>
</template>

<style scoped>
.usuarios-view {
  padding-bottom: 40px;
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-lg);
}

.modern-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: var(--space-md);
}

.modern-table {
  width: 100%;
  border-collapse: collapse;
}

.modern-table th {
  text-align: left;
  padding: 14px 12px;
  color: var(--color-text-muted);
  border-bottom: 2px solid var(--color-border);
}

.modern-table td {
  padding: 14px 12px;
  border-bottom: 1px solid #EEE;
}

.badge-rol {
  background-color: #EEE;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 800;
  color: var(--color-text-muted);
  border: 1px solid var(--color-border);
}

.actions-group {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.icon-btn {
  background: none;
  border: 2px solid var(--color-border);
  padding: 6px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-btn .material-icons {
  font-size: 1.1rem;
}

.icon-btn:hover {
  background-color: #F0F0F0;
  transform: translateY(-2px);
}

.icon-btn.delete:hover {
  background-color: #FFEBEE;
}

.alert {
  padding: 12px;
  border-radius: var(--radius-sm);
  border: 2px solid var(--color-border);
  font-size: 0.9rem;
  font-weight: 600;
  margin-top: var(--space-md);
  text-align: center;
}

.alert.success { background-color: #E8F5E9; color: #2E7D32; }
.alert.error { background-color: #FFEBEE; color: #C62828; }

.text-right { text-align: right; }
.text-center { text-align: center; }
.text-muted { padding: 2rem; color: var(--color-text-muted); }
</style>
