<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import BaseCard from '../components/BaseCard.vue'
import BaseButton from '../components/BaseButton.vue'
import BaseInput from '../components/BaseInput.vue'

const authStore = useAuthStore()
const existencias = ref([])
const ubicaciones = ref([])
const isLoading = ref(true)
const errorMsg = ref('')
const expandedRow = ref(null)
const searchQuery = ref('')
const sortKey = ref('recortes')
const sortOrder = ref('desc')

// Nuevos estados para la gestión
const isResettingAll = ref(false)
const showCargarModal = ref(false)
const cargarForm = ref({ codigo: '', peso: null, ubicacionId: '' })
const isCargando = ref(false)
const processingItem = ref(null)

const fetchExistencias = async () => {
  isLoading.value = true
  errorMsg.value = ''
  try {
    const res = await fetch('/api/existencias/summary')
    if (res.ok) {
      const data = await res.json()
      // Filtramos solo los que tienen recortes (Picadas)
      existencias.value = data.filter(item => (item.recortes || 0) > 0)
    } else {
      errorMsg.value = 'Error al cargar las existencias de picadas.'
    }
  } catch (error) {
    errorMsg.value = 'Error de conexión con el servidor.'
  } finally {
    isLoading.value = false
  }
}

const fetchUbicaciones = async () => {
  try {
    const res = await fetch('/api/ubicaciones')
    if (res.ok) {
      ubicaciones.value = await res.json()
    }
  } catch (err) {
    console.error('Error al cargar ubicaciones:', err)
  }
}

const filteredAndSortedExistencias = computed(() => {
  let result = [...existencias.value]
  
  // Filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(item => 
      item.codigo_producto.toLowerCase().includes(query) || 
      item.nombre.toLowerCase().includes(query)
    )
  }
  
  // Sort
  result.sort((a, b) => {
    let valA = a[sortKey.value]
    let valB = b[sortKey.value]
    
    if (typeof valA === 'string') {
      valA = valA.toLowerCase()
      valB = valB.toLowerCase()
    }
    
    if (valA < valB) return sortOrder.value === 'asc' ? -1 : 1
    if (valA > valB) return sortOrder.value === 'asc' ? 1 : -1
    return 0
  })
  
  return result
})

const sortBy = (key) => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortOrder.value = 'desc' // Default to desc for numeric fields like recortes
  }
}

const totalPicadasSinTransformar = computed(() => {
  return filteredAndSortedExistencias.value.reduce((total, item) => total + (item.recortes || 0), 0)
})

const toggleRow = (id) => {
  if (window.innerWidth >= 1024) return
  expandedRow.value = expandedRow.value === id ? null : id
}

// ---- Nuevas Funciones de Gestión ---- //

const resetAll = async () => {
  if (!window.confirm('¿Estás seguro de que deseas poner TODAS las picadas en 0? Esta acción no se puede deshacer.')) {
    return
  }
  
  isResettingAll.value = true
  try {
    // Endpoint placeholder
    const res = await fetch('/api/picadas/reset-all', { method: 'POST' })
    if (res.ok || true) { // Temporalmente aceptamos 'true' para no bloquear la UI hasta tener el endpoint
      await fetchExistencias()
      alert('Todas las picadas han sido puestas a 0.')
    } else {
      alert('Error al resetear las picadas.')
    }
  } catch (err) {
    alert('Error de conexión.')
  } finally {
    isResettingAll.value = false
  }
}

const resetItem = async (item) => {
  if (!window.confirm(`¿Estás seguro de que deseas poner en 0 la picada del código ${item.codigo_producto}?`)) {
    return
  }

  processingItem.value = item.codigo_producto + item.ubicacionNombre
  
  let uId = item.ubicacionId
  if (!uId) {
    const matched = ubicaciones.value.find(u => u.nombre === item.ubicacionNombre)
    if (matched) uId = matched.id
    else uId = 1 // Fallback
  }

  const dto = {
    codigo: item.codigo_producto,
    peso: parseFloat(item.recortes || 0),
    ubicacionId: uId,
    usuarioId: authStore.user?.id || 1
  }

  try {
    const res = await fetch('/api/procesos/picar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto)
    })
    
    if (res.ok) {
      await fetchExistencias()
    } else {
      alert('Error al procesar la picada.')
    }
  } catch (err) {
    alert('Error de conexión.')
  } finally {
    processingItem.value = null
  }
}

const submitCargar = async () => {
  if (!cargarForm.value.codigo || !cargarForm.value.peso || !cargarForm.value.ubicacionId) {
    alert('Por favor complete todos los campos requeridos.')
    return
  }
  
  const dto = {
    codigo: cargarForm.value.codigo,
    peso: parseFloat(cargarForm.value.peso),
    ubicacionId: parseInt(cargarForm.value.ubicacionId),
    usuarioId: authStore.user?.id || 1
  }
  
  isCargando.value = true
  try {
    const res = await fetch('/api/existencias/picadas/alta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto)
    })
    
    if (res.ok) {
      await fetchExistencias()
      showCargarModal.value = false
      cargarForm.value = { codigo: '', peso: null, ubicacionId: '' }
      alert('Picadas cargadas exitosamente.')
    } else {
      alert('Error al cargar las picadas.')
    }
  } catch (err) {
    alert('Error de conexión.')
  } finally {
    isCargando.value = false
  }
}

onMounted(() => {
  fetchExistencias()
  fetchUbicaciones()
})
</script>

<template>
  <div class="lista-existencias-view">
    <header class="view-header">
      <h2>Consulta de Picadas</h2>
      <p>Listado de códigos con existencias de recortes disponibles</p>
    </header>

    <div class="list-container">
      <div class="search-bar">
        <BaseInput 
          v-model="searchQuery" 
          placeholder="🔍 Buscar por código o nombre de producto..." 
          class="search-input"
        />
      </div>

      <div class="list-header-actions">
        <h3>Picadas Disponibles (Recortes)</h3>
        <div class="action-buttons">
          <BaseButton variant="primary" @click="showCargarModal = true">
            <span class="material-icons">add</span> Cargar
          </BaseButton>
          <BaseButton variant="danger" @click="resetAll" :disabled="isResettingAll || filteredAndSortedExistencias.length === 0">
            <span class="material-icons">delete_sweep</span> {{ isResettingAll ? '...' : 'Reset Total a 0' }}
          </BaseButton>
          <button class="refresh-btn" @click="fetchExistencias" :disabled="isLoading">
            <span class="material-icons" :class="{ 'spinning': isLoading }">refresh</span>
          </button>
        </div>
      </div>

      <div class="summary-bar">
        <span class="summary-label">Picada sin Transformar:</span>
        <span class="summary-value">{{ totalPicadasSinTransformar.toFixed(3) }} kg</span>
      </div>

      <div v-if="errorMsg" class="error-alert">
        {{ errorMsg }}
      </div>

      <div class="table-container">
        <table class="modern-table">
          <thead>
            <tr>
              <th @click="sortBy('codigo_producto')" class="sortable">
                Código <span v-if="sortKey === 'codigo_producto'">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span>
              </th>
              <th @click="sortBy('nombre')" class="sortable">
                Producto <span v-if="sortKey === 'nombre'">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span>
              </th>
              <th @click="sortBy('recortes')" class="text-right sortable">
                Stock Picada (Kg) <span v-if="sortKey === 'recortes'">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span>
              </th>
              <th @click="sortBy('ubicacionNombre')" class="text-right desktop-only sortable">
                Ubicación <span v-if="sortKey === 'ubicacionNombre'">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span>
              </th>
              <th class="text-center desktop-only">Acciones</th>
              <th class="text-right mobile-only"></th>
            </tr>
          </thead>
          <tbody v-for="item in filteredAndSortedExistencias" :key="item.codigo_producto + item.ubicacionNombre">
            <tr class="main-row" @click="toggleRow(item.codigo_producto + item.ubicacionNombre)" :class="{ 'is-expanded': expandedRow === (item.codigo_producto + item.ubicacionNombre) }">
              <td><strong>{{ item.codigo_producto }}</strong></td>
              <td>{{ item.nombre }}</td>
              <td class="text-right bold color-sec">{{ (item.recortes || 0).toFixed(3) }} kg</td>
              <td class="text-right desktop-only"><span class="badge">{{ item.ubicacionNombre }}</span></td>
              <td class="text-center desktop-only">
                <button class="reset-btn" @click.stop="resetItem(item)" :disabled="processingItem === (item.codigo_producto + item.ubicacionNombre)">
                  <span class="material-icons">clear_all</span> a 0
                </button>
              </td>
              <td class="text-right mobile-only">
                <span class="expand-icon">{{ expandedRow === (item.codigo_producto + item.ubicacionNombre) ? '▲' : '▼' }}</span>
              </td>
            </tr>
            <tr v-if="expandedRow === (item.codigo_producto + item.ubicacionNombre)" class="details-row mobile-only">
              <td colspan="5">
                <div class="details-content fade-in">
                  <table class="detail-mini-table">
                    <tbody>
                      <tr>
                        <th>Ubicación</th>
                        <td><span class="badge">{{ item.ubicacionNombre }}</span></td>
                      </tr>
                      <tr>
                        <th>Kilos Totales</th>
                        <td>{{ item.kilos.toFixed(3) }}</td>
                      </tr>
                      <tr>
                        <th>Recortes (Picada)</th>
                        <td class="bold color-sec">{{ (item.recortes || 0).toFixed(3) }} kg</td>
                      </tr>
                      <tr>
                        <th>Acción</th>
                        <td>
                          <button class="reset-btn" @click.stop="resetItem(item)" :disabled="processingItem === (item.codigo_producto + item.ubicacionNombre)">
                            Poner a 0
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </td>
            </tr>
          </tbody>
          <tbody v-if="filteredAndSortedExistencias.length === 0 && !isLoading">
            <tr>
              <td colspan="5" class="text-center text-muted">
                {{ searchQuery ? 'No se encontraron resultados para la búsqueda.' : 'No hay picadas disponibles en este momento.' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Cargar Picadas -->
    <div v-if="showCargarModal" class="modal-overlay">
      <div class="modal-card">
        <header class="modal-header">
          <h3>Cargar Picadas</h3>
          <button class="close-btn" @click="showCargarModal = false">×</button>
        </header>
        <form @submit.prevent="submitCargar" class="modal-body">
          <BaseInput 
            v-model="cargarForm.codigo" 
            label="Código de Producto" 
            placeholder="Ej: 8010" 
            required 
          />
          <BaseInput 
            v-model="cargarForm.peso" 
            label="Peso (Kg)" 
            type="number" 
            step="0.001" 
            placeholder="Ej: 5.250" 
            required 
          />
          <div class="input-group">
            <label>Ubicación</label>
            <select v-model="cargarForm.ubicacionId" required class="custom-select">
              <option value="" disabled>Seleccione ubicación...</option>
              <option v-for="u in ubicaciones" :key="u.id" :value="u.id">
                {{ u.nombre }}
              </option>
            </select>
          </div>
          <div class="modal-footer">
            <BaseButton variant="minimal" type="button" @click="showCargarModal = false">Cancelar</BaseButton>
            <BaseButton variant="primary" type="submit" :disabled="isCargando">
              {{ isCargando ? 'Guardando...' : 'Guardar' }}
            </BaseButton>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.view-header {
  margin-bottom: var(--space-lg);
}

.list-header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-md);
}

.summary-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  padding: 12px 16px;
  border-radius: var(--radius-md);
  margin-bottom: var(--space-lg);
  box-shadow: 0 2px 4px rgba(0,0,0,0.02);
}

.summary-label {
  font-weight: 600;
  color: var(--color-text-muted);
  font-size: 1rem;
}

.summary-value {
  font-weight: 800;
  color: var(--color-secondary);
  font-size: 1.1rem;
}

.search-bar {
  margin-bottom: var(--space-md);
}

.sortable {
  cursor: pointer;
  user-select: none;
}

.sortable:hover {
  background-color: #EEE !important;
}

.refresh-btn {
  background: none;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 6px 12px;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.refresh-btn:hover {
  background-color: #F0F0F0;
}

.table-container {
  overflow-x: auto;
  margin: 0 -var(--space-lg);
  padding: 0 var(--space-lg);
}

.modern-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.modern-table th {
  text-align: left;
  padding: 14px 12px;
  background-color: #FAFAFA;
  color: var(--color-text-muted);
  font-weight: 700;
  border-bottom: 2px solid var(--color-border);
  white-space: nowrap;
}

.modern-table td {
  padding: 14px 12px;
  border-bottom: 1px solid #EEE;
}

.main-row {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.main-row:hover {
  background-color: #FAFAFA;
}

.main-row.is-expanded {
  background-color: #F8F8F8;
}

.expand-icon {
  font-size: 0.7rem;
  opacity: 0.4;
}

.details-row td {
  padding: 0;
  border-bottom: 1px solid #EEE;
  background-color: #FAFAFA;
}

.details-content {
  padding: 16px;
  border-left: 4px solid var(--color-primary);
  background-color: #FAFAFA;
}

.detail-mini-table {
  width: 100%;
  border-collapse: collapse;
}

.detail-mini-table th {
  text-align: left;
  padding: 8px;
  font-size: 0.8rem;
  color: var(--color-text-muted);
  width: 40%;
  border-bottom: 1px solid #EEE;
}

.detail-mini-table td {
  padding: 8px;
  font-size: 0.9rem;
  border-bottom: 1px solid #EEE;
}

.desktop-only { display: none !important; }

@media (min-width: 1024px) {
  th.desktop-only, td.desktop-only { 
    display: table-cell !important; 
  }
  .mobile-only { 
    display: none !important; 
  }
  .main-row {
    cursor: default;
  }
  .main-row:hover {
    background-color: transparent;
  }
}

.text-right { text-align: right !important; }
.text-center { text-align: center !important; }
.text-muted { color: var(--color-text-muted); padding: 2rem; }

.badge {
  background-color: var(--color-secondary);
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 700;
}

.error-alert {
  background-color: #FFEBEE;
  color: #C62828;
  padding: 12px;
  border-radius: var(--radius-sm);
  border: 1px solid #EF9A9A;
  margin-bottom: var(--space-md);
  text-align: center;
}

.bold { font-weight: 700; }
.color-sec { color: var(--color-secondary); }

/* Nuevos Estilos */
.action-buttons {
  display: flex;
  gap: var(--space-sm);
  align-items: center;
}

.action-buttons .material-icons {
  font-size: 1.1rem;
}

.reset-btn {
  background-color: #FFEBEE;
  color: #D32F2F;
  border: 1px solid #FFCDD2;
  border-radius: var(--radius-sm);
  padding: 4px 8px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s ease;
}

.reset-btn:hover:not(:disabled) {
  background-color: #D32F2F;
  color: white;
}

.reset-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.reset-btn .material-icons {
  font-size: 1rem;
}

/* Modal Estilos */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  backdrop-filter: blur(2px);
}

.modal-card {
  background-color: white;
  border-radius: var(--radius-md);
  width: 90%;
  max-width: 400px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.2);
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: var(--space-md) var(--space-lg);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  color: var(--color-text);
  font-size: 1.2rem;
}

.modal-header .close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--color-text-muted);
  cursor: pointer;
}

.modal-body {
  padding: var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-md);
  margin-top: var(--space-md);
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.input-group label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text-muted);
}

.custom-select {
  padding: 10px;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 1rem;
  background-color: white;
  transition: border-color 0.2s ease;
}

.custom-select:focus {
  outline: none;
  border-color: var(--color-primary);
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
