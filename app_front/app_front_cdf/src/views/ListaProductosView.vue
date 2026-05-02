<script setup>
import { ref, onMounted, computed } from 'vue'
import BaseCard from '../components/BaseCard.vue'
import BaseButton from '../components/BaseButton.vue'
import BaseInput from '../components/BaseInput.vue'

const productos = ref([])
const isLoading = ref(true)
const error = ref('')
const searchQuery = ref('')
const expandedRow = ref(null)

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
    // Mock data for demo/fallback
    productos.value = [
      { codigo: '8010', nombre: 'Queso Tybo', picable: true, feteable: true, kilosPorBolsita: 3.5 },
      { codigo: '8020', nombre: 'Queso Danbo', picable: false, feteable: true, kilosPorBolsita: 4.2 },
      { codigo: '1005', nombre: 'Salame Milán', picable: false, feteable: true, kilosPorBolsita: 1.8 }
    ]
  } finally {
    isLoading.value = false
  }
}

const filteredProductos = computed(() => {
  if (!searchQuery.value) return productos.value
  const query = searchQuery.value.toLowerCase()
  return productos.value.filter(p => 
    p.codigo.toLowerCase().includes(query) || 
    p.nombre.toLowerCase().includes(query)
  )
})

const toggleRow = (codigo) => {
  if (expandedRow.value === codigo) {
    expandedRow.value = null
  } else {
    expandedRow.value = codigo
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
        <BaseButton @click="fetchProductos" variant="secondary" :disabled="isLoading">
          {{ isLoading ? '...' : '🔄 Actualizar' }}
        </BaseButton>
      </div>
    </header>

    <div class="search-bar">
      <BaseInput 
        v-model="searchQuery" 
        placeholder="🔍 Buscar por código o nombre..." 
        class="search-input"
      />
    </div>

    <BaseCard>
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
              <th>Cód.</th>
              <th>Nombre</th>
              <th class="text-right"></th>
            </tr>
          </thead>
          <tbody v-for="p in filteredProductos" :key="p.codigo">
            <tr class="main-row" @click="toggleRow(p.codigo)" :class="{ 'is-expanded': expandedRow === p.codigo }">
              <td><strong>{{ p.codigo }}</strong></td>
              <td>{{ p.nombre }}</td>
              <td class="text-right">
                <span class="expand-icon">{{ expandedRow === p.codigo ? '▲' : '▼' }}</span>
              </td>
            </tr>
            <tr v-if="expandedRow === p.codigo" class="details-row">
              <td colspan="3">
                <div class="details-content fade-in">
                  <div class="details-grid">
                    <div class="detail-item">
                      <span class="detail-label">Kilos por Bolsita</span>
                      <span class="detail-value">{{ p.kilosPorBolsita }} kg</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">Propiedades</span>
                      <div class="badge-group">
                        <span v-if="p.picable" class="badge badge-picable">Picable</span>
                        <span v-if="p.feteable" class="badge badge-feteable">Feteable</span>
                        <span v-if="!p.picable && !p.feteable" class="badge badge-none">Ninguna</span>
                      </div>
                    </div>
                  </div>
                  <div class="details-actions">
                    <BaseButton variant="secondary" size="small" fullWidth>
                      ✏️ Modificar Producto
                    </BaseButton>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        
        <div v-if="filteredProductos.length === 0" class="empty-state">
          No se encontraron productos que coincidan con "{{ searchQuery }}".
        </div>
      </div>
    </BaseCard>
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
  background-color: #FCFCFC;
}

.details-content {
  padding: 20px;
  border-left: 4px solid var(--color-primary);
}

.details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-lg);
  margin-bottom: var(--space-md);
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
}

.detail-value {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-text);
}

.details-actions {
  margin-top: var(--space-md);
}

.text-right {
  text-align: right;
}

.badge-group {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
}

.badge-picable {
  background-color: #E3F2FD;
  color: #1976D2;
}

.badge-feteable {
  background-color: #E8F5E9;
  color: #2E7D32;
}

.badge-none {
  background-color: #F5F5F5;
  color: #9E9E9E;
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
