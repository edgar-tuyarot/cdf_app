<script setup>
import { ref, onMounted, computed } from 'vue'
import BaseCard from '../components/BaseCard.vue'
import BaseButton from '../components/BaseButton.vue'
import BaseInput from '../components/BaseInput.vue'

const existencias = ref([])
const isLoading = ref(true)
const errorMsg = ref('')
const expandedRow = ref(null)
const searchQuery = ref('')
const sortKey = ref('nombre')
const sortOrder = ref('asc')

const ubicaciones = ref([])
const showEditModal = ref(false)
const isSubmitting = ref(false)
const editForm = ref({
  codigo_producto: '',
  estado: '',
  kilos: 0,
  unidades: 0,
  ubicacionId: ''
})

const estadosProducto = ['PIEZA', 'FETEADO', 'ENVASADO', 'RECORTES', 'DECOMISADO']

const fetchExistencias = async () => {
  isLoading.value = true
  errorMsg.value = ''
  try {
    const res = await fetch('/api/existencias/summary')
    if (res.ok) {
      existencias.value = await res.json()
    } else {
      errorMsg.value = 'Error al cargar las existencias.'
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
  } catch (error) {
    console.error('Error al cargar ubicaciones:', error)
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
    sortOrder.value = 'asc'
  }
}

const toggleRow = (id) => {
  if (window.innerWidth >= 1024) return
  expandedRow.value = expandedRow.value === id ? null : id
}

const openEditModal = (item) => {
  let uId = item.ubicacionId
  if (!uId) {
    const matched = ubicaciones.value.find(u => u.nombre === item.ubicacionNombre)
    if (matched) uId = matched.id
  }

  editForm.value = {
    codigo_producto: item.codigo_producto,
    estado: '',
    kilos: 0,
    unidades: 0,
    ubicacionId: uId || ''
  }
  showEditModal.value = true
}

const submitEdit = async () => {
  if (!editForm.value.estado || editForm.value.ubicacionId === '') {
    alert('Debe seleccionar un estado y una ubicación.')
    return
  }

  isSubmitting.value = true
  try {
    const res = await fetch('/api/existencias', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        codigo_producto: editForm.value.codigo_producto,
        estado: editForm.value.estado,
        kilos: parseFloat(editForm.value.kilos || 0),
        unidades: parseInt(editForm.value.unidades || 0, 10),
        ubicacionId: parseInt(editForm.value.ubicacionId, 10)
      })
    })

    if (res.ok) {
      showEditModal.value = false
      await fetchExistencias()
      alert('Existencia actualizada correctamente.')
    } else {
      alert('Error al actualizar la existencia.')
    }
  } catch (error) {
    alert('Error de conexión con el servidor.')
  } finally {
    isSubmitting.value = false
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
      <h2>Listado de Existencias</h2>
      <p>Resumen general de stock por producto y ubicación</p>
    </header>

    <div class="list-container">
      <div class="search-bar">
        <BaseInput 
          v-model="searchQuery" 
          placeholder="🔍 Buscar por código o nombre..." 
          class="search-input"
        />
      </div>

      <div class="list-header-actions">
        <h3>Stock Actual</h3>
        <button class="refresh-btn" @click="fetchExistencias" :disabled="isLoading">
          {{ isLoading ? '...' : 'Actualizar' }}
        </button>
      </div>

      <div v-if="errorMsg" class="error-alert">
        {{ errorMsg }}
      </div>

      <div class="table-container">
        <table class="modern-table">
          <thead>
            <tr>
              <th @click="sortBy('codigo_producto')" class="sortable">
                Cód. <span v-if="sortKey === 'codigo_producto'">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span>
              </th>
              <th @click="sortBy('nombre')" class="sortable">
                Nombre <span v-if="sortKey === 'nombre'">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span>
              </th>
              <th @click="sortBy('piezas')" class="text-right desktop-only sortable">
                Piezas <span v-if="sortKey === 'piezas'">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span>
              </th>
              <th @click="sortBy('kilos')" class="text-right desktop-only sortable">
                Kilos <span v-if="sortKey === 'kilos'">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span>
              </th>
              <th @click="sortBy('feteados')" class="text-right desktop-only sortable">
                Fracc. <span v-if="sortKey === 'feteados'">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span>
              </th>
              <th @click="sortBy('envasados')" class="text-right desktop-only sortable">
                Envasados <span v-if="sortKey === 'envasados'">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span>
              </th>
              <th @click="sortBy('recortes')" class="text-right desktop-only sortable">
                Recortes <span v-if="sortKey === 'recortes'">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span>
              </th>
              <th @click="sortBy('decomisados')" class="text-right desktop-only sortable">
                Decomiso <span v-if="sortKey === 'decomisados'">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span>
              </th>
              <th @click="sortBy('ubicacionNombre')" class="text-right desktop-only sortable">
                Ubic. <span v-if="sortKey === 'ubicacionNombre'">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span>
              </th>
              <th class="text-center desktop-only">Acción</th>
              <th class="text-right mobile-only"></th>
            </tr>
          </thead>
          <tbody v-for="item in filteredAndSortedExistencias" :key="item.codigo_producto + item.ubicacionNombre">
            <tr class="main-row" @click="toggleRow(item.codigo_producto + item.ubicacionNombre)" :class="{ 'is-expanded': expandedRow === (item.codigo_producto + item.ubicacionNombre) }">
              <td><strong>{{ item.codigo_producto }}</strong></td>
              <td>{{ item.nombre }}</td>
              <td class="text-right desktop-only">{{ item.piezas }}</td>
              <td class="text-right desktop-only">{{ item.kilos.toFixed(3) }}</td>
              <td class="text-right desktop-only">{{ (item.feteados || 0).toFixed(0) }}</td>
              <td class="text-right desktop-only">{{ (item.envasados || 0).toFixed(0) }}</td>
              <td class="text-right desktop-only">{{ (item.recortes || 0).toFixed(3) }}</td>
              <td class="text-right desktop-only">{{ (item.decomisados || 0).toFixed(3) }}</td>
              <td class="text-right desktop-only"><span class="badge">{{ item.ubicacionNombre }}</span></td>
              <td class="text-center desktop-only">
                <button class="action-btn" @click.stop="openEditModal(item)" title="Corregir">
                  <span class="material-icons">edit</span>
                </button>
              </td>
              <td class="text-right mobile-only">
                <span class="expand-icon">{{ expandedRow === (item.codigo_producto + item.ubicacionNombre) ? '▲' : '▼' }}</span>
              </td>
            </tr>
            <tr v-if="expandedRow === (item.codigo_producto + item.ubicacionNombre)" class="details-row mobile-only">
              <td colspan="10">
                <div class="details-content fade-in">
                  <table class="detail-mini-table">
                    <tbody>
                      <tr>
                        <th>Ubicación</th>
                        <td><span class="badge">{{ item.ubicacionNombre }}</span></td>
                      </tr>
                      <tr>
                        <th>Piezas</th>
                        <td><strong>{{ item.piezas }}</strong></td>
                      </tr>
                      <tr>
                        <th>Kilos</th>
                        <td><strong>{{ item.kilos.toFixed(3) }}</strong></td>
                      </tr>
                      <tr>
                        <th>Fraccionados</th>
                        <td><strong>{{ (item.feteados || 0).toFixed(0) }}</strong></td>
                      </tr>
                      <tr>
                        <th>Envasados</th>
                        <td><strong>{{ (item.envasados || 0).toFixed(0) }}</strong></td>
                      </tr>
                      <tr v-if="item.recortes">
                        <th>Recortes</th>
                        <td><strong>{{ item.recortes.toFixed(3) }} kg</strong></td>
                      </tr>
                      <tr v-if="item.decomisados">
                        <th>Decomisados</th>
                        <td class="warn-text"><strong>{{ item.decomisados.toFixed(3) }} kg</strong></td>
                      </tr>
                      <tr>
                        <th>Acción</th>
                        <td>
                          <button class="action-btn-text" @click.stop="openEditModal(item)">
                            <span class="material-icons">edit</span> Corregir
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </td>
            </tr>
          </tbody>
          <tbody v-if="existencias.length === 0 && !isLoading">
            <tr>
              <td colspan="10" class="text-center text-muted">No hay existencias registradas.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Editar Existencia -->
    <div v-if="showEditModal" class="modal-overlay">
      <div class="modal-card">
        <header class="modal-header">
          <h3>Corregir Existencia</h3>
          <button class="close-btn" @click="showEditModal = false">×</button>
        </header>
        <form @submit.prevent="submitEdit" class="modal-body">
          <BaseInput 
            v-model="editForm.codigo_producto" 
            label="Código" 
            disabled 
          />
          <div class="input-group">
            <label>Estado a modificar</label>
            <select v-model="editForm.estado" required class="custom-select">
              <option value="" disabled>Seleccione estado...</option>
              <option v-for="est in estadosProducto" :key="est" :value="est">
                {{ est }}
              </option>
            </select>
          </div>
          <div class="input-group">
            <label>Ubicación</label>
            <select v-model="editForm.ubicacionId" required class="custom-select">
              <option value="" disabled>Seleccione ubicación...</option>
              <option v-for="u in ubicaciones" :key="u.id" :value="u.id">
                {{ u.nombre }}
              </option>
            </select>
          </div>
          <BaseInput 
            v-model="editForm.kilos" 
            label="Kilos Totales (Nuevo Valor)" 
            type="number" 
            step="0.001" 
            required 
          />
          <BaseInput 
            v-model="editForm.unidades" 
            label="Unidades (Nuevo Valor)" 
            type="number" 
            required 
          />
          <div class="modal-footer">
            <BaseButton variant="minimal" type="button" @click="showEditModal = false">Cancelar</BaseButton>
            <BaseButton variant="primary" type="submit" :disabled="isSubmitting">
              {{ isSubmitting ? 'Guardando...' : 'Guardar' }}
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
  margin: 0 -var(--space-lg); /* Expand to card edges if desired */
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
  transition: transform 0.3s ease;
}

.details-row td {
  padding: 0;
  border-bottom: 1px solid #EEE;
  background-color: #FAFAFA;
  width: 100%;
}

.details-content {
  padding: 16px;
  border-left: 4px solid var(--color-primary);
  background-color: #FAFAFA;
  width: 100%;
  box-sizing: border-box;
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
  .desktop-only:not(th):not(td) {
    display: block !important;
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
  border: 1px solid var(--color-border);
}

.bold { font-weight: 700; }
.color-sec { color: var(--color-secondary); }

/* Acciones y Modal */
.action-btn {
  background: none;
  border: 1px solid var(--color-border);
  color: var(--color-primary);
  border-radius: var(--radius-sm);
  padding: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.action-btn:hover {
  background-color: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.action-btn .material-icons {
  font-size: 1.1rem;
}

.action-btn-text {
  background: none;
  border: none;
  color: var(--color-primary);
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  padding: 4px 0;
}

.action-btn-text:hover {
  text-decoration: underline;
}

.action-btn-text .material-icons {
  font-size: 1.1rem;
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
  max-width: 450px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.2);
  display: flex;
  flex-direction: column;
  max-height: 90vh;
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
  overflow-y: auto;
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

.error-alert {
  background-color: #FFEBEE;
  color: #C62828;
  padding: 12px;
  border-radius: var(--radius-sm);
  border: 2px solid #EF9A9A;
  margin-bottom: var(--space-md);
  text-align: center;
}

.warn-text {
  color: #C62828;
}
</style>
