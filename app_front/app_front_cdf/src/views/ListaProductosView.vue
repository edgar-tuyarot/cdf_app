<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import BaseCard from '../components/BaseCard.vue'
import BaseButton from '../components/BaseButton.vue'
import BaseInput from '../components/BaseInput.vue'

const productos = ref([])
const isLoading = ref(true)
const error = ref('')
const searchQuery = ref('')
const expandedRow = ref(null)
const router = useRouter()
const sortKey = ref('nombre')
const sortOrder = ref('asc')
const fileInput = ref(null)
const isUploading = ref(false)
const uploadMessage = ref({ text: '', type: '' })

const fetchProductos = async () => {
  isLoading.value = true
  error.value = ''
  try {
    const response = await fetch('/api/productos')
    if (!response.ok) {
      throw new Error('Error al cargar los productos')
    }
    const data = await response.json()
    productos.value = data
  } catch (err) {
    error.value = err.message
  } finally {
    isLoading.value = false
  }
}

const filteredAndSortedProductos = computed(() => {
  let result = Array.isArray(productos.value) ? [...productos.value] : []
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(p => 
      (p.codigo?.toLowerCase() || '').includes(query) || 
      (p.nombre?.toLowerCase() || '').includes(query)
    )
  }
  
  result.sort((a, b) => {
    let valA = a[sortKey.value] ?? ''
    let valB = b[sortKey.value] ?? ''
    
    if (typeof valA === 'string' && typeof valB === 'string') {
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

const toggleRow = (codigo) => {
  if (window.innerWidth >= 1024) return // No expand on desktop
  
  if (expandedRow.value === codigo) {
    expandedRow.value = null
  } else {
    expandedRow.value = codigo
  }
}

const triggerFileInput = () => {
  fileInput.value.click()
}

const handleFileUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  isUploading.value = true
  uploadMessage.value = { text: 'Subiendo archivo...', type: 'info' }

  const formData = new FormData()
  formData.append('file', file)

  try {
    const response = await fetch('/api/productos/upload', {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Error al subir el archivo')
    }

    uploadMessage.value = { text: '¡Archivo subido y procesado con éxito!', type: 'success' }
    fetchProductos() // Recargar la lista
    
    // Limpiar mensaje después de unos segundos
    setTimeout(() => {
      uploadMessage.value = { text: '', type: '' }
    }, 5000)

  } catch (err) {
    uploadMessage.value = { text: err.message, type: 'error' }
  } finally {
    isUploading.value = false
    // Limpiar el input para permitir subir el mismo archivo si es necesario
    if (event.target) event.target.value = ''
  }
}

onMounted(() => {
  fetchProductos()
})
</script>

<template>
  <div class="lista-productos-view">
    <header class="view-header">
      <div class="header-main">
        <div>
          <h2>Listado de Productos</h2>
          <p>Consulta todos los productos registrados</p>
        </div>
        <div class="header-actions">
          <input 
            type="file" 
            ref="fileInput" 
            @change="handleFileUpload" 
            style="display: none" 
            accept=".xlsx, .xls"
          >
          <BaseButton @click="triggerFileInput" variant="minimal" size="small" :disabled="isUploading || isLoading">
            {{ isUploading ? 'Subiendo...' : 'Importar Excel' }}
          </BaseButton>
          <BaseButton @click="fetchProductos" variant="minimal" size="small" :disabled="isLoading">
            {{ isLoading ? '...' : 'Actualizar' }}
          </BaseButton>
        </div>
      </div>
    </header>

    <div class="search-bar">
      <BaseInput 
        v-model="searchQuery" 
        placeholder="🔍 Buscar por código o nombre..." 
        class="search-input"
      />
    </div>

    <!-- Notification Area -->
    <div v-if="uploadMessage.text" :class="['upload-notification', uploadMessage.type]">
      <span class="icon">{{ uploadMessage.type === 'success' ? '✅' : (uploadMessage.type === 'error' ? '⚠️' : 'ℹ️') }}</span>
      <p>{{ uploadMessage.text }}</p>
      <button class="close-btn" @click="uploadMessage.text = ''">×</button>
    </div>

    <div class="list-container">
      <div v-if="isLoading" class="loading-state">
        <div class="spinner"></div>
        <p>Cargando productos...</p>
      </div>

      <div v-else-if="error && productos.length === 0" class="error-state">
        <span class="icon">⚠️</span>
        <p>{{ error }}</p>
        <BaseButton @click="fetchProductos">Reintentar</BaseButton>
      </div>

      <div v-else class="table-wrapper">
        <table class="modern-table">
          <thead>
            <tr>
              <th @click="sortBy('codigo')" class="sortable">
                Cód. <span v-if="sortKey === 'codigo'">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span>
              </th>
              <th @click="sortBy('nombre')" class="sortable">
                Nombre <span v-if="sortKey === 'nombre'">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span>
              </th>
              <th @click="sortBy('pesoPorBolsita')" class="desktop-only sortable">
                Peso x Bolsa <span v-if="sortKey === 'pesoPorBolsita'">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span>
              </th>
              <th @click="sortBy('feteable')" class="desktop-only sortable">
                ¿Se Fetea? <span v-if="sortKey === 'feteable'">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span>
              </th>
              <th @click="sortBy('picable')" class="desktop-only sortable">
                ¿Deja Recorte? <span v-if="sortKey === 'picable'">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span>
              </th>
              <th class="text-right desktop-only">Acciones</th>
              <th class="text-right mobile-only"></th>
            </tr>
          </thead>
          <tbody v-for="p in filteredAndSortedProductos" :key="p.codigo">
            <tr class="main-row" @click="toggleRow(p.codigo)" :class="{ 'is-expanded': expandedRow === p.codigo }">
              <td><strong>{{ p.codigo }}</strong></td>
              <td>{{ p.nombre }}</td>
              <td class="desktop-only">{{ p.pesoPorBolsita?.toFixed(2) }} KG</td>
              <td class="desktop-only">
                <span :class="['status-dot', p.feteable ? 'yes' : 'no']"></span>
                {{ p.feteable ? 'Sí' : 'No' }}
              </td>
              <td class="desktop-only">
                <span :class="['status-dot', p.picable ? 'yes' : 'no']"></span>
                {{ p.picable ? 'Sí' : 'No' }}
              </td>
              <td class="text-right desktop-only">
                <BaseButton variant="minimal" size="small" @click.stop="router.push('/productos/editar/' + p.codigo)">
                  Editar
                </BaseButton>
              </td>
              <td class="text-right mobile-only">
                <span class="expand-icon">{{ expandedRow === p.codigo ? '▲' : '▼' }}</span>
              </td>
            </tr>
            <tr v-if="expandedRow === p.codigo" class="details-row mobile-only">
              <td colspan="6">
                <div class="details-content fade-in">
                  <table class="detail-mini-table">
                    <tr>
                      <th>Peso por bolsa</th>
                      <td>{{ p.pesoPorBolsita?.toFixed(2) }} KG</td>
                    </tr>
                    <tr>
                      <th>¿Se fetea?</th>
                      <td><strong>{{ p.feteable ? 'SÍ' : 'NO' }}</strong></td>
                    </tr>
                    <tr>
                      <th>¿Deja recorte?</th>
                      <td><strong>{{ p.picable ? 'SÍ' : 'NO' }}</strong></td>
                    </tr>
                  </table>
                  
                  <div class="details-actions">
                    <BaseButton variant="minimal" size="small" @click.stop="router.push('/productos/editar/' + p.codigo)">
                      Modificar
                    </BaseButton>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        
        <div v-if="filteredAndSortedProductos.length === 0" class="empty-state">
          No se encontraron productos que coincidan con "{{ searchQuery }}".
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.view-header {
  margin-bottom: var(--space-lg);
}

.header-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-md);
}

.header-actions {
  display: flex;
  gap: 12px;
}

.upload-notification {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: var(--radius-md);
  margin-bottom: var(--space-md);
  font-weight: 600;
  font-size: 0.9rem;
  border: 1px solid var(--color-border);
  animation: fadeIn 0.3s ease;
}

.upload-notification.info {
  background-color: #E3F2FD;
  color: #1976D2;
  border-color: #BBDEFB;
}

.upload-notification.success {
  background-color: #E8F5E9;
  color: #2E7D32;
  border-color: #C8E6C9;
}

.upload-notification.error {
  background-color: #FFEBEE;
  color: #C62828;
  border-color: #FFCDD2;
}

.upload-notification p {
  flex: 1;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  opacity: 0.5;
  transition: opacity 0.2s;
}

.close-btn:hover {
  opacity: 1;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.search-bar {
  margin-bottom: var(--space-md);
}

.search-input {
  margin-bottom: 0;
}

.table-wrapper {
  overflow-x: auto;
}

.modern-table {
  width: 100%;
  border-collapse: collapse;
}

.modern-table th {
  text-align: left;
  padding: 16px 12px;
  font-size: 0.8rem;
  color: var(--color-text-muted);
  border-bottom: 2px solid var(--color-border);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.main-row {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.sortable {
  cursor: pointer;
  user-select: none;
}

.sortable:hover {
  background-color: #F0F0F0 !important;
}

.main-row:hover {
  background-color: #FAFAFA;
}

.main-row.is-expanded {
  background-color: #F8F8F8;
}

.main-row td {
  padding: 18px 12px;
  border-bottom: 1px solid #EEE;
  font-size: 1rem;
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
  margin-bottom: 12px;
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

.btn-mini {
  padding: 6px 12px !important;
  font-size: 0.75rem !important;
  width: auto !important;
}

.details-actions {
  display: flex;
  justify-content: flex-end;
}

.text-right {
  text-align: right !important;
}

.badge-group {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.status-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 6px;
}

.status-dot.yes { background-color: #4CAF50; box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2); }
.status-dot.no { background-color: #F44336; box-shadow: 0 0 0 2px rgba(244, 67, 54, 0.2); }

.detail-status-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 4px;
}

.status-line {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  padding-bottom: 4px;
  border-bottom: 1px dashed #EEE;
}

.status-line strong {
  color: var(--color-primary);
}

.loading-state, .error-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-xl);
  text-align: center;
  color: var(--color-text-muted);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--color-border);
  border-top: 4px solid var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: var(--space-md);
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

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 480px) {
  .details-grid {
    grid-template-columns: 1fr;
    gap: var(--space-md);
  }
}
</style>
