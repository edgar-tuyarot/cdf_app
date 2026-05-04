<script setup>
import { ref, onMounted } from 'vue'
import BaseCard from '../components/BaseCard.vue'
import BaseButton from '../components/BaseButton.vue'
import BaseInput from '../components/BaseInput.vue'
import BaseSelect from '../components/BaseSelect.vue'

const activeTab = ref('ubicaciones') // 'ubicaciones' | 'sucursales'

// ========== UBICACIONES ==========
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

const openCreate = () => {
  isEditing.value = false
  form.value = { id: null, nombre: '', descripcion: '', numero: '' }
  showForm.value = true
  message.value = { text: '', type: '' }
}

const openEdit = (item) => {
  isEditing.value = true
  form.value = { ...item }
  showForm.value = true
  message.value = { text: '', type: '' }
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

// ========== SUCURSALES ==========
const sucursales = ref([])
const isLoadingSuc = ref(false)
const isSubmittingSuc = ref(false)
const showFormSuc = ref(false)
const isEditingSuc = ref(false)
const messageSuc = ref({ text: '', type: '' })

const formSuc = ref({
  id: null,
  nombre: '',
  numero: '',
  direccion: '',
  telefono: '',
  ubicacionId: ''
})

const fetchSucursales = async () => {
  isLoadingSuc.value = true
  try {
    const res = await fetch('/api/sucursales')
    if (res.ok) {
      sucursales.value = await res.json()
    }
  } catch (error) {
    console.error('Error fetching branches:', error)
  } finally {
    isLoadingSuc.value = false
  }
}

// Opciones de ubicación para el select
const ubicacionOptions = ref([])
const buildUbicacionOptions = () => {
  ubicacionOptions.value = ubicaciones.value.map(u => ({
    value: u.id,
    label: `${u.numero} - ${u.nombre}`
  }))
}

const openCreateSuc = () => {
  isEditingSuc.value = false
  formSuc.value = { id: null, nombre: '', numero: '', direccion: '', telefono: '', ubicacionId: '' }
  showFormSuc.value = true
  messageSuc.value = { text: '', type: '' }
  buildUbicacionOptions()
}

const openEditSuc = (item) => {
  isEditingSuc.value = true
  formSuc.value = {
    id: item.id,
    nombre: item.nombre,
    numero: item.numero,
    direccion: item.direccion || '',
    telefono: item.telefono || '',
    ubicacionId: item.ubicacion?.id || item.ubicacionId || ''
  }
  showFormSuc.value = true
  messageSuc.value = { text: '', type: '' }
  buildUbicacionOptions()
}

const saveSucursal = async () => {
  isSubmittingSuc.value = true
  messageSuc.value = { text: '', type: '' }

  const url = isEditingSuc.value ? `/api/sucursales/${formSuc.value.id}` : '/api/sucursales'
  const method = isEditingSuc.value ? 'PUT' : 'POST'

  const payload = {
    nombre: formSuc.value.nombre,
    numero: Number(formSuc.value.numero),
    direccion: formSuc.value.direccion,
    telefono: formSuc.value.telefono
  }

  // Solo incluir ubicacionId si se seleccionó una
  if (formSuc.value.ubicacionId) {
    payload.ubicacionId = Number(formSuc.value.ubicacionId)
  }

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (res.ok) {
      messageSuc.value = { text: `Sucursal ${isEditingSuc.value ? 'actualizada' : 'creada'} correctamente.`, type: 'success' }
      showFormSuc.value = false
      fetchSucursales()
      // Refrescar ubicaciones por si se creó una automáticamente
      fetchUbicaciones()
    } else {
      const data = await res.json().catch(() => ({}))
      messageSuc.value = { text: data.message || 'Error al guardar la sucursal.', type: 'error' }
    }
  } catch (error) {
    messageSuc.value = { text: 'Error de conexión.', type: 'error' }
  } finally {
    isSubmittingSuc.value = false
  }
}

const deleteSucursal = async (id) => {
  if (!confirm('¿Estás seguro de eliminar esta sucursal?')) return

  try {
    const res = await fetch(`/api/sucursales/${id}`, { method: 'DELETE' })
    if (res.ok) {
      fetchSucursales()
    } else {
      const data = await res.json().catch(() => ({}))
      alert(data.message || 'Error al eliminar la sucursal.')
    }
  } catch (error) {
    console.error('Error deleting branch:', error)
  }
}

// ========== INIT ==========
onMounted(() => {
  fetchUbicaciones()
  fetchSucursales()
})

const switchTab = (tab) => {
  activeTab.value = tab
  showForm.value = false
  showFormSuc.value = false
  message.value = { text: '', type: '' }
  messageSuc.value = { text: '', type: '' }
}
</script>

<template>
  <div class="ubicaciones-view">
    <header class="view-header">
      <div class="header-content">
        <h2>Ubicaciones y Sucursales</h2>
        <p>Gestiona los puntos de almacenamiento y sucursales</p>
      </div>
      <div class="header-actions">
        <BaseButton
          v-if="activeTab === 'ubicaciones' && !showForm"
          @click="openCreate"
          variant="minimal"
          size="small"
        >
          + Ubicación
        </BaseButton>
        <BaseButton
          v-if="activeTab === 'sucursales' && !showFormSuc"
          @click="openCreateSuc"
          variant="minimal"
          size="small"
        >
          + Sucursal
        </BaseButton>
      </div>
    </header>

    <!-- TABS -->
    <div class="tabs-bar">
      <button
        :class="['tab-btn', { active: activeTab === 'ubicaciones' }]"
        @click="switchTab('ubicaciones')"
      >
        Ubicaciones
      </button>
      <button
        :class="['tab-btn', { active: activeTab === 'sucursales' }]"
        @click="switchTab('sucursales')"
      >
        Sucursales
      </button>
    </div>

    <!-- ============ UBICACIONES TAB ============ -->
    <template v-if="activeTab === 'ubicaciones'">

      <!-- FORM -->
      <BaseCard v-if="showForm" class="fade-in section-card">
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
            <BaseButton variant="minimal" size="small" type="button" @click="showForm = false">Cancelar</BaseButton>
            <BaseButton variant="primary" type="submit" :disabled="isSubmitting">
              {{ isSubmitting ? 'Guardando...' : 'Guardar' }}
            </BaseButton>
          </div>
        </form>
      </BaseCard>

      <!-- LIST -->
      <BaseCard v-else class="section-card">
        <div class="table-container">
          <table class="modern-table">
            <thead>
              <tr>
                <th>Num.</th>
                <th>Nombre</th>
                <th class="desktop-col">Descripción</th>
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
                <td class="desktop-col">{{ item.descripcion }}</td>
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
    </template>

    <!-- ============ SUCURSALES TAB ============ -->
    <template v-if="activeTab === 'sucursales'">

      <!-- FORM -->
      <BaseCard v-if="showFormSuc" class="fade-in section-card">
        <template #header>
          <h3>{{ isEditingSuc ? 'Editar' : 'Nueva' }} Sucursal</h3>
        </template>

        <form @submit.prevent="saveSucursal" class="modern-form">
          <div class="form-grid">
            <BaseInput v-model="formSuc.nombre" label="Nombre *" placeholder="Ej: Sucursal Centro" required />
            <BaseInput v-model="formSuc.numero" label="Número *" type="number" placeholder="Ej: 1" required />
          </div>
          <BaseInput v-model="formSuc.direccion" label="Dirección" placeholder="Ej: Av. Principal 123" />
          <BaseInput v-model="formSuc.telefono" label="Teléfono" placeholder="Ej: 555-1111" />
          <BaseSelect
            v-model="formSuc.ubicacionId"
            label="Ubicación (opcional)"
            placeholder="Se creará automáticamente si no seleccionas"
            :options="ubicacionOptions"
          />

          <div v-if="messageSuc.text" :class="['alert', messageSuc.type]">
            {{ messageSuc.text }}
          </div>

          <div class="form-actions">
            <BaseButton variant="minimal" size="small" type="button" @click="showFormSuc = false">Cancelar</BaseButton>
            <BaseButton variant="primary" type="submit" :disabled="isSubmittingSuc">
              {{ isSubmittingSuc ? 'Guardando...' : 'Guardar' }}
            </BaseButton>
          </div>
        </form>
      </BaseCard>

      <!-- LIST -->
      <BaseCard v-else class="section-card">
        <div class="table-container">
          <table class="modern-table">
            <thead>
              <tr>
                <th>Nro.</th>
                <th>Nombre</th>
                <th class="desktop-col">Dirección</th>
                <th class="desktop-col">Teléfono</th>
                <th class="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="sucursales.length === 0 && !isLoadingSuc">
                <td colspan="5" class="text-center text-muted">No hay sucursales registradas.</td>
              </tr>
              <tr v-for="suc in sucursales" :key="suc.id">
                <td><span class="badge">{{ suc.numero }}</span></td>
                <td><strong>{{ suc.nombre }}</strong></td>
                <td class="desktop-col">{{ suc.direccion || '—' }}</td>
                <td class="desktop-col">{{ suc.telefono || '—' }}</td>
                <td class="text-right">
                  <div class="actions-group">
                    <button class="icon-btn edit" @click="openEditSuc(suc)" title="Editar">
                      <span class="material-icons">edit</span>
                    </button>
                    <button class="icon-btn delete" @click="deleteSucursal(suc.id)" title="Eliminar">
                      <span class="material-icons">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile cards for sucursales -->
        <div class="mobile-cards">
          <div v-if="sucursales.length === 0 && !isLoadingSuc" class="empty-mobile">
            No hay sucursales registradas.
          </div>
          <div v-for="suc in sucursales" :key="'m-' + suc.id" class="mobile-card">
            <div class="mobile-card-header">
              <div>
                <span class="badge">{{ suc.numero }}</span>
                <strong class="mobile-name">{{ suc.nombre }}</strong>
              </div>
              <div class="actions-group">
                <button class="icon-btn edit" @click="openEditSuc(suc)">
                  <span class="material-icons">edit</span>
                </button>
                <button class="icon-btn delete" @click="deleteSucursal(suc.id)">
                  <span class="material-icons">delete</span>
                </button>
              </div>
            </div>
            <div class="mobile-card-details" v-if="suc.direccion || suc.telefono">
              <span v-if="suc.direccion" class="detail-line">📍 {{ suc.direccion }}</span>
              <span v-if="suc.telefono" class="detail-line">📞 {{ suc.telefono }}</span>
            </div>
          </div>
        </div>
      </BaseCard>
    </template>

    <!-- Mensaje global (para operaciones fuera de form) -->
    <div v-if="activeTab === 'ubicaciones' && !showForm && message.text" :class="['alert', message.type, 'global-alert']">
      {{ message.text }}
    </div>
    <div v-if="activeTab === 'sucursales' && !showFormSuc && messageSuc.text" :class="['alert', messageSuc.type, 'global-alert']">
      {{ messageSuc.text }}
    </div>
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
  gap: var(--space-md);
}

.header-actions {
  flex-shrink: 0;
  padding-top: 4px;
}

/* Tabs */
.tabs-bar {
  display: flex;
  gap: 4px;
  background-color: #EEE;
  padding: 4px;
  border-radius: var(--radius-md);
  margin-bottom: var(--space-md);
  border: 2px solid var(--color-border);
}

.tab-btn {
  flex: 1;
  padding: 10px;
  border: none;
  background: none;
  font-weight: 700;
  font-size: 0.9rem;
  color: var(--color-text-muted);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-btn.active {
  background-color: white;
  color: var(--color-primary);
  box-shadow: var(--shadow-sm);
}

.section-card {
  margin-bottom: var(--space-md);
}

/* Forms */
.modern-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-md);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: var(--space-md);
}

/* Tables */
.modern-table {
  width: 100%;
  border-collapse: collapse;
}

.modern-table th {
  text-align: left;
  padding: 14px 12px;
  color: var(--color-text-muted);
  border-bottom: 2px solid var(--color-border);
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.modern-table td {
  padding: 14px 12px;
  border-bottom: 1px solid #EEE;
  font-size: 0.9rem;
}

/* Actions */
.actions-group {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.icon-btn {
  background: none;
  border: 1px solid var(--color-border);
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
}

.icon-btn.delete:hover {
  background-color: #FFEBEE;
  border-color: #FFCDD2;
}

.badge {
  background-color: var(--color-secondary);
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 700;
  font-size: 0.8rem;
}

/* Alerts */
.alert {
  padding: 12px;
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  font-weight: 600;
  text-align: center;
}

.alert.success { background-color: #E8F5E9; color: #2E7D32; border: 1px solid #C8E6C9; }
.alert.error { background-color: #FFEBEE; color: #C62828; border: 1px solid #FFCDD2; }

.global-alert {
  margin-top: var(--space-md);
}

.text-right { text-align: right; }
.text-center { text-align: center; }
.text-muted { padding: 2rem; color: var(--color-text-muted); }

/* Mobile cards for sucursales */
.mobile-cards {
  display: none;
}

.mobile-card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 12px;
  margin-bottom: 8px;
  background-color: #FAFAFA;
}

.mobile-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.mobile-name {
  margin-left: 8px;
  font-size: 0.9rem;
}

.mobile-card-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #EEE;
}

.detail-line {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.empty-mobile {
  text-align: center;
  padding: var(--space-lg);
  color: var(--color-text-muted);
}

/* Responsive */
@media (max-width: 640px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .desktop-col {
    display: none;
  }

  /* Show mobile cards, hide table for sucursales */
  .tabs-bar + template .table-container,
  .ubicaciones-view .modern-table {
    /* Keep tables for ubicaciones (simpler data) */
  }

  .mobile-cards {
    display: block;
  }

  /* In sucursales tab, hide the table on mobile */
  .ubicaciones-view template:last-of-type .table-container {
    display: none;
  }
}

@media (max-width: 480px) {
  .view-header {
    flex-direction: column;
  }

  .header-actions {
    align-self: flex-end;
  }
}

/* Animation */
.fade-in {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
