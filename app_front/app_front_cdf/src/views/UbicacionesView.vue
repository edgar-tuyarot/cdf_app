<script setup>
import { ref, onMounted } from 'vue'
import BaseCard from '../components/BaseCard.vue'
import BaseButton from '../components/BaseButton.vue'
import BaseInput from '../components/BaseInput.vue'

const ubicaciones = ref([])
const isLoading = ref(false)
const isSubmitting = ref(false)
const showForm = ref(false)
const isEditing = ref(false)
const message = ref({ text: '', type: '' })

const form = ref({
  id: null,
  nombre: '',
  descripcion: '',
  numero: ''
})

const fetchUbicaciones = async () => {
  isLoading.value = true
  try {
    const res = await fetch('/api/ubicaciones')
    if (res.ok) {
      ubicaciones.value = await res.json()
    }
  } catch (error) {
    console.error('Error fetching locations:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchUbicaciones)

const openCreate = () => {
  isEditing.value = false
  form.value = { id: null, nombre: '', descripcion: '', numero: '' }
  showForm.value = true
}

const openEdit = (item) => {
  isEditing.value = true
  form.value = { ...item }
  showForm.value = true
}

const saveUbicacion = async () => {
  isSubmitting.value = true
  message.value = { text: '', type: '' }
  
  const url = isEditing.value ? `/api/ubicaciones/${form.value.id}` : '/api/ubicaciones'
  const method = isEditing.value ? 'PUT' : 'POST'
  
  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: form.value.nombre,
        descripcion: form.value.descripcion,
        numero: Number(form.value.numero)
      })
    })
    
    if (res.ok) {
      message.value = { text: `Ubicación ${isEditing.value ? 'actualizada' : 'creada'} correctamente.`, type: 'success' }
      showForm.value = false
      fetchUbicaciones()
    } else {
      message.value = { text: 'Error al guardar la ubicación.', type: 'error' }
    }
  } catch (error) {
    message.value = { text: 'Error de conexión.', type: 'error' }
  } finally {
    isSubmitting.value = false
  }
}

const deleteUbicacion = async (id) => {
  if (!confirm('¿Estás seguro de eliminar esta ubicación?')) return
  
  try {
    const res = await fetch(`/api/ubicaciones/${id}`, { method: 'DELETE' })
    if (res.ok) {
      fetchUbicaciones()
    }
  } catch (error) {
    console.error('Error deleting location:', error)
  }
}
</script>

<template>
  <div class="ubicaciones-view">
    <header class="view-header">
      <div class="header-content">
        <h2>Ubicaciones</h2>
        <p>Gestiona los puntos de almacenamiento del sistema</p>
      </div>
      <BaseButton v-if="!showForm" @click="openCreate">
        + Nueva Ubicación
      </BaseButton>
    </header>

    <!-- FORM CARD -->
    <BaseCard v-if="showForm" class="fade-in">
      <template #header>
        <h3>{{ isEditing ? 'Editar' : 'Nueva' }} Ubicación</h3>
      </template>
      
      <form @submit.prevent="saveUbicacion" class="modern-form">
        <BaseInput v-model="form.nombre" label="Nombre *" placeholder="Ej: Depósito A" required />
        <BaseInput v-model="form.descripcion" label="Descripción" placeholder="Ej: Sector frío" />
        <BaseInput v-model="form.numero" label="Número / Código *" type="number" placeholder="Ej: 101" required />
        
        <div v-if="message.text" :class="['alert', message.type]">
          {{ message.text }}
        </div>

        <div class="form-actions">
          <BaseButton variant="outline" type="button" @click="showForm = false">Cancelar</BaseButton>
          <BaseButton variant="primary" type="submit" :disabled="isSubmitting">
            {{ isSubmitting ? 'Guardando...' : 'Guardar' }}
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
              <th>Num.</th>
              <th>Nombre</th>
              <th>Descripción</th>
              <th class="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="ubicaciones.length === 0 && !isLoading">
              <td colspan="4" class="text-center text-muted">No hay ubicaciones registradas.</td>
            </tr>
            <tr v-for="item in ubicaciones" :key="item.id">
              <td><span class="badge">{{ item.numero }}</span></td>
              <td><strong>{{ item.nombre }}</strong></td>
              <td>{{ item.descripcion }}</td>
              <td class="text-right">
                <div class="actions-group">
                  <button class="icon-btn edit" @click="openEdit(item)" title="Editar">
                    <span class="material-icons">edit</span>
                  </button>
                  <button class="icon-btn delete" @click="deleteUbicacion(item.id)" title="Eliminar">
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
.ubicaciones-view {
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

.badge {
  background-color: var(--color-secondary);
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 700;
  border: 1px solid var(--color-border);
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
